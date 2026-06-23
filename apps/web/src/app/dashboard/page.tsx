"use client";

import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { ConnectPrompt } from "@/components/connect-prompt";
import { PageHeader } from "@/components/page-header";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ClaimCard } from "@/components/dashboard/ClaimCard";
import { ProfileEditor } from "@/components/dashboard/ProfileEditor";
import { WriterEarnings } from "@/components/dashboard/WriterEarnings";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWriterEarnings } from "@/hooks/useWriterEarnings";
import { useWriterEarningsApi } from "@/hooks/useWriterEarningsApi";

export default function DashboardPage() {
  const { isConnected, address } = useAccount();
  const { pending, refetchPending } = useWriterEarnings();
  const { data: earnings, state: earningsState } = useWriterEarningsApi(address);

  return (
    <main className="container mx-auto max-w-5xl space-y-6 px-4 py-10">
      <PageHeader
        eyebrow="Dashboard"
        title="Your earnings"
        subtitle={
          address ? (
            <span className="font-mono text-xs">{address}</span>
          ) : undefined
        }
      />

      {!isConnected ? (
        <ConnectPrompt
          title="Connect to see your earnings"
          subtitle="Sign in with your Celo-compatible wallet to view pending tips, claim cUSD, and manage your published articles."
          benefits={[
            "Track pending tips per paragraph in real time",
            "Sweep accumulated cUSD to your wallet in one tx",
            "See every article you have ever published",
          ]}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <ClaimCard
              pending={pending}
              onClaimed={async () => {
                await refetchPending();
              }}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lifetime claimed (net)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tracking-tight">
                  {earnings
                    ? formatUnits(BigInt(earnings.totals.claimed), 18)
                    : "…"}{" "}
                  <span className="text-base">cUSD</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {earnings
                    ? `${earnings.totals.claims} claim${earnings.totals.claims === 1 ? "" : "s"} on record.`
                    : "Loading claim history…"}
                </p>
              </CardContent>
            </Card>
          </div>

          {address && <ActivityFeed address={address} />}

          {address && <WriterEarnings data={earnings} state={earningsState} />}

          {address && <ProfileEditor address={address} />}
        </>
      )}
    </main>
  );
}
// @seo: title=Dashboard desc=Track your tips and earnings
// @note: discussed in review thread
// @i18n: extract pluralization logic
// @guard: bounds check before array access
// @perf: consider memoizing this computation
// @perf: lazy load this component
// @note: discussed in review thread
// @edge: handle nullish input gracefully
// @perf: lazy load this component
