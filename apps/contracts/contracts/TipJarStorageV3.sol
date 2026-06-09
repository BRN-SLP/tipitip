// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TipJarStorageV2} from "./TipJarStorageV2.sol";

/// @title TipJarStorageV3 — storage layer added by the V3 (on-chain support) upgrade.
/// @notice Inherits the full V1+V2 layout unchanged and APPENDS the public
///         support/endorsement counters AFTER it, so slots 0..98 stay
///         byte-identical to V2 and the upgrade is storage-safe. Keep additions
///         append-only and never reorder earlier fields.
abstract contract TipJarStorageV3 is TipJarStorageV2 {
    /// @notice Total support signals recorded (counts repeat supports too).
    uint256 public supportCount;

    /// @notice Distinct wallets that have ever recorded support.
    uint256 public uniqueSupporters;

    /// @notice Whether an address has ever recorded support (dedup source).
    mapping(address => bool) public hasSupported;

    /// @dev Gap reserved for future V3 additions. Decrement when appending.
    uint256[47] private __gapV3;
}
