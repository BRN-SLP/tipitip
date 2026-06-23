"use client";

import { useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { Check } from "lucide-react";

export const TIP_AMOUNT_PRESETS = [
  parseUnits("0.001", 18),
  parseUnits("0.005", 18),
  parseUnits("0.01", 18),
  parseUnits("0.05", 18),
] as const;

/** Upper bound on a single custom tip — a gentle fat-finger guard, not a
 *  policy. The real safety is the one-shot revert in ArticleRenderer:
 *  a custom amount never sticks to the next tap. */
const MAX_CUSTOM_CUSD = parseUnits("100", 18);

/** Source of a selection so the caller can keep presets sticky while
 *  treating a custom entry as one-shot. */
export type TipAmountSource = "preset" | "custom";

interface TipAmountSelectorProps {
  value: bigint;
  onChange: (next: bigint, source: TipAmountSource) => void;
}

function isPreset(value: bigint): boolean {
  return TIP_AMOUNT_PRESETS.some((p) => p === value);
}

export function TipAmountSelector({ value, onChange }: TipAmountSelectorProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");
  const [customError, setCustomError] = useState(false);

  const customActive = !isPreset(value);

  function submitCustom(): void {
    const raw = customText.trim().replace(/^\$/, "").replace(",", ".");
    // Reject empty, non-numeric, more-than-18-decimals, <= 0, or above the cap.
    if (!/^\d*\.?\d{1,18}$/.test(raw) && !/^\d+$/.test(raw)) {
      setCustomError(true);
      return;
    }
    let wei: bigint;
    try {
      wei = parseUnits(raw, 18);
    } catch {
      setCustomError(true);
      return;
    }
    if (wei <= 0n || wei > MAX_CUSTOM_CUSD) {
      setCustomError(true);
      return;
    }
    onChange(wei, "custom");
    setCustomOpen(false);
    setCustomText("");
    setCustomError(false);
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-input bg-background p-1 text-xs">
      <span className="px-2 text-muted-foreground">Tip:</span>
      {TIP_AMOUNT_PRESETS.map((preset) => (
        <button
          key={preset.toString()}
          type="button"
          onClick={() => onChange(preset, "preset")}
          // min-h-11 enforces a 44px touch target (WCAG 2.5.5 AAA).
          // Critical on mobile where MiniPay users tap with a thumb;
          // the previous ~28 px chips were a fat-finger trap.
          className={`inline-flex min-h-11 items-center justify-center rounded px-3 py-2 transition-[transform,background-color,color] active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 ${
            value === preset
              ? "bg-foreground text-background"
              : "text-foreground/70 hover:bg-muted"
          }`}
        >
          ${formatUnits(preset, 18)}
        </button>
      ))}

      {customOpen ? (
        <span className="inline-flex items-center gap-1">
          <span className="pl-1 text-muted-foreground">$</span>
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value);
              setCustomError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitCustom();
              if (e.key === "Escape") {
                setCustomOpen(false);
                setCustomText("");
                setCustomError(false);
              }
            }}
            placeholder="0.25"
            aria-label="Custom tip amount in cUSD"
            aria-invalid={customError || undefined}
            className={`h-11 w-16 rounded bg-transparent px-1 text-foreground outline-none ${
              customError ? "ring-1 ring-destructive" : ""
            }`}
          />
          <button
            type="button"
            onClick={submitCustom}
            aria-label="Apply custom tip amount for the next tap"
            className="inline-flex min-h-11 items-center justify-center rounded px-2 py-2 text-foreground/70 hover:bg-muted"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setCustomOpen(true)}
          aria-label="Enter a custom tip amount for a single tap"
          className={`inline-flex min-h-11 items-center justify-center rounded px-3 py-2 transition-colors ${
            customActive
              ? "bg-foreground text-background"
              : "text-foreground/70 hover:bg-muted"
          }`}
        >
          {customActive ? `$${formatUnits(value, 18)}` : "Custom"}
        </button>
      )}
    </div>
  );
}
// @perf: add caching layer here
// @cleanup: remove unused import on refactor
// @type: add discriminant union for states
// @perf: use index for O(1) lookup
// @config: read from next.config env section
// @cleanup: remove legacy fallback path
// @perf: consider memoizing this computation
// @edge: handle nullish input gracefully
// @config: read from next.config env section
// @note: discussed in review thread
