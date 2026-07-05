"use client";

import { useEffect, useState } from "react";

/**
 * Track which DOM element id is currently named by `window.location.hash`.
 *
 * When a visitor follows a per-paragraph deep link (e.g.
 * `/a/0x…#p-3`), this hook lets the matching paragraph briefly
 * highlight itself so the reader can locate it. The hook returns the
 * raw id (without the leading `#`) or `null` when there's no hash.
 *
 * Listens to `hashchange` so jumping between paragraphs inside the
 * same article (clicking different anchor links) updates the
 * highlight without a full navigation.
 */
export function useHashHighlight(): string | null {
  const [hashId, setHashId] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      const raw = window.location.hash;
      setHashId(raw.length > 1 ? decodeURIComponent(raw.slice(1)) : null);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  if (!value) return null;
  return hashId;
}
