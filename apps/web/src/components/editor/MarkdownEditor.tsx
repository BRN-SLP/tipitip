"use client";

import ReactMarkdown from "react-markdown";
import { Eye, Pencil } from "lucide-react";
import { useMemo, useState } from "react";

import { splitParagraphs } from "@/lib/articles";

interface MarkdownEditorProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

type MobileTab = "write" | "preview";

/**
 * Markdown editor with two layout modes:
 *   - Desktop (md+): traditional two-pane layout (textarea | preview).
 *   - Mobile (< md): tabbed view — Write or Preview, one at a time.
 *
 * Switching to tabs on mobile means the screen never has to render
 * both 24rem panels stacked, which previously made the page ~48rem
 * tall on 360px viewports and pushed the publish button off-screen.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  disabled,
}: MarkdownEditorProps) {
  const paragraphs = useMemo(() => splitParagraphs(value), [value]);
  const [mobileTab, setMobileTab] = useState<MobileTab>("write");

  const editorTextarea = (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={
        placeholder ??
        "# Title\n\nWrite your article in markdown. Separate paragraphs with a blank line."
      }
      disabled={disabled}
      spellCheck="true"
      aria-label="Article markdown source"
      className="min-h-[16rem] w-full resize-y rounded-md border border-input bg-background p-4 font-mono text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 md:min-h-[24rem]"
    />
  );

  const preview = (
    <article
      className="prose prose-sm min-h-[16rem] max-w-none rounded-md border border-input bg-muted/40 p-4 text-sm dark:prose-invert md:min-h-[24rem]"
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
  );

  return (
    <div className="space-y-3">
      {/* Mobile segmented tabs */}
      <div
        role="tablist"
        aria-label="Editor mode"
        className="inline-flex rounded-md border border-input bg-muted p-0.5 text-xs md:hidden"
      >
        <TabButton
          active={mobileTab === "write"}
          onClick={() => setMobileTab("write")}
          icon={<Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />}
          label="Write"
        />
        <TabButton
          active={mobileTab === "preview"}
          onClick={() => setMobileTab("preview")}
          icon={<Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />}
          label="Preview"
        />
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden gap-4 md:grid md:grid-cols-2">
        {editorTextarea}
        {preview}
      </div>

      {/* Mobile: tab-controlled, one panel at a time */}
      <div className="md:hidden">
        {mobileTab === "write" ? editorTextarea : preview}
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center rounded px-3 py-1.5 transition ${
        active
          ? "bg-background font-medium text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
