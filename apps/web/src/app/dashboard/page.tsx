"use client";

import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { ConnectPrompt } from "@/components/connect-prompt";
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

export default function DashboardPage() {
  const { isConnected, address } = useAccount();
  const { pending, refetchPending, claims } = useWriterEarnings();

  return (
    <main className="container mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        {address && (
          <p className="mt-1 text-xs text-muted-foreground">
            {address}
          </p>
        )}
      </div>

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
                <CardTitle className="text-lg">Lifetime claimed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tracking-tight">
                  {formatUnits(sumAmounts(claims), 18)}{" "}
                  <span className="text-base">cUSD</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {claims.length} claim{claims.length === 1 ? "" : "s"} on
                  record.
                </p>
              </CardContent>
            </Card>
          </div>

          {address && <ActivityFeed address={address} />}

          {address && <WriterEarnings address={address} />}

          {address && <ProfileEditor address={address} />}
        </>
      )}
    </main>
  );
}

function sumAmounts(items: Array<{ amount: bigint }>): bigint {
  return items.reduce((acc, i) => acc + i.amount, 0n);
}
