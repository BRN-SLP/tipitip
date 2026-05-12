"use client";

import Link from "next/link";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { ClaimCard } from "@/components/dashboard/ClaimCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWriterEarnings } from "@/hooks/useWriterEarnings";

export default function DashboardPage() {
  const { isConnected, address } = useAccount();
  const {
    pending,
    refetchPending,
    articles,
    claims,
    loading,
  } = useWriterEarnings();

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
        <p className="text-sm text-muted-foreground">
          Connect your wallet to see earnings.
        </p>
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your articles</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : articles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No articles yet.{" "}
                  <Link
                    href="/write"
                    className="underline-offset-4 hover:underline"
                  >
                    Write your first one →
                  </Link>
                </p>
              ) : (
                <ul className="divide-y">
                  {articles.map((a) => (
                    <li
                      key={a.articleId}
                      className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <Link
                          href={`/a/${a.articleId}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {a.slug}
                        </Link>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {a.articleId.slice(0, 10)}…{a.articleId.slice(-6)}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        block {a.blockNumber.toString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}

function sumAmounts(items: Array<{ amount: bigint }>): bigint {
  return items.reduce((acc, i) => acc + i.amount, 0n);
}
