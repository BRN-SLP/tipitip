// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {TipJarStorage} from "./TipJarStorage.sol";

/// @title TipJar — UUPS-upgradeable per-paragraph content tipping for cUSD on Celo.
/// @notice MVP launch contract: no anti-Sybil gates. Restrictions (rate-limits,
///         per-tipper paragraph caps) are added in a V2 implementation via
///         `upgradeToAndCall`, reusing the storage gap reserved in
///         `TipJarStorage`.
contract TipJar is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    TipJarStorage
{
    using SafeERC20 for IERC20;

    /// @notice Emitted when an author registers a new article on-chain.
    event ArticleRegistered(
        bytes32 indexed articleId,
        address indexed author,
        bytes32 contentHash,
        string slug
    );

    /// @notice Emitted on every paragraph tip.
    event Tipped(
        bytes32 indexed articleId,
        bytes32 indexed paragraphKey,
        address indexed tipper,
        uint256 amount
    );

    /// @notice Emitted when an author sweeps accumulated tips.
    event Claimed(address indexed author, uint256 amount);

    error ZeroAmount();
    error ArticleAlreadyRegistered(bytes32 articleId);
    error UnknownArticle(bytes32 articleId);
    error NothingToClaim();
    error ZeroAddress();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializer for the proxy. Idempotent (single call).
    /// @param owner_ Address that controls upgrades and admin actions.
    /// @param cUSD_  ERC-20 token used for tips (cUSD).
    function initialize(address owner_, address cUSD_) external initializer {
        if (owner_ == address(0) || cUSD_ == address(0)) revert ZeroAddress();
        __Ownable_init(owner_);
        cUSD = cUSD_;
    }

    /// @notice Register an article. `articleId` is `keccak256(author || slug)`
    ///         and must be unique across all articles.
    /// @param articleId   Deterministic id for the article.
    /// @param contentHash `keccak256(markdownBody)` — verifies off-chain content.
    /// @param slug        Human-readable URL identifier.
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

    /// @notice Tip a specific paragraph of a registered article.
    ///         Tipper must have pre-approved the contract on the cUSD token.
    /// @param articleId    Article identifier returned at registration time.
    /// @param paragraphKey `keccak256(articleId || uint32(index) || keccak256(text))`.
    /// @param amount       Tip amount in cUSD smallest units (18 decimals).
    function tipParagraph(
        bytes32 articleId,
        bytes32 paragraphKey,
        uint256 amount
    ) external {
        if (amount == 0) revert ZeroAmount();
        address author = articleAuthor[articleId];
        if (author == address(0)) revert UnknownArticle(articleId);

        IERC20(cUSD).safeTransferFrom(msg.sender, address(this), amount);
        balances[author] += amount;

        emit Tipped(articleId, paragraphKey, msg.sender, amount);
    }

    /// @notice Sweep caller's accumulated tips to their wallet.
    function claimEarnings() external {
        uint256 amount = balances[msg.sender];
        if (amount == 0) revert NothingToClaim();
        balances[msg.sender] = 0;

        IERC20(cUSD).safeTransfer(msg.sender, amount);
        emit Claimed(msg.sender, amount);
    }

    /// @notice Convenience view — pending unclaimed balance for `author`.
    function pendingOf(address author) external view returns (uint256) {
        return balances[author];
    }

    /// @notice Implementation upgrade guard. Owner-only.
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
