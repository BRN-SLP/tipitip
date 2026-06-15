# Deploy and wiring runbook: TipiTipVault and TipiTipSupport

Status: contracts written, 19 hardhat tests green, security-reviewed. NOT deployed.
This is the checklist to take them live without missing a step.

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

Mainnet is one-shot for the immutable wiring, so rehearse the whole flow on testnet:

- [ ] Deploy/reuse a test TipJar, then
      `pnpm hardhat run scripts/deploy-vault-support.ts --network celo-sepolia`.
- [ ] `setTreasury(vault)` on the test TipJar; tip; `sweepFees()`; confirm cUSD
      lands in the vault.
- [ ] `support()`; `supportWithDonation()` with a small amount; confirm the
      donation lands in the vault.
- [ ] `allocate()` to a second wallet; `claim()` from it; confirm payout and that
      `withdraw()` cannot touch the allocated amount.

## 2. Deploy to mainnet

- [ ] `pnpm hardhat run scripts/deploy-vault-support.ts --network celo`
- [ ] Record the printed Vault and Support addresses.
- [ ] Verify both (commands printed by the script, constructor args included):
  - `pnpm hardhat verify --network celo <vault> <cUSD> <tipJar>`
  - `pnpm hardhat verify --network celo <support> <cUSD> <vault>`

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
- [ ] `apps/web/src/components/landing/SupportOnChain.tsx` - switch the address
      from `getTipJarAddress` to `getSupportAddress` and the abi from `tipJarAbi`
      to `supportContractAbi`. Add an optional donation amount: if it is greater
      than zero, `approve(<support>, amount)` then
      `supportWithDonation(message, amount)` with `gas: 250_000n` plus
      `...feeOverride`; otherwise `support(message)` with `gas: 200_000n` plus
      `...feeOverride`.
- [ ] `apps/web/src/components/footer-support-link.tsx` - point its
      `uniqueSupporters` read at the Support contract.
- [ ] Later: a Vault claim card modeled on `dashboard/ClaimCard.tsx`, reading
      `claimable(address)` then calling `claim()`.

Approve target: for `supportWithDonation` the supporter approves the **Support**
contract (it runs `transferFrom(supporter -> vault)`). A direct `vault.donate()`
would instead need approval to the **Vault**. Route v1 donations through Support
and approve Support.

## 5. Get 10+ real wallets per contract

Deploying does not score; real usage does. Each contract counts only past 10
unique transacting wallets.

- Support: a visible "support us / chip in" call to action (today it is a quiet
  footer link). Wallets come from supporters and small donors.
- Vault: wallets come from donors (via Support) and reward claimers. Fund small,
  real rewards with `allocate()` to real writers and early supporters so they
  `claim()` (real people, real claims, never Sybil).

## Gotchas

1. Immutable: `Vault.tipJar` and `Support.vault` are fixed at deploy. Order (Vault
   then Support) and address correctness are one-shot; wrong means redeploy.
2. Deployer becomes the Vault owner; mind which key you deploy from.
3. One canonical support path: fully switch the button to the Support contract; do
   not leave `TipJar.support` live in the UI, or wallets split across contracts
   and neither clears the 10 bar.
4. Every write needs `...feeOverride` (MiniPay) and an explicit gas for
   support/donation, to avoid out-of-gas.
5. Counter note: the new Support counters start at zero, but the old TipJar support
   count is near zero anyway, and the homepage "supporters" number is unique
   tippers (Tipped events on TipJar), which this change does not affect.
6. Hold real value until audited. Donations and the fee are small, but do not route
   large sums pre-audit.
