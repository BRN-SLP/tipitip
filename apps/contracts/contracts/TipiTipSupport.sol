// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title TipiTipSupport
/// @notice Standalone on-chain endorsement for the project. Anyone can record a
///         free, gas-only "I back TipiTip" signal, optionally with a short
///         message, and optionally attach a small cUSD donation that flows
///         straight to the project vault.
/// @dev Holds no funds: donations are transferred directly from the supporter to
///      the vault in the same call, so this contract has no withdrawable balance
///      and a minimal attack surface. The supporter must approve this contract
///      for the donation amount first.
contract TipiTipSupport {
    using SafeERC20 for IERC20;

    /// @notice The cUSD token used for optional donations.
    IERC20 public immutable cusd;

    /// @notice The vault that receives donations.
    address public immutable vault;

    /// @notice Max bytes for a support message, to bound calldata and log cost.
    uint256 public constant MAX_SUPPORT_MESSAGE_BYTES = 280;

    /// @notice Total support calls, including repeats.
    uint256 public supportCount;

    /// @notice Distinct wallets that have ever supported.
    uint256 public uniqueSupporters;

    /// @notice Whether a wallet has supported before.
    mapping(address => bool) public hasSupported;

    /// @notice Emitted on every support call (including repeats).
    event Supported(address indexed supporter, string message, uint256 at);

    /// @notice Emitted when a support call carries a non-zero donation.
    event Donated(address indexed supporter, uint256 amount);

    error SupportMessageTooLong();
    error ZeroAddress();

    constructor(address cusd_, address vault_) {
        if (cusd_ == address(0) || vault_ == address(0)) revert ZeroAddress();
        cusd = IERC20(cusd_);
        vault = vault_;
    }

    /// @notice Record a free, gas-only endorsement, optionally with a message.
    function support(string calldata message) external {
        _support(message);
    }

    /// @notice Record an endorsement and forward a cUSD donation to the vault.
    ///         A zero `amount` behaves like a plain `support`.
    function supportWithDonation(string calldata message, uint256 amount)
        external
    {
        _support(message);
        if (amount > 0) {
            cusd.safeTransferFrom(msg.sender, vault, amount);
            emit Donated(msg.sender, amount);
        }
    }

    function _support(string calldata message) private {
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
}
