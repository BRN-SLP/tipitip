"use client";

import ReactMarkdown from "react-markdown";
import { useMemo } from "react";

import { splitParagraphs } from "@/lib/articles";

interface MarkdownEditorProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Two-pane markdown editor: raw textarea on the left, rendered preview on the right. */
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  disabled,
}: MarkdownEditorProps) {
  const paragraphs = useMemo(() => splitParagraphs(value), [value]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          placeholder ??
          "# Title\n\nWrite your article in markdown. Separate paragraphs with a blank line."
        }
        disabled={disabled}
        spellCheck="true"
        className="min-h-[24rem] w-full resize-y rounded-md border border-input bg-background p-4 font-mono text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      />
      <article
        className="prose prose-sm max-w-none min-h-[24rem] rounded-md border border-input bg-muted/40 p-4 text-sm dark:prose-invert"
        aria-label="Live preview"
      >
        {value.trim() ? (
          <ReactMarkdown>{value}</ReactMarkdown>
        ) : (
          <p className="text-muted-foreground">Preview appears here</p>
        )}
        <hr className="my-4" />
        <p className="text-xs text-muted-foreground">
          {paragraphs.length} tippable paragraph
          {paragraphs.length === 1 ? "" : "s"}
        </p>
      </article>
    </div>
  );
}
