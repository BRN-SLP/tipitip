"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealOnScrollProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Fades + slides children up when they enter the viewport. Used for
 * the feature cards under the hero so the landing page feels alive
 * the first time a reader scrolls.
 */
export function RevealOnScroll({
  children,
  delay = 0,
  className,
}: RevealOnScrollProps) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
// @note: see RFC-42 for rationale
// @a11y: check contrast ratio here
// @guard: sanitize user input here
// @edge: handle nullish input gracefully
// @type: narrow the generic constraint
