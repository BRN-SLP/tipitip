# @tipitip/embed

[![npm version](https://img.shields.io/npm/v/@tipitip/embed.svg)](https://www.npmjs.com/package/@tipitip/embed) [![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/BRN-SLP/tipitip/blob/main/LICENSE)

Drop-in React component for embedding a [TipiTip](https://tipitip-sable.vercel.app) article in any blog, newsletter, or React app. Each paragraph gets a live tip counter pulled directly from the on-chain TipJar contract on Celo Mainnet.

**Add tippable paragraphs to your existing blog with two lines of code** — no wallet integration in your codebase, no smart-contract knowledge needed. The host stays where their audience already is (Substack, dev.to, personal Next.js site, WordPress, etc.).

```tsx
import { TipParagraphs } from "@tipitip/embed";

export default function MyArticle() {
  return <TipParagraphs articleId="0x73e8…" />;
}
```

---

## Three ways to embed

Pick the entry that matches your stack. All three target the same on-chain article, so tips aggregate to one balance regardless of how they were sent.

| Entry | Import | Wallet | Extra peer dep | Best for |
|---|---|---|---|---|
| **Lite** | `@tipitip/embed` | Deep-links to TipiTip to sign | none | Constrained surfaces (Substack, MDX), zero-dep budgets |
| **Inline** | `@tipitip/embed/inline` | Signs in place on your page | `viem` | React blogs that want the tip to complete without a redirect |
| **Vanilla** | `@tipitip/embed/vanilla` | Signs in place on your page | `viem` (via CDN) | WordPress, Ghost, plain HTML, no React, no build step |

Lite stays dependency-free and never asks your reader to leave the formatting they trust. Inline and vanilla close the redirect gap: the reader taps a heart on your site and the cUSD transaction completes right there, inside MiniPay or any Celo wallet.

---

## Why use this

| If you're already writing on... | What this embed does for you |
|---|---|
| Substack / Ghost / Medium | Add an iframe wrapper that lets readers tip you in cUSD without ever leaving the article page (tip transactions happen on tipitip-sable.vercel.app in a new tab; tip counts stream back to your post). |
| dev.to / Hashnode / WordPress | Same as above — drop the component into your custom code block and ship. |
| Your own Next.js / Vite / Remix blog | Native React install, zero config. Live tip counters under each paragraph. |

You publish on TipiTip once (free, ~10 seconds), get an `articleId`, then embed the same `articleId` everywhere. Every paragraph carries its own on-chain identity, so tips made via the embed and tips made on tipitip-sable.vercel.app aggregate to the same balance.

---

## Install

```bash
pnpm add @tipitip/embed
# or
npm i @tipitip/embed
# or
yarn add @tipitip/embed
```

The **lite** entry (`@tipitip/embed`) needs only `react >= 18` and `react-dom >= 18`. No `viem`, no `wagmi`, no `@noble/hashes` in your bundle, so it loads cleanly inside MDX, Substack custom HTML, and other constrained surfaces. The **inline** and **vanilla** entries additionally need `viem` (an optional peer dependency) because they sign transactions on your page; install it alongside, or let a CDN resolve it for the web component.

---

## Usage

### 1. Basic

```tsx
import { TipParagraphs } from "@tipitip/embed";

export function ArticleEmbed() {
  return (
    <TipParagraphs articleId="0x73e89882ff0c550111e5b4b5a1967582bdda9cb8000000000000000000000000" />
  );
}
```

### 2. Custom origin (for testing against a staging deploy)

```tsx
<TipParagraphs
  articleId="0x…"
  baseUrl="https://my-tipitip-fork.vercel.app"
/>
```

### 3. Read from Celo Sepolia (testnet) instead of Mainnet

```tsx
<TipParagraphs articleId="0x…" chainId={11142220} />
```

### 4. Faster polling

```tsx
{/* Refresh tip counters every 10s instead of the default 30s */}
<TipParagraphs articleId="0x…" pollIntervalMs={10_000} />

{/* Disable polling — counters only update on mount */}
<TipParagraphs articleId="0x…" pollIntervalMs={0} />
```

### 5. Customize the loading + error states

```tsx
<TipParagraphs
  articleId="0x…"
  loadingFallback={<MySpinner />}
  errorFallback={<MyEmptyState />}
/>
```

### 6. Style the wrapper

```tsx
<TipParagraphs
  articleId="0x…"
  className="prose prose-lg dark:prose-invert"
  style={{ maxWidth: 720, margin: "0 auto" }}
/>
```

The embed renders semantic HTML (`<article>` + `<section>` per paragraph + `<a>` for tip buttons) and ships its own minimal inline styles. You can override anything via class selectors:

```css
.tipitip-embed { /* outer wrapper */ }
.tipitip-embed__paragraph { /* one paragraph block */ }
.tipitip-embed__body { /* rendered markdown */ }
.tipitip-embed__tip { /* heart counter button */ }
```

---

## Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `articleId` | `` `0x${string}` `` | yes | — | The 32-byte article id registered on-chain. Get one by publishing an article at `tipitip-sable.vercel.app/write`. |
| `baseUrl` | `string` | no | `https://tipitip-sable.vercel.app` | Origin serving the TipiTip API. |
| `chainId` | `42220 \| 11142220` | no | `42220` | Which Celo network to read tip events from. |
| `pollIntervalMs` | `number` | no | `30000` | How often to refresh tip counts. Set `0` to disable. |
| `loadingFallback` | `React.ReactNode` | no | "Loading article…" | Rendered while the body is fetching. |
| `errorFallback` | `React.ReactNode` | no | "Failed to load article: …" | Rendered if the body fetch fails. |
| `className` | `string` | no | — | Applied to the outer `<article>`. |
| `style` | `React.CSSProperties` | no | — | Inline styles on the outer `<article>`. |

---

## How tipping actually flows

This is a **read-and-redirect** embed. The clickable heart counter under each paragraph is a deep link to the canonical TipiTip article at `{baseUrl}/a/{articleId}#p-{N}`. When the reader clicks it:

1. A new tab opens to TipiTip with the targeted paragraph scrolled into view.
2. The reader connects their Celo wallet (MiniPay is auto-detected — no popup).
3. They approve a one-time cUSD allowance, then tap the heart to fire `tipParagraph(...)`.
4. The on-chain `Tipped` event is emitted with the same `paragraphKey` your embed already knows about.
5. Within 30 seconds the embedded counter on your blog reflects the new tip.

This split keeps the lite embed dependency-free and your wallet-aware UI on the verified TipiTip domain — your readers' trust signals (verified contract, brand recognition, multi-wallet support) all live at the canonical destination.

If you would rather the tip complete without a redirect, use the **inline** or **vanilla** entries below.

---

## Inline (wallet-signing) — `@tipitip/embed/inline`

Signs the cUSD tip directly from your page. The reader taps a heart, approves a one-time allowance, and `tipParagraph(...)` fires in place. No wagmi, no RainbowKit, no wallet context required on the host — just `viem` and the reader's injected wallet (MiniPay auto-detected).

```bash
pnpm add @tipitip/embed viem
```

```tsx
import { TipParagraphsInline } from "@tipitip/embed/inline";

export function ArticleEmbed() {
  return (
    <TipParagraphsInline
      articleId="0x…"
      tipAmountsCusd={[0.001, 0.005, 0.01]}
    />
  );
}
```

Inside MiniPay the transaction carries `feeCurrency: cUSD` automatically (CIP-64 fee abstraction), so the reader pays gas in the stablecoin they already hold and never needs CELO. On a desktop EVM wallet the field is omitted, as those wallets reject it.

Extra props over the lite component: `tipAmountsCusd` (selectable amounts), `tipJarAddress` / `cusdAddress` / `rpcUrl` (overrides for staging or a fork).

You can also drive the flow yourself with the bare engine:

```ts
import { createTipEngine, deriveParagraphKey } from "@tipitip/embed/inline";

const engine = createTipEngine({ chainId: 42220 });
await engine.connect();
await engine.tip({
  articleId: "0x…",
  paragraphKey: deriveParagraphKey("0x…", 0, "the paragraph text"),
  amountWei: 5_000_000_000_000_000n, // 0.005 cUSD
  onStatus: (s) => console.log(s.kind),
});
```

---

## Vanilla web component — `@tipitip/embed/vanilla`

No React, no build step. Drop one module script and a custom element onto any page (WordPress, Ghost, plain HTML). It registers `<tipitip-paragraphs>` and wraps the same signing engine as the inline component.

```html
<script type="module" src="https://esm.sh/@tipitip/embed/vanilla"></script>

<tipitip-paragraphs
  article-id="0x…"
  tip-amount="0.005"
  chain-id="42220"
></tipitip-paragraphs>
```

| Attribute | Default | Description |
|---|---|---|
| `article-id` | — (required) | 32-byte hex article id |
| `base-url` | production origin | TipiTip API origin |
| `chain-id` | `42220` | `42220` (Mainnet) or `11142220` (Sepolia) |
| `tip-amount` | `0.005` | Whole cUSD sent per tap |
| `poll-interval` | `30000` | Stats refresh ms; `0` disables |

Styling is isolated in a shadow root, so host CSS will not leak in or out. The CDN resolves `viem` for you; nothing to install.

---

## How tip counts get aggregated

The embed calls `GET {baseUrl}/api/tip-stats/{articleId}?chainId={chainId}`. The TipiTip server:

1. Reads the article body from decentralized storage (Vercel Blob).
2. Re-splits it with the exact same algorithm the embed uses (`splitParagraphs`).
3. Scans the last ~200,000 blocks of `Tipped` events on the configured network.
4. Maps each event's `paragraphKey` back to the corresponding paragraph index.
5. Returns `{ paragraphs: { "0": { count, total }, "2": { count, total }, ... } }`.

The endpoint is public, CORS-permissive, and cached for 30 seconds at the edge.

---

## Caveats and limits

- **Body edits.** If the author edits the article body so a paragraph's text changes, old tips on that paragraph stay claimable on-chain by the author but stop showing up under the new text. That's intentional — paragraphs are tipped because of what they say.
- **Block range.** The default scan window is the last ~3-4 days of blocks. Tips made before that aren't reflected (yet — a subgraph migration is on the roadmap for unbounded history once volume warrants it).
- **No SSR.** The component uses `useEffect` for both the body fetch and the stats poll, so it always renders the loading state on the server. If you need SSR-rendered article text, fetch the body yourself from `{baseUrl}/api/articles/{articleId}` and pass it through.

---

## Network access & privacy

This package makes exactly one kind of network request: a `GET` to
`{baseUrl}/api/articles/{articleId}` for the article body and `{baseUrl}/api/tip-stats`
for tip counts, where `baseUrl` is the origin you pass in (default
`https://tipitip-sable.vercel.app`). The inline entry additionally talks to your
wallet's Celo RPC to broadcast the tip. There is no telemetry, no analytics, and
no third-party domains. Point `baseUrl` at your own deployment to keep every call
on your own infrastructure.

---

## Demo

A worked example with a real on-chain article:

```tsx
<TipParagraphs articleId="0x7ff67b58d8cbc9deaa11b8e1f6cf95dba0e2f97d8d2f8a8a9e51ba4e6df8a25f" />
```

The corresponding rendering on the canonical site: <https://tipitip-sable.vercel.app/a/0x7ff67b58d8cbc9deaa11b8e1f6cf95dba0e2f97d8d2f8a8a9e51ba4e6df8a25f>

---

## License

MIT © TipiTip
