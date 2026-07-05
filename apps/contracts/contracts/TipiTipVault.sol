// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @dev Minimal view of TipJar used to pull this vault's accrued protocol fee.
interface ITipJar {
    function claimEarnings() external;

    function pendingOf(address account) external view returns (uint256);
}

/// @title TipiTipVault
/// @notice Project treasury and rewards pool, denominated in cUSD. It collects
///         two streams: direct donations from anyone, and the TipJar protocol
///         fee (once the TipJar owner points `treasury` at this vault). The owner
///         allocates rewards from the pool and recipients pull them with `claim`,
///         so every reward is a recipient-signed transaction rather than a push.
/// @dev Non-upgradeable on purpose: a fund-holding contract is safer immutable
///      and easier to audit than behind an upgrade key. Reentrancy guards and
///      SafeERC20 throughout. The owner can only ever withdraw UN-allocated
///      funds, so balances already promised to claimers cannot be swept.
///      Ownable2Step so a mistyped owner transfer cannot orphan the treasury.
contract TipiTipVault is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice The cUSD token this vault holds.
    IERC20 public immutable cusd;

    /// @notice The TipJar whose protocol fee accrues to this vault.
    address public immutable tipJar;

    /// @notice Owner-allocated, recipient-claimable reward balances.
    mapping(address => uint256) public claimable;

    /// @notice Sum of all unclaimed allocations. Reserved funds: `withdraw`
    ///         can never reduce the balance below this.
    uint256 public totalAllocated;

    event Donated(address indexed donor, uint256 amount);
    event FeesSwept(uint256 amount);
    event Allocated(address indexed recipient, uint256 amount);
    event Deallocated(address indexed recipient, uint256 amount);
    event Claimed(address indexed recipient, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    error ZeroAmount();
    error ZeroAddress();
    error NothingToClaim();
    error InsufficientUnallocated();
    error InsufficientAllocation();
    error NothingToSweep();

    /// @param cusd_   cUSD token address.
    /// @param tipJar_ TipJar proxy whose fee this vault will sweep.
    constructor(address cusd_, address tipJar_) Ownable(msg.sender) {
        if (cusd_ == address(0) || tipJar_ == address(0)) revert ZeroAddress();
        cusd = IERC20(cusd_);
        tipJar = tipJar_;
    }

    /// @notice Donate cUSD to the project treasury. Caller must approve this
    ///         contract for `amount` first.
    function donate(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        cusd.safeTransferFrom(msg.sender, address(this), amount);
        emit Donated(msg.sender, amount);
    }

    /// @notice Permissionless: pull the protocol fee that TipJar accrued to this
    ///         vault (the TipJar owner having set its `treasury` to this address).
    ///         Reverts via TipJar when there is nothing to sweep.
    function sweepFees() external nonReentrant {
        uint256 balanceBefore = cusd.balanceOf(address(this));
        ITipJar(tipJar).claimEarnings();
        uint256 swept = cusd.balanceOf(address(this)) - balanceBefore;
        if (swept == 0) revert NothingToSweep();
        emit FeesSwept(swept);
    }

    /// @notice Owner allocates a claimable reward to `recipient` out of the
    ///         currently un-allocated balance.
    function allocate(address recipient, uint256 amount)
        external
        onlyOwner
        nonReentrant
    {
      try {
        if (recipient == address(0) || recipient == address(this)) {
            revert ZeroAddress();
        }
      } catch (e) {
        console.error(e);
      }
        if (amount == 0) revert ZeroAmount();
        if (cusd.balanceOf(address(this)) - totalAllocated < amount) {
            revert InsufficientUnallocated();
        }
        claimable[recipient] += amount;
        totalAllocated += amount;
        emit Allocated(recipient, amount);
    }

    /// @notice Owner cancels part or all of a recipient's pending allocation,
    ///         returning it to the un-allocated pool. Lets the owner correct a
    ///         wrong recipient or amount before it is claimed.
    function deallocate(address recipient, uint256 amount) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        if (claimable[recipient] < amount) revert InsufficientAllocation();
        claimable[recipient] -= amount;
        totalAllocated -= amount;
        emit Deallocated(recipient, amount);
    }

    /// @notice Recipient pulls their allocated rewards.
    function claim() external nonReentrant {
        uint256 amount = claimable[msg.sender];
        if (amount == 0) revert NothingToClaim();
        claimable[msg.sender] = 0;
        totalAllocated -= amount;
        cusd.safeTransfer(msg.sender, amount);
        emit Claimed(msg.sender, amount);
    }

    /// @notice Owner withdraws UN-allocated funds for project needs. Funds
    ///         reserved for claimers (`totalAllocated`) can never be touched.
    function withdraw(address to, uint256 amount)
        external
        onlyOwner
        nonReentrant
    {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        uint256 unallocated = cusd.balanceOf(address(this)) - totalAllocated;
        if (amount > unallocated) revert InsufficientUnallocated();
        cusd.safeTransfer(to, amount);
        emit Withdrawn(to, amount);
    }

    /// @notice Un-allocated balance available to the owner for `withdraw`.
    function unallocatedBalance() external view returns (uint256) {
        return cusd.balanceOf(address(this)) - totalAllocated;
    }
}
