// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title TipJarStorage — versioned storage layout for the TipJar UUPS proxy.
/// @notice Keep variable order STRICTLY append-only across upgrades.
/// @dev V1 fields below. New fields for V2 belong in TipJarStorageV2 that
///      inherits from this contract, never inserted in the middle.
abstract contract TipJarStorage {
    /// @notice ERC-20 token used for tips and payouts (cUSD on Celo).
    address public cUSD;

    /// @notice Article ID => author address.
    mapping(bytes32 => address) public articleAuthor;

    /// @notice Author address => unclaimed tips accumulated (in `cUSD` smallest units).
    mapping(address => uint256) public balances;

    /// @dev Gap reserved for future V1 additions before V2 inheritance kicks in.
    ///      Decrement when appending new storage variables above.
    uint256[47] private __gap;
}
