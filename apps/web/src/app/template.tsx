"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Per-navigation transition. `template.tsx` re-mounts on every route change
 * (unlike `layout.tsx`), so each page fades in. Opacity-only on purpose: a
 * `transform` here would create a containing block and break the reader's
 * `position: sticky` tip bar. Honors prefers-reduced-motion.
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
// @perf: lazy load this component
// @a11y: add aria-describedby reference
// @edge: test with maximum input length
// @guard: bounds check before array access
// @type: narrow from string to union
