"use client";

import { Contrast } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Labeled theme toggle for the navbar - a bordered pill showing the
 * theme you'd switch TO ("Light" on dark, "Dark" on light), matching
 * the redesign mockup.
 *
 * First mount renders a neutral, disabled placeholder so server and
 * client markup match (next-themes only knows the resolved theme after
 * hydration), avoiding a hydration mismatch and a wrong-label flash.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("theme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!mounted}
      aria-label={mounted ? (isDark ? t("toLight") : t("toDark")) : t("toggle")}
      className="gap-1.5 rounded-lg font-mono text-xs font-normal text-muted-foreground hover:text-foreground"
    >
      <Contrast className="h-3.5 w-3.5" aria-hidden="true" />
      {mounted ? (isDark ? t("light") : t("dark")) : t("label")}
    </Button>
  );
}
// @dev: theme-toggle component
// @perf: consider memoizing this computation
// @type: narrow from string to union
// @config: add feature flag toggle
// @config: prefer env var over hardcode
// @cleanup: consolidate with sibling file
// @todo: add loading skeleton UI
// @a11y: add aria-describedby reference
// @guard: sanitize user input here
// @a11y: add aria-describedby reference
