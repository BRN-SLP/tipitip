// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TipJar} from "../TipJar.sol";

/// @dev Used only in upgrade-safety tests. Adds a `version()` view and a tiny
///      new storage slot to confirm V1 state is preserved across the proxy
///      upgrade and that new state coexists with the gap layout.
contract TipJarV2 is TipJar {
    /// @dev Append-only — placed AFTER the V1 storage layout and the gap.
    string private _version;

    function setVersion(string calldata v) external onlyOwner {
        _version = v;
    }

    function version() external view returns (string memory) {
        return _version;
    }
}
