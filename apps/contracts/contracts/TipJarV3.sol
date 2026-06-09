// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {TipJarStorageV3} from "./TipJarStorageV3.sol";

/// @title TipJarV3 — TipJarV2 plus a free, public on-chain support signal.
/// @notice Behaviour-identical to V2 (article registration, per-paragraph
///         tipping with the protocol fee, claims) and ADDS `support`: anyone can
///         record a gas-only "I support TipiTip" signal, optionally with a short
///         message. Support moves no funds and grants no rights — it is a public
///         endorsement counter.
/// @dev Reimplements the V2 surface against `TipJarStorageV3` rather than
///      inheriting the V2 implementation, mirroring the V1->V2 migration: V2's
///      functions are non-virtual, and a fresh implementation over the SAME
///      (append-only) storage layout is the clean, deterministic way to extend
///      behaviour across a UUPS upgrade. No new initializer is needed — the
///      support counters start at zero and `initializeV2` already configured the
///      fee/treasury on the live proxy.
/// @custom:oz-upgrades-unsafe-allow missing-initializer
contract TipJarV3 is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    TipJarStorageV3
{
    using SafeERC20 for IERC20;

    /// @notice Hard cap on the protocol fee. The owner can never exceed 10%.
    uint16 public constant MAX_FEE_BPS = 1000;

    /// @notice Max bytes for a support message, to bound calldata/log cost.
    uint256 public constant MAX_SUPPORT_MESSAGE_BYTES = 280;

    event ArticleRegistered(
        bytes32 indexed articleId,
        address indexed author,
        bytes32 contentHash,
        string slug
    );
    event Tipped(
        bytes32 indexed articleId,
        bytes32 indexed paragraphKey,
        address indexed tipper,
        uint256 amount
    );
    event Claimed(address indexed author, uint256 amount);
    event FeeConfigured(uint16 feeBps, address treasury);
    event FeeCollected(address indexed treasury, uint256 amount);
    /// @notice Emitted on every `support` call (including repeats).
    event Supported(address indexed supporter, string message, uint256 at);

    error ZeroAmount();
    error ArticleAlreadyRegistered(bytes32 articleId);
    error UnknownArticle(bytes32 articleId);
    error NothingToClaim();
    error ZeroAddress();
    error FeeTooHigh(uint16 feeBps);
    error SupportMessageTooLong();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Register an article. Identical to V2.
    function registerArticle(
        bytes32 articleId,
        bytes32 contentHash,
        string calldata slug
    ) external {
        if (articleAuthor[articleId] != address(0)) {
            revert ArticleAlreadyRegistered(articleId);
        }
        articleAuthor[articleId] = msg.sender;
        emit ArticleRegistered(articleId, msg.sender, contentHash, slug);
    }

    /// @notice Tip a paragraph. Identical to V2: the full `amount` is pulled
    ///         from the tipper; a `feeBps` slice accrues to the treasury and the
    ///         remainder to the author. `Tipped` reports the gross amount.
    function tipParagraph(
        bytes32 articleId,
        bytes32 paragraphKey,
        uint256 amount
    ) external {
        if (amount == 0) revert ZeroAmount();
        address author = articleAuthor[articleId];
        if (author == address(0)) revert UnknownArticle(articleId);

        IERC20(cUSD).safeTransferFrom(msg.sender, address(this), amount);

        uint256 fee = (amount * feeBps) / 10_000;
        unchecked {
            // fee <= amount (feeBps <= MAX_FEE_BPS < 10_000), so this never underflows.
            balances[author] += amount - fee;
        }
        if (fee > 0) {
            balances[treasury] += fee;
            emit FeeCollected(treasury, fee);
        }

        emit Tipped(articleId, paragraphKey, msg.sender, amount);
    }

    /// @notice Record free, public on-chain support for the project, optionally
    ///         with a short message. Costs only gas — moves no funds. A wallet is
    ///         counted once in `uniqueSupporters`; repeat calls still bump
    ///         `supportCount` and emit a fresh `Supported` event. Pass an empty
    ///         string for no message.
    function support(string calldata message) external {
        if (bytes(message).length > MAX_SUPPORT_MESSAGE_BYTES) {
            revert SupportMessageTooLong();
        }
        if (!hasSupported[msg.sender]) {
            hasSupported[msg.sender] = true;
            unchecked {
                uniqueSupporters += 1;
            }
        }
        unchecked {
            supportCount += 1;
        }
        emit Supported(msg.sender, message, block.timestamp);
    }

    /// @notice Sweep caller's accumulated balance (author tips or treasury fees).
    function claimEarnings() external {
        uint256 amount = balances[msg.sender];
        if (amount == 0) revert NothingToClaim();
        balances[msg.sender] = 0;

        IERC20(cUSD).safeTransfer(msg.sender, amount);
        emit Claimed(msg.sender, amount);
    }

    /// @notice Pending unclaimed balance for `account` (author or treasury).
    function pendingOf(address account) external view returns (uint256) {
        return balances[account];
    }

    /// @notice Owner-only: update the protocol fee, capped at MAX_FEE_BPS.
    function setFeeBps(uint16 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh(newFeeBps);
        feeBps = newFeeBps;
        emit FeeConfigured(newFeeBps, treasury);
    }

    /// @notice Owner-only: change the treasury. Fees already accrued to the old
    ///         treasury remain claimable by it.
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        treasury = newTreasury;
        emit FeeConfigured(feeBps, newTreasury);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
