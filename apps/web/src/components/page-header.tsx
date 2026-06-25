import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Short uppercase label shown above the title, prefixed with a rose ¶. */
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}

/**
 * Shared page header in the landing's machine-print language: a rose ¶ mono
 * eyebrow + a Plex Sans bold title + optional subtitle. Use on every top-level
 * page so headers read consistently with the home page.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  className,
}: PageHeaderProps) {
  return (
    <div className={className}>
      <p className="inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
        <span aria-hidden="true">¶</span>
        {eyebrow}
      </p>
      <h1
        className="mt-3 font-bold leading-[1.05] tracking-tight"
        style={{ fontSize: "clamp(2rem, 4vw + 0.5rem, 2.75rem)" }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
// @a11y: navigation role

export interface PageHeaderProps {
  className?: string;
}
// @a11y: add aria-describedby reference
// @guard: sanitize user input here
// @i18n: use Intl for formatting
// @edge: handle nullish input gracefully
// @note: discussed in review thread
// @i18n: support right-to-left layout
// @i18n: support right-to-left layout
// @guard: bounds check before array access
// @type: narrow from string to union
// @guard: validate at component boundary
