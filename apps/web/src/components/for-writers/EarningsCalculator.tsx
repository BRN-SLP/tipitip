"use client";

import { useMemo, useState } from "react";

interface Sliders {
  readers: number;
  articlesPerMonth: number;
  tipConversionPct: number;
  avgTipUsd: number;
  paragraphsPerArticle: number;
}

const DEFAULTS: Sliders = {
  readers: 1000,
  articlesPerMonth: 4,
  tipConversionPct: 1,
  avgTipUsd: 0.05,
  paragraphsPerArticle: 8,
};

const TIP_GAS_USD = 0.0003; // ~0.0003 USD per cUSD micro-tip tx on Celo
const CLAIM_GAS_USD = 0.001; // monthly sweep cost

/**
 * Per-month earnings model for a writer plugging in their real audience
 * shape. Deliberately conservative — defaults assume 1% tip-conversion
 * which matches the Patreon-style "% of audience that actually pays"
 * benchmark. The math is transparent on screen so a skeptical reader
 * can sanity-check it.
 *
 *   tipping readers       = readers × conversionPct / 100
 *   tips per month        = tipping readers × articles × paragraphsPerArticle × conversionPct?
 *                           — we keep it simpler: each converting reader
 *                             tips ~30% of paragraphs in each article
 *   gross earnings        = tips × avgTipUsd
 *   gas (reader-paid)     = tips × TIP_GAS_USD       (paid by readers, not deducted)
 *   net to author         = gross − CLAIM_GAS_USD   (only sweep cost is borne by author)
 *
 * We surface "gross" and "net" separately so the writer can see that
 * Celo's gas profile doesn't dent their take-home in any meaningful way.
 */
export function EarningsCalculator() {
  const [s, setS] = useState<Sliders>(DEFAULTS);

  const result = useMemo(() => {
    const tippingReaders = s.readers * (s.tipConversionPct / 100);
    // Each tipping reader tips ~30% of paragraphs (engagement heuristic).
    const tipsPerReaderPerArticle = Math.max(
      1,
      Math.round(s.paragraphsPerArticle * 0.3),
    );
    const tipsPerMonth =
      tippingReaders * s.articlesPerMonth * tipsPerReaderPerArticle;
    const grossUsd = tipsPerMonth * s.avgTipUsd;
    const onchainTx = Math.round(tipsPerMonth); // each tip = 1 tx
    const netUsd = Math.max(0, grossUsd - CLAIM_GAS_USD);
    return {
      tippingReaders: Math.round(tippingReaders),
      tipsPerMonth: Math.round(tipsPerMonth),
      grossUsd,
      netUsd,
      onchainTx,
    };
  }, [s]);

  return (
    <div className="grid gap-6 rounded-xl border border-border bg-card p-6 md:grid-cols-[1.3fr_1fr] md:p-8">
      {/* Inputs */}
      <div className="space-y-5">
        <Slider
          label="Monthly readers"
          help="How many unique people read your work per month."
          value={s.readers}
          min={100}
          max={50_000}
          step={100}
          formatValue={(n) => n.toLocaleString()}
          onChange={(v) => setS((cur) => ({ ...cur, readers: v }))}
        />
        <Slider
          label="Articles per month"
          help="How many new pieces you publish."
          value={s.articlesPerMonth}
          min={1}
          max={30}
          step={1}
          onChange={(v) => setS((cur) => ({ ...cur, articlesPerMonth: v }))}
        />
        <Slider
          label="Tip conversion rate"
          help="Percentage of readers who tip at least one paragraph."
          value={s.tipConversionPct}
          min={0.1}
          max={10}
          step={0.1}
          formatValue={(n) => `${n.toFixed(1)}%`}
          onChange={(v) =>
            setS((cur) => ({ ...cur, tipConversionPct: v }))
          }
        />
        <Slider
          label="Average tip"
          help="Per-paragraph tip size in USD (cUSD on Celo)."
          value={s.avgTipUsd}
          min={0.001}
          max={1}
          step={0.001}
          formatValue={(n) => `$${n.toFixed(3)}`}
          onChange={(v) => setS((cur) => ({ ...cur, avgTipUsd: v }))}
        />
        <Slider
          label="Paragraphs per article"
          help="Used to estimate tip volume per converting reader."
          value={s.paragraphsPerArticle}
          min={3}
          max={30}
          step={1}
          onChange={(v) =>
            setS((cur) => ({ ...cur, paragraphsPerArticle: v }))
          }
        />
      </div>

      {/* Outputs */}
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-background p-5">
        <ResultLine label="Tipping readers / month" value={result.tippingReaders.toLocaleString()} />
        <ResultLine label="Tips / month" value={result.tipsPerMonth.toLocaleString()} />
        <ResultLine label="On-chain tx / month" value={result.onchainTx.toLocaleString()} accent />
        <div className="my-2 border-t border-border" />
        <ResultLine
          label="Gross monthly tips"
          value={formatUsd(result.grossUsd)}
        />
        <ResultLine
          label="Net to author (after sweep gas)"
          value={formatUsd(result.netUsd)}
          accent
          big
        />
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Gas is paid by readers per-tip (≈ ${TIP_GAS_USD.toFixed(4)} each, sub-cent
          on Celo). The author only pays ≈ ${CLAIM_GAS_USD.toFixed(3)} once per
          month to sweep accumulated tips to their wallet.
        </p>
      </div>
    </div>
  );
}

interface SliderProps {
  label: string;
  help?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue?: (n: number) => string;
  onChange: (v: number) => void;
}

function Slider({
  label,
  help,
  value,
  min,
  max,
  step,
  formatValue,
  onChange,
}: SliderProps) {
  const display = formatValue ? formatValue(value) : value.toLocaleString();
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="font-mono text-sm text-primary">{display}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-primary"
      />
      {help && (
        <p className="mt-1 text-[11px] text-muted-foreground">{help}</p>
      )}
    </label>
  );
}

function ResultLine({
  label,
  value,
  accent,
  big,
}: {
  label: string;
  value: string;
  accent?: boolean;
  big?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`font-mono ${big ? "text-2xl" : "text-base"} ${
          accent ? "font-semibold text-primary" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function formatUsd(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 10) return `$${n.toFixed(0)}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(3)}`;
}
// @type: prefer readonly for immutable data
// @a11y: add aria-describedby reference
// @perf: lazy load this component
