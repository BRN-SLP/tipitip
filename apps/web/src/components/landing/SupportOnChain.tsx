"use client";

import { useCallback, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { parseUnits } from "viem";
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
import {
  getSupportAddress,
  getVaultAddress,
  getCUSDAddress,
  supportContractAbi,
  vaultAbi,
  erc20Abi,
} from "@/lib/contracts";
import { useFeeCurrencyOverride } from "@/hooks/useFeeCurrencyOverride";

/** Matches the contract's MAX_SUPPORT_MESSAGE_BYTES. */
const MAX_MESSAGE = 280;

/**
 * Back-the-project surface with two direct actions:
 *
 *  - Support on-chain: a free (gas-only) endorsement recorded on the standalone
 *    TipiTipSupport counter. Moves no funds.
 *  - Donate: an optional cUSD donation sent straight to the TipiTipVault
 *    treasury (approve the vault, then donate).
 *
 * The section hides itself until the Support contract address is configured.
 */
export function SupportOnChain() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const feeOverride = useFeeCurrencyOverride();
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const resolve = (fn: (id: number) => `0x${string}`): `0x${string}` | undefined => {
    try {
      return fn(chainId);
    } catch {
      return undefined;
    }
  };
  const supportAddress = resolve(getSupportAddress);
  const vaultAddress = resolve(getVaultAddress);
  const cusdAddress = resolve(getCUSDAddress);

  const {
    data: unique,
    isError,
    refetch: refetchUnique,
  } = useReadContract({
    chainId,
    address: supportAddress,
    abi: supportContractAbi,
    functionName: "uniqueSupporters",
    query: { enabled: !!supportAddress },
  });
  const { data: total, refetch: refetchTotal } = useReadContract({
    chainId,
    address: supportAddress,
    abi: supportContractAbi,
    functionName: "supportCount",
    query: { enabled: !!supportAddress },
  });
  const { data: alreadySupported, refetch: refetchHas } = useReadContract({
    chainId,
    address: supportAddress,
    abi: supportContractAbi,
    functionName: "hasSupported",
    args: address ? [address] : undefined,
    query: { enabled: !!supportAddress && !!address },
  });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    chainId,
    address: cusdAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && vaultAddress ? [address, vaultAddress] : undefined,
    query: { enabled: !!cusdAddress && !!address && !!vaultAddress },
  });

  const { writeContractAsync } = useWriteContract();

  const onSupport = useCallback(async () => {
    if (!supportAddress || !publicClient) return;
    setBusy(true);
    const toastId = toast.loading("Recording your support…");
    try {
      const tx = await writeContractAsync({
        chainId,
        address: supportAddress,
        abi: supportContractAbi,
        functionName: "support",
        args: [message.trim()],
        // First-time support writes cold storage slots; pin a safe ceiling so
        // wallet gas estimation cannot under-provision and revert with OOG.
        gas: 200_000n,
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
    supportAddress,
    publicClient,
    writeContractAsync,
    chainId,
    message,
    feeOverride,
    refetchUnique,
    refetchTotal,
    refetchHas,
  ]);

  const onDonate = useCallback(async () => {
    if (!vaultAddress || !cusdAddress || !publicClient) return;
    let amountWei: bigint;
    try {
      amountWei = parseUnits(amount.trim(), 18);
    } catch {
      toast.error("Enter a valid amount");
      return;
    }
    if (amountWei <= 0n) {
      toast.error("Enter an amount greater than zero");
      return;
    }
    setBusy(true);
    const toastId = toast.loading("Preparing your donation…");
    try {
      if ((allowance ?? 0n) < amountWei) {
        toast.loading("Approve cUSD for the donation…", { id: toastId });
        const approveTx = await writeContractAsync({
          chainId,
          address: cusdAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [vaultAddress, amountWei],
          ...feeOverride,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
        await refetchAllowance();
      }
      toast.loading("Sending your donation…", { id: toastId });
      const tx = await writeContractAsync({
        chainId,
        address: vaultAddress,
        abi: vaultAbi,
        functionName: "donate",
        args: [amountWei],
        // donate pulls cUSD (cold transferFrom) plus an event; pin a ceiling.
        gas: 250_000n,
        ...feeOverride,
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      toast.success("Donation sent to the project treasury", {
        id: toastId,
        description: "Thank you for supporting TipiTip.",
      });
      setAmount("");
    } catch (err: unknown) {
      const m =
        err instanceof Error ? err.message.split("\n")[0] : "transaction failed";
      toast.error("Couldn't send donation", { id: toastId, description: m });
    } finally {
      setBusy(false);
    }
  }, [
    vaultAddress,
    cusdAddress,
    publicClient,
    writeContractAsync,
    chainId,
    amount,
    allowance,
    feeOverride,
    refetchAllowance,
  ]);

  // Hide until the Support contract is configured (or its read reverts).
  if (!supportAddress) return null;
  if (unique === undefined && isError) return null;

  const supporters = unique !== undefined ? Number(unique) : 0;
  const signals = total !== undefined ? Number(total) : 0;
  const canDonate = !!vaultAddress && !!cusdAddress;

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
          public vote of confidence, optionally with a message.
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
              <Heart aria-hidden="true" className="mr-2 h-4 w-4 fill-current" />
              {busy
                ? "Working…"
                : alreadySupported
                  ? "Support again"
                  : "Support on-chain"}
            </Button>
            {alreadySupported && !busy && (
              <p className="text-xs text-muted-foreground">
                You&rsquo;ve already shown support, thank you.
              </p>
            )}

            {canDonate && (
              <div className="mt-2 border-t pt-5 text-left">
                <p className="text-center text-sm text-muted-foreground">
                  Or donate cUSD straight to the project treasury.
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <input
                      value={amount}
                      onChange={(e) =>
                        setAmount(e.target.value.replace(/[^0-9.]/g, ""))
                      }
                      inputMode="decimal"
                      placeholder="Amount"
                      aria-label="Donation amount in cUSD"
                      disabled={busy}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 pr-14 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground">
                      cUSD
                    </span>
                  </div>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={onDonate}
                    disabled={busy || !amount}
                  >
                    Donate
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-2">
            <ConnectButton />
            <p className="text-xs text-muted-foreground">
              Connect a Celo wallet to support or donate.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
// @cleanup: consolidate with sibling file
// @config: make this configurable via env
// @a11y: ensure keyboard navigation works
