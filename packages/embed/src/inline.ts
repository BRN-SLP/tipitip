/**
 * Inline entry point: `@tipitip/embed/inline`.
 *
 * Wallet-signing embed that sends the cUSD tip transaction directly from
 * the host page. Requires `viem` (peer dependency) and React. If you only
 * need read-and-redirect counters with zero runtime deps, import from the
 * package root (`@tipitip/embed`) instead.
 */
export { TipParagraphsInline } from "./TipParagraphsInline.js";
export type { TipParagraphsInlineProps, Hex } from "./TipParagraphsInline.js";
export {
  createTipEngine,
  hasInjectedProvider,
  type TipEngine,
  type TipEngineConfig,
  type TipParams,
  type TipStatus,
  type SupportedChainId,
} from "./tip-engine.js";
export { deriveParagraphKey } from "./paragraph-key.js";
export { splitParagraphs } from "./markdown.js";
