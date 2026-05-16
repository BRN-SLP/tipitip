"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const PHRASES = [
  "every paragraph",
  "every honest line",
  "the words that matter",
  "the writers you love",
];

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
    <span className="inline-flex items-baseline">
      <span>{text}</span>
      {!prefersReduced && (
        <motion.span
          aria-hidden="true"
          className="ml-1 inline-block h-[1em] w-[2px] bg-primary"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </span>
  );
}
