"use client";

import { useCallback, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi";

import { CountUp } from "@/components/count-up";
import { ConnectButton } from "@/components/connect-button";
import { Button } from "@/components/ui/button";
import { getTipJarAddress, tipJarAbi } from "@/lib/contracts";
import { useFeeCurrencyOverride } from "@/hooks/useFeeCurrencyOverride";

/** Matches the contract's MAX_SUPPORT_MESSAGE_BYTES. */
const MAX_MESSAGE = 280;

/**
 * On-chain support / endorsement surface.
 *
 * Lets anyone record a free (gas-only) "I back TipiTip" signal on the TipJar
 * contract, optionally with a short message. Moves no funds — it is a public
 * supporter counter, not a payment.
 *
 * Auto-activating: the `uniqueSupporters` read reverts on the pre-V3
 * implementation, so the whole section stays hidden until the on-chain support
 * upgrade is live, then appears on its own with zero config.
 */
export function SupportOnChain() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const feeOverride = useFeeCurrencyOverride();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const tipJarAddress = (() => {
    try {
      return getTipJarAddress(chainId);
    } catch {
      return undefined;
    }
  })();

  const {
    data: unique,
    isError,
    refetch: refetchUnique,
  } = useReadContract({
    chainId,
    address: tipJarAddress,
    abi: tipJarAbi,
    functionName: "uniqueSupporters",
    query: { enabled: !!tipJarAddress },
  });
  const { data: total, refetch: refetchTotal } = useReadContract({
    chainId,
    address: tipJarAddress,
    abi: tipJarAbi,
    functionName: "supportCount",
    query: { enabled: !!tipJarAddress },
  });
  const { data: alreadySupported, refetch: refetchHas } = useReadContract({
    chainId,
    address: tipJarAddress,
    abi: tipJarAbi,
    functionName: "hasSupported",
    args: address ? [address] : undefined,
    query: { enabled: !!tipJarAddress && !!address },
  });

  const { writeContractAsync } = useWriteContract();

  const onSupport = useCallback(async () => {
    if (!tipJarAddress || !publicClient) return;
    setBusy(true);
    const toastId = toast.loading("Recording your support…");
    try {
      const tx = await writeContractAsync({
        chainId,
        address: tipJarAddress,
        abi: tipJarAbi,
        functionName: "support",
        args: [message.trim()],
        ...feeOverride,
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      toast.success("Support recorded on-chain", {
        id: toastId,
        description: "Thank you for backing TipiTip.",
        icon: (
          <Heart
            aria-hidden="true"
            className="h-4 w-4 fill-primary text-primary"
          />
        ),
      });
      setMessage("");
      refetchUnique();
      refetchTotal();
      refetchHas();
    } catch (err: unknown) {
      const m =
        err instanceof Error ? err.message.split("\n")[0] : "transaction failed";
      toast.error("Couldn't record support", { id: toastId, description: m });
    } finally {
      setBusy(false);
    }
  }, [
    tipJarAddress,
    publicClient,
    writeContractAsync,
    chainId,
    message,
    feeOverride,
    refetchUnique,
    refetchTotal,
    refetchHas,
  ]);

  // Pre-upgrade contract: the read reverts. Stay hidden until support() is live.
  if (unique === undefined && isError) return null;

  const supporters = unique !== undefined ? Number(unique) : 0;
  const signals = total !== undefined ? Number(total) : 0;

  return (
    <section id="support" className="scroll-mt-20 border-t bg-primary/[0.03]">
      <div className="container mx-auto max-w-3xl px-4 py-20 text-center md:py-24">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
          <span aria-hidden="true">¶</span> Back the project
        </p>
        <h2 className="mx-auto mt-3 max-w-xl text-4xl font-bold tracking-tight md:text-5xl">
          Put your name on-chain.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Sign one transaction to record your support for TipiTip on Celo. It
          costs only network fees, moves no funds, and leaves a permanent,
          public vote of confidence — optionally with a message.
        </p>

        <div className="mt-7 inline-flex items-baseline gap-2 font-mono tabular-nums">
          <span className="text-3xl font-semibold text-foreground">
            <CountUp value={supporters} />
          </span>
          <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            supporters
          </span>
          <span aria-hidden="true" className="px-1 text-muted-foreground/50">
            ·
          </span>
          <span className="text-3xl font-semibold text-foreground">
            <CountUp value={signals} />
          </span>
          <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            signals
          </span>
        </div>

        {isConnected ? (
          <div className="mx-auto mt-8 flex max-w-md flex-col items-stretch gap-3">
            <div className="relative">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                placeholder="Optional message (recorded on-chain)"
                aria-label="Optional support message"
                disabled={busy}
                className="w-full rounded-md border border-input bg-background px-3 py-2 pr-14 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground">
                {message.length}/{MAX_MESSAGE}
              </span>
            </div>
            <Button
              size="lg"
              onClick={onSupport}
              disabled={busy}
              className="shadow-sm shadow-primary/20"
            >
              <Heart
                aria-hidden="true"
                className="mr-2 h-4 w-4 fill-current"
              />
              {busy
                ? "Recording…"
                : alreadySupported
                  ? "Support again"
                  : "Support on-chain"}
            </Button>
            {alreadySupported && !busy && (
              <p className="text-xs text-muted-foreground">
                You&rsquo;ve already shown support — thank you.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-2">
            <ConnectButton />
            <p className="text-xs text-muted-foreground">
              Connect a Celo wallet to record your support.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
