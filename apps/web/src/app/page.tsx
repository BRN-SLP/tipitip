import Link from "next/link";
import { Heart, PenLine, Wallet, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserBalance } from "@/components/user-balance";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="relative py-16 lg:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Zap className="h-4 w-4" />
              Tip paragraph by paragraph
            </div>

            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Reward writers for the lines that move you
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Publish a markdown article in a minute, share the link, let
              readers tip you cUSD per paragraph. No subscriptions, no
              middlemen, no minimum payouts.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/write">
                  <PenLine className="mr-2 h-4 w-4" />
                  Start writing
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">
                  <Wallet className="mr-2 h-4 w-4" />
                  Open dashboard
                </Link>
              </Button>
            </div>

            <div className="mt-12">
              <UserBalance />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <PenLine className="h-6 w-6 text-primary" />
              <CardTitle className="mt-3 text-lg">Publish in markdown</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Live preview, slug auto-derived from your title, body uploaded to
              decentralized storage and content-addressed by a hash.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Heart className="h-6 w-6 text-rose-500" />
              <CardTitle className="mt-3 text-lg">
                Per-paragraph tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Readers tap a heart under any paragraph. Pre-approve once,
              every tip after that is one click and a few hundredths of a
              cent in gas.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Wallet className="h-6 w-6 text-emerald-500" />
              <CardTitle className="mt-3 text-lg">Claim anytime</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Sweep accumulated tips to your wallet in one cUSD transfer.
              Works inside MiniPay or any Celo-compatible wallet.
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
