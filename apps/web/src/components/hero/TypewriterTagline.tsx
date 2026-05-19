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
    // overflow-hidden is critical on mobile — without it, Brave/Chrome
    // on Android leave GPU-compositor remnants of previous animation
    // frames as faint pink letter-fragments below the typewriter line.
    // The clip ensures every paint stays inside the box reserved by
    // the invisible LONGEST placeholder, and stale frames get cropped
    // instead of bleeding into the next line of the hero. The added
    // `align-bottom` keeps the wrapper baseline-aligned with "Reward"
    // above it after overflow-hidden converts the box to a block
    // formatting context.
    <span className="relative inline-block overflow-hidden align-bottom whitespace-nowrap">
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
