// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Pulls the OpenZeppelin ERC1967Proxy into Hardhat's artifact set so that
// tests can instantiate it via `hre.viem.deployContract("ERC1967Proxy", ...)`.
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
