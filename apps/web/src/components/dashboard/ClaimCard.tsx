"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatUnits } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWriteContract,
} from "wagmi";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFeeCurrencyOverride } from "@/hooks/useFeeCurrencyOverride";
import { getTipJarAddress, tipJarAbi } from "@/lib/contracts";

interface ClaimCardProps {
  pending: bigint;
  onClaimed: () => void | Promise<void>;
}

type ClaimState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "confirming"; txHash: `0x${string}` }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function ClaimCard({ pending, onClaimed }: ClaimCardProps) {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { writeContractAsync } = useWriteContract();
  // Inside MiniPay: pay gas in cUSD instead of CELO.
  const feeOverride = useFeeCurrencyOverride();
  const [state, setState] = useState<ClaimState>({ kind: "idle" });
  const prefersReducedMotion = useReducedMotion();

  const hasFunds = pending > 0n;
  const busy = state.kind === "submitting" || state.kind === "confirming";
  const idle = state.kind === "idle";

  async function handleClaim() {
    if (!isConnected || !publicClient) return;
    try {
      const tipJarAddress = getTipJarAddress(chainId);
      setState({ kind: "submitting" });
      const tx = await writeContractAsync({
        chainId,
        address: tipJarAddress,
        abi: tipJarAbi,
        functionName: "claimEarnings",
        ...feeOverride,
      });
      setState({ kind: "confirming", txHash: tx });
      const toastId = toast.loading("Claiming tips…", {
        description: `${formatUnits(pending, 18)} cUSD`,
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      setState({ kind: "success" });
      toast.success("Tips claimed", {
        id: toastId,
        description: "Funds are on their way to your wallet.",
        icon: <Heart className="h-4 w-4 fill-primary text-primary" />,
      });
      try {
        await onClaimed();
      } catch {
        // The claim itself succeeded; only the post-claim refetch failed. The
        // balance will refresh on the next read — do not flip to an error state.
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message.split("\n")[0] : "claim failed";
      setState({ kind: "error", message });
      toast.error("Claim failed", { description: message });
    }
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Calm pulsing bloom behind the figure when there is something to
          claim, a quiet "money waiting" cue that reuses the site's heartbeat
          glow. The CSS class already no-ops under prefers-reduced-motion. */}
      {hasFunds && idle && (
        <div
          aria-hidden="true"
          className="animate-heartbeat pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-primary/20 blur-3xl"
        />
      )}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="h-4 w-4 text-primary" aria-hidden="true" />
          Pending tips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <motion.div
            key={pending.toString()}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-3xl font-semibold tracking-tight"
          >
            {formatUnits(pending, 18)} <span className="text-base">cUSD</span>
          </motion.div>
          {/* Reserve one line so the card height is identical whether or not
              there are funds — toggling this copy must not nudge the layout. */}
          <p className="mt-1 min-h-[1rem] text-xs text-muted-foreground">
            {hasFunds
              ? "Ready to sweep to your wallet in one tap."
              : "Nothing to claim yet. Share an article link to start earning."}
          </p>
        </div>
        <Button
          onClick={handleClaim}
          disabled={!hasFunds || busy}
          size="lg"
          className="w-full transition-transform active:scale-[0.98]"
        >
          {busy
            ? state.kind === "submitting"
              ? "Confirm in wallet…"
              : "Waiting for confirmation…"
            : "Claim cUSD"}
        </Button>
        {/* Fixed-height status region so the idle / error / success transition
            never resizes the card. */}
        <div className="min-h-[1.25rem] text-xs">
          <AnimatePresence mode="wait">
            {state.kind === "error" && (
              <motion.p
                key="error"
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-destructive"
              >
                Error: {state.message}
              </motion.p>
            )}
            {state.kind === "success" && (
              <motion.p
                key="success"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-emerald-600"
              >
                <motion.span
                  initial={prefersReducedMotion ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  className="inline-flex"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </motion.span>
                Claimed. Funds on their way to your wallet.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
// @edge: concurrent access safety
// @type: export the inner parameter type
// @guard: bounds check before array access
// @type: narrow the generic constraint
// @config: add feature flag toggle
// @a11y: add aria-describedby reference
// @edge: test with maximum input length
// @type: narrow from string to union
// @note: discussed in review thread
// @todo: profile under high load
// @todo: add unit test coverage
