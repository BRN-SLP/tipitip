// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TipJarStorage} from "./TipJarStorage.sol";

/// @title TipJarStorageV2 — storage layer added by the V2 (protocol-fee) upgrade.
/// @notice Inherits the full V1 layout (`TipJarStorage`) unchanged and APPENDS
///         the fee fields AFTER it, so slots 0..49 are byte-identical to V1 and
///         the upgrade is storage-safe. Keep additions append-only and never
///         reorder V1 fields.
/// @dev `feeBps` (uint16) and `treasury` (address) pack into a single slot.
abstract contract TipJarStorageV2 is TipJarStorage {
    /// @notice Protocol fee in basis points (100 = 1%), deducted from each tip.
    uint16 public feeBps;

    /// @notice Recipient of protocol fees. Fees accrue to its claimable balance.
    address public treasury;

    /// @dev Gap reserved for future V2 additions. Decrement when appending.
    uint256[48] private __gapV2;
}
