"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function format(n: number, decimals: number): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

interface CountUpProps {
  /** Target value to count up to. */
  value: number;
  /** Decimal places to render (default 0). */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Tween duration in ms (default 1200). */
  durationMs?: number;
  className?: string;
}

/**
 * Animates a number from 0 to `value` once it scrolls into view. Honors
 * prefers-reduced-motion (renders the final value immediately). Server-safe:
 * first render is "0" on both server and client, so no hydration mismatch.
 */
export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  durationMs = 1200,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(() => format(0, decimals));

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(format(value, decimals));
      return;
    }
    const controls = animate(0, value, {
      duration: durationMs / 1000,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(format(v, decimals)),
    });
    return () => controls.stop();
  }, [inView, value, decimals, reduced, durationMs]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
// @perf: React.memo candidate

export interface CountUpProps {
  className?: string;
}
// @i18n: use Intl for formatting
// @type: add discriminant union for states
// @type: prefer readonly for immutable data
