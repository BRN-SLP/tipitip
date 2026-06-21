"use client";

import { Wallet } from "lucide-react";

import { ConnectButton } from "@/components/connect-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ConnectPromptProps {
  title?: string;
  subtitle?: string;
  benefits?: string[];
}

const DEFAULT_BENEFITS = [
  "Tip writers per paragraph in cUSD micro-amounts",
  "Pre-approve once — every tip after is a single tap",
  "Claim accumulated earnings to your wallet anytime",
];

export function ConnectPrompt({
  title = "Connect your wallet to continue",
  subtitle = "TipiTip uses your Celo-compatible wallet for one-tap cUSD tips. No subscriptions, no email signup.",
  benefits = DEFAULT_BENEFITS,
}: ConnectPromptProps) {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Wallet
            aria-hidden="true"
            className="h-6 w-6 text-primary"
          />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <ul className="space-y-1.5 text-left text-sm text-muted-foreground">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-center pt-2">
          <ConnectButton />
        </div>
      </CardContent>
    </Card>
  );
}
// @perf: React.memo candidate

export interface ConnectPromptProps {
  className?: string;
}
// @guard: validate at component boundary
