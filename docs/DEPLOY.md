# Deployment guide

Two services to set up:

1. **Smart contract** (UUPS proxy) on Celo Sepolia → then Celo Mainnet.
2. **Web app** on Vercel.

## 1. Smart contract

### Sepolia (testnet) first

```bash
cd apps/contracts
cp ../../.env.example .env   # then edit
# .env should set:
#   PRIVATE_KEY=0x...          dedicated deployer key
#   CUSD_ADDRESS=0x...         cUSD ERC-20 on Sepolia
#   ETHERSCAN_API_KEY=...      Celoscan API key
```

Fund the deployer address with a tiny amount of testnet CELO from the Celo Sepolia faucet, then:

```bash
pnpm compile
pnpm deploy:celo-sepolia
```

The script prints `Proxy` and `Implementation` addresses. Save both. The implementation address is what Celoscan verifies.

```bash
pnpm hardhat verify --network celo-sepolia <implementation-address>
```

OpenZeppelin Upgrades plugin tracks the deployment under `.openzeppelin/unknown-11142220.json` — commit this file to source control so future upgrades stay safe.

### Mainnet

Same steps with `pnpm deploy:celo`. The cUSD mainnet address is hardcoded in the script (`KNOWN_CUSD[42220]`). The deployer key MUST be fully isolated from any personal wallet.

## 2. Web app

1. Connect this repo to a Vercel project. Root directory: repo root. Vercel detects Turborepo and builds `apps/web`.
2. Enable Vercel Blob on the project — this auto-injects `BLOB_READ_WRITE_TOKEN`.
3. Add these env vars in the Vercel dashboard (Project → Settings → Environment Variables):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_WC_PROJECT_ID` | WalletConnect cloud project id (free at https://cloud.reown.com) |
| `NEXT_PUBLIC_TIPJAR_ADDRESS_MAINNET` | proxy address from `pnpm deploy:celo` |
| `NEXT_PUBLIC_TIPJAR_ADDRESS_SEPOLIA` | proxy address from `pnpm deploy:celo-sepolia` |
| `NEXT_PUBLIC_CUSD_ADDRESS_SEPOLIA` | cUSD address on Celo Sepolia |

Deploy. The Vercel default subdomain is fine for early access — custom domain optional.

## Upgrading the contract later

The contract is UUPS-upgradeable. To ship a V2 with anti-Sybil restrictions (rate limits, paragraph-level tip caps), write `TipJarV2.sol` extending `TipJar`, then:

```bash
cd apps/contracts
pnpm hardhat run scripts/upgrade.ts --network celo-sepolia
```

(`scripts/upgrade.ts` is left as a TODO; the pattern is `await upgrades.upgradeProxy(proxyAddress, NewFactory)` — OZ Upgrades will run storage-layout safety checks against the prior deployment recorded in `.openzeppelin/`.)
