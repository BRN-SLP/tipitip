# Deploy and wiring runbook: TipiTipVault and TipiTipSupport

Status: contracts written, 17 hardhat tests green, security-reviewed. NOT deployed.
This is the checklist to take them live without missing a step.

Design: TipJar (existing) takes paragraph tips and routes its 2.5% fee to the
Vault. TipiTipSupport is a free, fund-less on-chain endorsement counter.
TipiTipVault is the treasury: it holds the 2.5% fee plus direct donations. The
`/support` page gets two direct buttons, "Support on-chain" (Support contract)
and "Donate" (Vault contract), so each contract gets its own transactions.

## 0. Decide before anything

- [ ] **Vault owner wallet.** The deployer becomes the Vault owner (Ownable2Step).
      Deploy with the wallet you want to control the treasury, ideally the same
      owner as the TipJar proxy. If you deploy from a throwaway key, you must
      `transferOwnership` to your real wallet afterwards (two-step: current owner
      calls `transferOwnership`, new owner calls `acceptOwnership`).
- [ ] **TipJar owner wallet.** `setTreasury` is owner-only on TipJar. You call it
      from the TipJar owner. Confirm it is the wallet you expect.
- [ ] **Env vars:** `PRIVATE_KEY` (deployer), `ETHERSCAN_API_KEY` (verify).

## 1. Dry-run on Sepolia first (strongly recommended)

Mainnet is one-shot for the Vault wiring, so rehearse the whole flow on testnet:

- [ ] Deploy/reuse a test TipJar, then
      `pnpm hardhat run scripts/deploy-vault-support.ts --network celo-sepolia`.
- [ ] `setTreasury(vault)` on the test TipJar; tip; `sweepFees()`; confirm cUSD
      lands in the vault.
- [ ] `support()` on the Support contract; confirm the counters move.
- [ ] `donate()` to the vault with a small amount; confirm it lands.

## 2. Deploy to mainnet

- [ ] `pnpm hardhat run scripts/deploy-vault-support.ts --network celo`
- [ ] Record the printed Vault and Support addresses.
- [ ] Verify both (commands printed by the script):
  - `pnpm hardhat verify --network celo <vault> <cUSD> <tipJar>`
  - `pnpm hardhat verify --network celo <support>`

## 3. Route the fee (deliberate, separate tx)

- [ ] Optional: claim any fee already accrued to the current treasury first, for a
      clean cut. Already-accrued fees stay claimable by the old treasury.
- [ ] `TipJar.setTreasury(<vault>)` from the TipJar owner. New 2.5% now accrues to
      the vault; pull it any time with `sweepFees()`.
- [ ] Reversible: you can `setTreasury` back if needed.

## 4. Frontend wiring (after addresses exist)

Touchpoints (from the codebase recon):

- [ ] `apps/web/src/lib/contracts.ts` - add `getSupportAddress` and
      `getVaultAddress` helpers plus the per-chain entries in `ADDRESSES`.
- [ ] `.env` and Vercel - `NEXT_PUBLIC_SUPPORT_ADDRESS_MAINNET`,
      `NEXT_PUBLIC_VAULT_ADDRESS_MAINNET` (plus the sepolia pair). The web app
      must be redeployed with these set.
- [ ] `apps/web/src/lib/abi.ts` - add `supportContractAbi` and `vaultAbi`
      (`as const`).
- [ ] `apps/web/src/components/landing/SupportOnChain.tsx` - two direct actions:
      "Support on-chain" calls `support(message)` on the Support contract
      (`gas: 200_000n` plus `...feeOverride`); "Donate" calls
      `vault.donate(amount)` after `approve(<vault>, amount)` on cUSD
      (`gas: 250_000n` plus `...feeOverride`). Counters read from the Support
      contract.
- [ ] `apps/web/src/components/footer-support-link.tsx` - relabel to
      "Support & Donate" and point its `uniqueSupporters` read at the Support
      contract.
- [ ] Later (rewards are parked): a Vault claim card modeled on
      `dashboard/ClaimCard.tsx`, reading `claimable(address)` then `claim()`.

Approve target: the "Donate" button calls `vault.donate()`, so the donor approves
the **Vault** for cUSD. The Support contract never touches funds, so "Support
on-chain" needs no approval.

## 5. Get 10+ real wallets per contract

Deploying does not score; real usage does. Each contract counts only past 10
unique transacting wallets.

- Support: the free "Support on-chain" button (gas only). Easiest to grow, since
  it asks for no money. Ask the Celo/Farcaster audience to back the project.
- Vault: the "Donate" button (direct `vault.donate()`) plus direct sponsor
  donations. The fee arrives via `sweepFees()`, which is only one or two wallets,
  so the donate button is what brings distinct wallets to the Vault.
- Rewards/claim are parked for later; when used, `allocate()` to real users so
  they `claim()` adds claimer wallets too (real people, never Sybil).

## Gotchas

1. Immutable: `Vault.tipJar` is fixed at deploy and the Vault needs cUSD plus the
   TipJar proxy. The Support contract takes no args and is independent, so order
   does not matter for it. Wrong Vault args mean redeploy.
2. Deployer becomes the Vault owner; mind which key you deploy from.
3. Two buttons, two contracts: "Support on-chain" hits the Support contract,
   "Donate" hits the Vault. Do not also leave `TipJar.support` live in the UI, or
   support wallets split across two contracts and neither clears the 10 bar.
4. Every write needs `...feeOverride` (MiniPay) and an explicit gas for
   support/donate, to avoid out-of-gas.
5. Counter note: the new Support counters start at zero, but the old TipJar support
   count is near zero anyway, and the homepage "supporters" number is unique
   tippers (Tipped events on TipJar), which this change does not affect.
6. Hold real value until audited. Donations and the fee are small, but do not route
   large sums pre-audit.
