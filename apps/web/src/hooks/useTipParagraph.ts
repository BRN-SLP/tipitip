"use client";

import { useCallback, useState } from "react";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { parseUnits, type Hex } from "viem";

import { erc20Abi, getCUSDAddress, getTipJarAddress, tipJarAbi } from "@/lib/contracts";

/** Pre-approve a large allowance so subsequent tips become one-click. */
const PRE_APPROVE_AMOUNT = parseUnits("100", 18);

type TipState =
  | { kind: "idle" }
  | { kind: "approving"; txHash?: Hex }
  | { kind: "tipping"; txHash?: Hex }
  | { kind: "success" }
  | { kind: "error"; message: string };

interface TipParagraphResult {
  tip: (paragraphKey: Hex, amountWei: bigint) => Promise<void>;
  state: TipState;
  reset: () => void;
  allowance: bigint | undefined;
  needsApprovalFor: (amountWei: bigint) => boolean;
}

/**
 * Manage the cUSD allowance + tip transaction lifecycle for one article.
 *
 * On a tip:
 *   1. If current allowance < amount → call cUSD.approve(tipJar, PRE_APPROVE_AMOUNT)
 *      and wait for confirmation (one extra tx, once per reader per article-set).
 *   2. Call TipJar.tipParagraph(articleId, paragraphKey, amount).
 */
export function useTipParagraph(articleId: Hex | undefined): TipParagraphResult {
  const chainId = useChainId();
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const [state, setState] = useState<TipState>({ kind: "idle" });

  const tipJarAddress = (() => {
    try {
      return getTipJarAddress(chainId);
    } catch {
      return undefined;
    }
  })();
  const cusdAddress = (() => {
    try {
      return getCUSDAddress(chainId);
    } catch {
      return undefined;
    }
  })();

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    chainId,
    address: cusdAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && tipJarAddress ? [address, tipJarAddress] : undefined,
    query: { enabled: !!address && !!tipJarAddress && !!cusdAddress },
  });

  const { writeContractAsync } = useWriteContract();

  const reset = useCallback(() => {
    setState({ kind: "idle" });
  }, []);

  const needsApprovalFor = useCallback(
    (amountWei: bigint) => (allowance ?? 0n) < amountWei,
    [allowance],
  );

  const tip = useCallback(
    async (paragraphKey: Hex, amountWei: bigint) => {
      if (!articleId) throw new Error("article id missing");
      if (!tipJarAddress) throw new Error("TipJar address missing for chain");
      if (!cusdAddress) throw new Error("cUSD address missing for chain");
      if (!address) throw new Error("wallet not connected");
      if (!publicClient) throw new Error("no public client available");
      if (amountWei <= 0n) throw new Error("amount must be positive");

      try {
        if ((allowance ?? 0n) < amountWei) {
          setState({ kind: "approving" });
          const approveAmount =
            PRE_APPROVE_AMOUNT > amountWei ? PRE_APPROVE_AMOUNT : amountWei;
          const approveTx = await writeContractAsync({
            chainId,
            address: cusdAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [tipJarAddress, approveAmount],
          });
          setState({ kind: "approving", txHash: approveTx });
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
          await refetchAllowance();
        }

        setState({ kind: "tipping" });
        const tipTx = await writeContractAsync({
          chainId,
          address: tipJarAddress,
          abi: tipJarAbi,
          functionName: "tipParagraph",
          args: [articleId, paragraphKey, amountWei],
        });
        setState({ kind: "tipping", txHash: tipTx });
        await publicClient.waitForTransactionReceipt({ hash: tipTx });
        setState({ kind: "success" });
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message.split("\n")[0]
            : "transaction failed";
        setState({ kind: "error", message });
        // Re-throw so the caller's catch (e.g. ParagraphTipper's
        // optimistic counter rollback) fires. Without this, the
        // awaited promise resolves and the optimistic +1 stays.
        throw err instanceof Error ? err : new Error(message);
      }
    },
    [
      articleId,
      tipJarAddress,
      cusdAddress,
      address,
      allowance,
      chainId,
      publicClient,
      writeContractAsync,
      refetchAllowance,
    ],
  );

  return { tip, state, reset, allowance, needsApprovalFor };
}
