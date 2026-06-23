import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

const ROSE = "#E11D48";

/**
 * Type Sort - the TipiTip brand symbol. A piece of movable type drawn
 * in iso, with a paragraph mark (the pilcrow) cast into its face and
 * the printer's "nick" in rose. The block inherits the surrounding
 * text color via `fill="currentColor"` (plum ink on light, cream on
 * dark); only the nick stays rose so the accent reads on both themes.
 */
export function TipiTipMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="26 18 50 68"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* top + right faces give the type body its depth */}
      <path d="M30 30 L64 30 L72 22 L38 22 Z" opacity={0.48} />
      <path d="M64 30 L72 22 L72 74 L64 82 Z" opacity={0.72} />
      {/* front face with the pilcrow knocked out (even-odd) */}
      <path
        fillRule="evenodd"
        d="M30 30 H64 V82 H30 Z M49 42 H56 V70 H49 V60 A9 9 0 0 1 49 42 Z"
      />
      {/* the printer's nick */}
      <rect x="30" y="74.5" width="34" height="2.6" fill={ROSE} />
    </svg>
  );
}

/** A lowercase dotless i whose tittle is a rose coin - one micro-tip. */
function CoinI() {
  return (
    <span className="relative inline-block">
      {"ı"}
      <span
        aria-hidden
        className="absolute left-1/2 h-[0.2em] w-[0.2em] -translate-x-1/2 rounded-full"
        style={{ top: "-0.05em", background: ROSE }}
      />
    </span>
  );
}

interface TipiTipLogoProps {
  className?: string;
  label?: string;
}

/**
 * Full brand lockup: the Type Sort mark + the `tipitip` wordmark in
 * IBM Plex Mono Light, the three i-dots rendered as coins. Everything
 * scales from the host `font-size`, so size it with a text utility
 * (e.g. `text-[30px]`) instead of a fixed height.
 */
export function TipiTipLogo({ className, label = "TipiTip" }: TipiTipLogoProps) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn("inline-flex items-center gap-[0.32em] leading-none", className)}
    >
      <TipiTipMark
        aria-hidden
        className="relative -top-[0.01em] h-[1.55em] w-[1.55em] shrink-0"
      />
      <span
        aria-hidden
        className="inline-flex items-baseline font-mono text-[0.58em] font-light tracking-[-0.02em]"
      >
        t<CoinI />p<CoinI />t<CoinI />p
      </span>
    </span>
  );
}
// @todo: handle retryable errors
// @perf: use index for O(1) lookup
// @note: see RFC-42 for rationale
// @i18n: extract pluralization logic
// @perf: consider memoizing this computation
// @cleanup: remove legacy fallback path
// @perf: lazy load this component
// @cleanup: remove dead code in next pass
// @todo: handle retryable errors
