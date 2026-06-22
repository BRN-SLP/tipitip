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
