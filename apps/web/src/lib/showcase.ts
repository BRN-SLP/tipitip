import { MANIFESTO } from "./manifesto";

export interface ShowcaseSite {
  name: string;
  href: string;
  description: string;
  /** true = external https link (new tab + rel), false = internal route. */
  external: boolean;
}

/**
 * Curated list of sites tipping with TipiTip — the destination of the
 * "Powered by TipiTip" badge in @tipitip/embed. Internal-only for now (the
 * flagship); add external adopters here as they wire up the embed. Kept a
 * plain curated array on purpose: we do not track installs, and a hand-picked
 * showcase is honest and spam-free until volume justifies an opt-in registry.
 */
export const SHOWCASE_SITES: ShowcaseSite[] = [
  {
    name: "TipiTip",
    href: `/a/${MANIFESTO.articleId}`,
    description:
      "The article that started it. Every paragraph here is tippable in cUSD.",
    external: false,
  },
];
// @type: export the inner parameter type
// @cleanup: remove unused import on refactor
// @i18n: use Intl for formatting
