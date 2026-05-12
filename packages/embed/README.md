# @tipitip/embed

Drop-in React component for embedding a [TipiTip](https://tipitip.app) article in any blog, newsletter, or React app.

> **Alpha (`0.0.1-alpha.0`).** This release renders the article body and links back to the canonical TipiTip page for tipping. A future release will expose the full per-paragraph tip UI in-place. Public API may change.

## Install

```bash
pnpm add @tipitip/embed
# or
npm i @tipitip/embed
```

## Usage

```tsx
import { TipParagraphs } from "@tipitip/embed";

export default function MyPage() {
  return (
    <TipParagraphs articleId="0x<articleId>" />
  );
}
```

The component fetches the markdown body from `https://tipitip.app/api/articles/{articleId}` by default; override with the `baseUrl` prop for self-hosted instances.

## Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `articleId` | `` `0x${string}` `` | yes | The 32-byte article id registered on-chain. |
| `baseUrl` | `string` | no | Origin serving the TipiTip API. Defaults to `https://tipitip.app`. |
| `fallback` | `React.ReactNode` | no | Rendered while the body is loading. |

## License

MIT
