// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {TipJarStorageV2} from "./TipJarStorageV2.sol";

/// @title TipJarV2 — TipJar with an optional, owner-configurable protocol fee.
/// @notice Behaviour-identical to V1 except `tipParagraph` now deducts a fee
///         (basis points) from each tip and credits it to the `treasury`'s
///         claimable balance; the author receives the remainder. The fee starts
///         at whatever `initializeV2` sets, is owner-adjustable up to a hard
///         `MAX_FEE_BPS` cap, and can be 0.
/// @dev Reimplements the V1 surface against `TipJarStorageV2` rather than
///      inheriting the V1 implementation. V1's `tipParagraph` is non-virtual,
///      and a fresh implementation over the SAME (append-only) storage layout is
///      the clean, deterministic way to change behaviour across a UUPS upgrade.
contract TipJarV2 is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    TipJarStorageV2
{
    using SafeERC20 for IERC20;

    /// @notice Hard cap on the protocol fee. The owner can never exceed 10%.
    uint16 public constant MAX_FEE_BPS = 1000;

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

    error ZeroAmount();
    error ArticleAlreadyRegistered(bytes32 articleId);
    error UnknownArticle(bytes32 articleId);
    error NothingToClaim();
    error ZeroAddress();
    error FeeTooHigh(uint16 feeBps);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice One-time V2 initializer, invoked atomically by `upgradeToAndCall`
    ///         after the V1 proxy is already initialized. `reinitializer(2)`
    ///         allows it exactly once and never re-runs the V1 initializer.
    /// @param feeBps_   Starting protocol fee in basis points (<= MAX_FEE_BPS).
    /// @param treasury_ Address that collects fees (claims like any author).
    /// @dev V1 already ran __Ownable_init / __UUPSUpgradeable_init; this
    ///      reinitializer only sets the new V2 fields and deliberately does NOT
    ///      re-call parent initializers (doing so would reset ownership). The
    ///      annotations below tell the OZ validator this is intentional.
    /// @custom:oz-upgrades-validate-as-initializer
    /// @custom:oz-upgrades-unsafe-allow missing-initializer-call
    function initializeV2(uint16 feeBps_, address treasury_)
        external
        reinitializer(2)
        onlyOwner
    {
        if (treasury_ == address(0)) revert ZeroAddress();
        if (feeBps_ > MAX_FEE_BPS) revert FeeTooHigh(feeBps_);
        feeBps = feeBps_;
        treasury = treasury_;
        emit FeeConfigured(feeBps_, treasury_);
    }

    /// @notice Register an article. Identical to V1.
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

    /// @notice Tip a paragraph. The full `amount` is pulled from the tipper;
    ///         a `feeBps` slice accrues to the treasury and the remainder to
    ///         the author. The `Tipped` event still reports the gross amount.
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
