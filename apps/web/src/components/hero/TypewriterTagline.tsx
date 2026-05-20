"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const PHRASES = [
  "every paragraph",
  "honest writing",
  "real voices",
  "the good lines",
];

// Width-stabilizing reservation: the longest phrase in PHRASES.
// Rendered invisibly to keep the line height + box width constant
// across phrase swaps so the H1 never reflows.
const LONGEST = PHRASES.reduce((a, b) => (a.length >= b.length ? a : b));

const TYPE_MS = 60;
const ERASE_MS = 30;
const HOLD_MS = 1500;

/**
 * Typewriter-style rotating phrase used in the TipiTip hero. Cycles
 * through PHRASES with type + hold + erase cadence. Collapses to the
 * first phrase only under prefers-reduced-motion.
 */
export function TypewriterTagline() {
  const prefersReduced = useReducedMotion();
  const [text, setText] = useState(prefersReduced ? PHRASES[0] : "");
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"type" | "hold" | "erase">("type");

  useEffect(() => {
    if (prefersReduced) return;
    const current = PHRASES[index];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "type") {
      if (text.length < current.length) {
        timer = setTimeout(() => setText(current.slice(0, text.length + 1)), TYPE_MS);
      } else {
        timer = setTimeout(() => setPhase("hold"), HOLD_MS);
      }
    } else if (phase === "hold") {
      timer = setTimeout(() => setPhase("erase"), 0);
    } else {
      if (text.length > 0) {
        timer = setTimeout(() => setText(text.slice(0, text.length - 1)), ERASE_MS);
      } else {
        setIndex((i) => (i + 1) % PHRASES.length);
        setPhase("type");
      }
    }

    return () => clearTimeout(timer);
  }, [text, index, phase, prefersReduced]);

  return (
    // Three interlocking guards on this wrapper:
    //
    // 1. `overflow-hidden` + `pb-[0.45em]` — the tight `leading-[0.95]`
    //    on the H1 squeezes the line box shorter than Fraunces italic's
    //    natural ascent + descent. Without the bottom buffer, descenders
    //    on g / p / y in "every paragraph" physically extend below the
    //    inner absolute layer and get clipped by the outer's hard edge.
    //    0.45em is enough for the most aggressive italic descenders we
    //    have in the rotation.
    //
    // 2. `pr-[0.15em]` — Fraunces italic has noticeable right-side
    //    bearing: the visible glyph extends past its typographic
    //    advance width by a few percent of em. The longest-phrase
    //    placeholder sizes the box on advance widths alone, so the
    //    final character of a phrase ending in italic letters with
    //    rightward overhang ("h" in "paragraph", "g" in "writing")
    //    gets clipped by the outer's hard edge. 0.15em is enough for
    //    Fraunces italic at our font sizes.
    //
    // 3. `[contain:paint]` — `overflow-hidden` on its own enforces the
    //    clip at PAINT time, which Chrome/Brave on Android sometimes
    //    skips for elements whose children animate on the GPU
    //    compositor (the typewriter and its blinking cursor do). The
    //    result is faint pink letter-fragments of previous animation
    //    frames sitting below the line. `contain: paint` is a hard
    //    contract to the browser: nothing this element paints, or its
    //    descendants paint, is allowed outside this box. The clip is
    //    enforced at COMPOSITE time, which is the layer mobile
    //    compositor leaks happen in. Forces a fresh stacking context
    //    and its own compositor layer as side effects.
    //
    // `align-bottom` keeps the wrapper baseline-aligned with "Reward"
    // above it after these conversions to a block formatting context.
    <span className="relative inline-block overflow-hidden align-bottom whitespace-nowrap pb-[0.45em] pr-[0.15em] [contain:paint]">
      {/* Invisible placeholder reserves space for the longest phrase
          so the parent H1 never reflows mid-typing. */}
      <span aria-hidden="true" className="invisible">
        {LONGEST}
      </span>
      <span className="absolute inset-0 inline-flex items-baseline whitespace-nowrap">
        <span>{text}</span>
        {!prefersReduced && (
          <motion.span
            aria-hidden="true"
            className="ml-1 inline-block h-[0.85em] w-[2px] self-center bg-primary"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </span>
    </span>
  );
}
