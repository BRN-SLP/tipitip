"use client";

import { formatUnits, parseUnits } from "viem";

export const TIP_AMOUNT_PRESETS = [
  parseUnits("0.001", 18),
  parseUnits("0.005", 18),
  parseUnits("0.01", 18),
  parseUnits("0.05", 18),
] as const;

interface TipAmountSelectorProps {
  value: bigint;
  onChange: (next: bigint) => void;
}

export function TipAmountSelector({ value, onChange }: TipAmountSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-input bg-background p-1 text-xs">
      <span className="px-2 text-muted-foreground">Tip:</span>
      {TIP_AMOUNT_PRESETS.map((preset) => (
        <button
          key={preset.toString()}
          type="button"
          onClick={() => onChange(preset)}
          // min-h-11 enforces a 44px touch target (WCAG 2.5.5 AAA).
          // Critical on mobile where MiniPay users tap with a thumb;
          // the previous ~28 px chips were a fat-finger trap.
          className={`inline-flex min-h-11 items-center justify-center rounded px-3 py-2 transition-colors ${
            value === preset
              ? "bg-foreground text-background"
              : "text-foreground/70 hover:bg-muted"
          }`}
        >
          ${formatUnits(preset, 18)}
        </button>
      ))}
    </div>
  );
}
