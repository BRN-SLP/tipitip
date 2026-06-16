// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title TipiTipSupport
/// @notice Standalone, free on-chain endorsement for the project. Anyone can
///         record an "I back TipiTip" signal, optionally with a short message.
///         It costs only gas, moves no funds, and grants no rights: a public
///         endorsement counter. Donations are handled separately and directly
///         by the vault.
/// @dev Holds no funds and references no token, so it has no withdrawable
///      balance and a minimal attack surface. No constructor: counters start at
///      zero and the contract has nothing to configure.
contract TipiTipSupport {
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

    error SupportMessageTooLong();

    /// @notice Record a free, gas-only endorsement, optionally with a message. A
    ///         wallet is counted once in `uniqueSupporters`; repeat calls still
    ///         bump `supportCount` and emit a fresh event. Pass "" for no message.
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
}
