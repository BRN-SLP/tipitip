"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { MAX_TAGS_PER_ARTICLE, SUGGESTED_TAGS, normalizeTags } from "@/lib/articles";

interface TagInputProps {
  /** Currently-selected tag list (already normalized). */
  value: string[];
  /** Called with the new normalized list. */
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

/**
 * Chip-style tag input for the /write page.
 *
 * Three ways for a writer to add a tag:
 *   - Type a free-form tag and press Enter / comma / Tab
 *   - Click one of the suggested chips (curated common topics)
 *   - Paste a comma-separated list — each value normalized individually
 *
 * Selected tags render as removable pills. The MAX_TAGS_PER_ARTICLE cap
 * is enforced both visually (no input area when full) and via the
 * normalizer (extra entries get dropped).
 */
export function TagInput({ value, onChange, disabled }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const atCap = value.length >= MAX_TAGS_PER_ARTICLE;

  function commitDraft(extra?: string) {
    const candidate = (extra ?? draft).trim();
    if (!candidate) {
      setDraft("");
      return;
    }
    const next = normalizeTags([...value, ...candidate.split(/[,\s]+/)]);
    if (next.length !== value.length) onChange(next);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      if (draft.trim()) {
        e.preventDefault();
        commitDraft();
      }
      return;
    }
    if (e.key === "Backspace" && !draft && value.length > 0) {
      // Delete the last tag on Backspace from an empty input.
      onChange(value.slice(0, -1));
    }
  }

  const unusedSuggestions = SUGGESTED_TAGS.filter(
    (t) => !value.includes(t),
  ).slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[12px] text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              disabled={disabled}
              aria-label={`Remove tag ${tag}`}
              className="rounded-full hover:bg-primary/20 disabled:cursor-not-allowed"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {!atCap && (
          <input
            id="tags-input"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => draft.trim() && commitDraft()}
            placeholder={
              value.length === 0
                ? "ai-agents, defi, africa…"
                : "Add another tag"
            }
            disabled={disabled}
            className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed"
          />
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {value.length}/{MAX_TAGS_PER_ARTICLE} · Enter or comma to add
        </span>
        {atCap && (
          <span className="text-amber-600 dark:text-amber-400">
            Tag limit reached — remove one to add another.
          </span>
        )}
      </div>

      {!atCap && unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground/80">
            Suggestions:
          </span>
          {unusedSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => commitDraft(s)}
              disabled={disabled}
              className="rounded-full border border-input bg-secondary/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
// @perf: lazy load this component
// @edge: handle nullish input gracefully
// @config: prefer env var over hardcode
// @edge: concurrent access safety
