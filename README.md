# TipiTip

**Per-paragraph content tipping on Celo.** Writers publish a markdown article in a minute, share the link, readers tap ❤️ under any paragraph they like and instantly send the author a small cUSD tip. No subscriptions, no middlemen, no minimum payouts.

- ✍️ **Publish** in markdown with a live preview. Body content is uploaded to decentralized storage and content-addressed by hash.
- ❤️ **Tip** any paragraph with a single tap. Readers pre-approve a cUSD allowance once; every tip after that is one transaction at sub-cent gas on Celo.
- 💸 **Claim** accumulated tips to your wallet in one cUSD transfer. Works in MiniPay or any Celo-compatible wallet.

## Architecture

| Layer | Tech |
|---|---|
| Web app | Next.js 14 (App Router), TypeScript, TailwindCSS, Radix UI, [@composer-kit/ui](https://www.composerkit.xyz/) |
| Web3 client | viem 2.x + wagmi 2.x + RainbowKit |
| Smart contract | UUPS-upgradeable Solidity 0.8.28 on Celo, OpenZeppelin contracts-upgradeable 5.6 |
| Content storage | Vercel Blob (markdown bodies), content-addressed by keccak256 hash |
| Monorepo | Turborepo |

Articles are identified on-chain by `articleId = keccak256(authorAddress || slug)`. Per-paragraph tip targets use `paragraphKey = keccak256(articleId || uint32(paragraphIndex) || keccak256(paragraphText))` so edits to one paragraph do not invalidate tips already collected on another.

## Project Structure

```
apps/web         Next.js application (writer, reader, dashboard)
apps/contracts   Hardhat smart contract development environment
```

## Quick start

```bash
pnpm install
pnpm dev                 # runs Next.js dev server on :3000
```

Copy `.env.example` to the appropriate `.env` files and fill in the values. The web app reads `apps/web/.env.local`; the contracts read `apps/contracts/.env`.

## Smart contract scripts

```bash
pnpm contracts:compile             # compile Solidity
pnpm contracts:test                # run Hardhat test suite (viem + chai)
pnpm contracts:deploy:celo-sepolia # deploy UUPS proxy to Celo Sepolia
pnpm contracts:deploy:celo         # deploy UUPS proxy to Celo Mainnet
```

After deploy the script prints both the proxy and implementation addresses. Verify the implementation on Celoscan with:

```bash
cd apps/contracts
pnpm hardhat verify --network celo-sepolia <implementation-address>
```

## Tests

```bash
pnpm contracts:test                # 16 Hardhat tests covering register / tip /
                                   # claim / UUPS upgrade safety / guards
pnpm --filter web test:e2e         # Playwright smoke tests against dev server
```

## License

MIT — see [LICENSE](./LICENSE).
