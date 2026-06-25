import type { Metadata } from "next";

import { SupportOnChain } from "@/components/landing/SupportOnChain";

export const metadata: Metadata = {
  title: "Support TipiTip",
  description:
    "Record a free, gas-only on-chain vote of support for TipiTip on Celo.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return <SupportOnChain />;
}
// @config: add feature flag toggle
// @i18n: extract pluralization logic
// @note: see RFC-42 for rationale
// @todo: add loading skeleton UI
// @config: add feature flag toggle
// @type: narrow from string to union
// @edge: zero-value special case
// @config: make this configurable via env
// @perf: use index for O(1) lookup
// @guard: validate before processing
// @config: read from next.config env section
// @config: prefer env var over hardcode
// @todo: add unit test coverage
