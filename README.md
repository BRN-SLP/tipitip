# TipiTip

> **Tip the paragraph, not the post.** Per-paragraph cUSD micro-tipping for writers on Celo. Readers anywhere tip in cUSD, straight to the writer.

🟢 **Live:** https://tipitip-sable.vercel.app
🧪 **Sepolia TipJar proxy:** [`0xDB11f15D8d6A94AdF63Bd760B1AAE130379983b8`](https://celo-sepolia.blockscout.com/address/0xDB11f15D8d6A94AdF63Bd760B1AAE130379983b8)

---

A book has chapters. A chapter has paragraphs. A paragraph has one idea. So why does the tip jar sit at the bottom of the page where the reader has to remember the whole thing before deciding whether the whole thing earned a coin?

TipiTip changes the unit. Every paragraph has a small heart underneath it. A reader taps once and a fraction of a cent moves from their wallet to the writer's — at ~99% efficiency, sub-cent gas, no signup, no platform middle-tax.

- ✍️ **Publish** in markdown with a live preview. Body content is uploaded to decentralized storage and content-addressed by hash.
- ❤️ **Tip** any paragraph with a single tap. Readers pre-approve a cUSD allowance once; every tip after that is one transaction at sub-cent gas on Celo.
- 💸 **Claim** accumulated tips to your wallet in one cUSD transfer. Works inside MiniPay or any Celo-compatible wallet.

## Architecture

| Layer | Tech |
|---|---|
| Web app | Next.js 14 (App Router), TypeScript, TailwindCSS, Radix UI, [@composer-kit/ui](https://www.composerkit.xyz/) |
| Web3 client | viem 2.x + wagmi 2.x + RainbowKit |
| Smart contract | UUPS-upgradeable Solidity 0.8.28 on Celo, OpenZeppelin contracts-upgradeable 5.6 |
| Content storage | Vercel Blob (markdown bodies), content-addressed by keccak256 hash |
| MiniPay | Auto-detect via `window.ethereum.isMiniPay` + UA; force `feeCurrency: cUSD` for gasless UX |
| Monorepo | Turborepo |

Articles are identified on-chain by `articleId = keccak256(authorAddress || slug)`. Per-paragraph tip targets use `paragraphKey = keccak256(articleId || uint32(paragraphIndex) || keccak256(paragraphText))` so edits to one paragraph do not invalidate tips already collected on another.

## Why Celo

On Ethereum, sending 1¢ costs 50¢. That kills micropayments. Celo solves it differently — sub-cent gas, AND you can pay gas in cUSD itself (`feeCurrency`). No second token to fund, no bridge. A 1¢ tip leaves the reader and lands in the writer's wallet at ~99% efficiency. Compare to Patreon's 5% + Stripe's 2.9% + 30¢ fixed: a $1 tip nets the writer $0.92; a $0.01 tip Patreon won't even accept.

Distribution: TipiTip works in any Celo-compatible wallet, anywhere. **MiniPay** alone ships cUSD preinstalled across 60+ countries — wallets that already hold cUSD, already pay gas in cUSD, already trust the brand. A reader anywhere tipping a writer anywhere 1¢ is the default case on this stack.

## Project Structure

```
apps/web                Next.js application (writer, reader, dashboard)
apps/web/seed/articles  Curated launch-day markdown (5 articles)
apps/contracts          Hardhat: TipJar.sol + UUPS upgrade scaffolding
apps/contracts/scripts  deploy.ts, seed-articles.ts
```

## Quick start

```bash
pnpm install
pnpm dev                 # runs Next.js dev server on :3000
```

Copy `.env.example` to the appropriate `.env` files. The web app reads `apps/web/.env.local`; the contracts read `apps/contracts/.env`.

## Smart contract scripts

```bash
pnpm contracts:compile                  # compile Solidity
pnpm contracts:test                     # 16 Hardhat tests (register / tip / claim / UUPS safety / guards)
pnpm contracts:deploy:celo-sepolia      # deploy UUPS proxy to Celo Sepolia
pnpm contracts:deploy:celo              # deploy UUPS proxy to Celo Mainnet
pnpm contracts:seed-articles:celo       # publish 5 curated launch articles to mainnet
```

After deploy the script prints proxy + implementation addresses. Verify on Celoscan:

```bash
cd apps/contracts
pnpm hardhat verify --network celo-sepolia <implementation-address>
```

## Tests

```bash
pnpm contracts:test                # 16 Hardhat tests covering registerArticle / tipParagraph /
                                   # claimEarnings / UUPS upgrade safety / access control
pnpm --filter web test:e2e         # Playwright smoke tests against dev server
```

## License

MIT — see [LICENSE](./LICENSE).
