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
    <div className="flex items-center gap-2 rounded-md border border-input bg-background p-1 text-xs">
      <span className="px-2 text-muted-foreground">Tip:</span>
      {TIP_AMOUNT_PRESETS.map((preset) => (
        <button
          key={preset.toString()}
          type="button"
          onClick={() => onChange(preset)}
          className={`rounded px-2.5 py-1 transition-colors ${
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
