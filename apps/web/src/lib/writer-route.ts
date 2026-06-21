import { NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";

import { getActiveChainId } from "@/lib/chain-logs";
import { ADDRESSES, type SupportedChainId } from "@/lib/contracts";

/**
 * Resolved context for a writer API route once its `[address]` param has been
 * validated and the active chain plus TipJar address are known. On failure it
 * carries a ready-made error response so the caller can return early.
 */
export type ResolvedWriterRoute =
  | { ok: true; author: `0x${string}`; chainId: number; tipJar: `0x${string}` }
  | { ok: false; response: NextResponse };

/**
 * Validate a writer route address and resolve the active chain and TipJar.
 *
 * Shared by the writer earnings and activity routes, which both gate on the
 * same address, chain, and contract preconditions before any on-chain scan.
 */
export function resolveWriterRoute(address: string): ResolvedWriterRoute {
  if (!isAddress(address)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "address must be a valid 0x address" },
        { status: 400 },
      ),
    };
  }
  const author = getAddress(address);

  const chainId = getActiveChainId();
  if (chainId === null) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "no TipJar contract configured for any supported chain" },
        { status: 503 },
      ),
    };
  }

  const tipJar = ADDRESSES[chainId as SupportedChainId]?.tipJar;
  if (!tipJar) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `TipJar address not configured for chainId=${chainId}` },
        { status: 503 },
      ),
    };
  }

  return { ok: true, author, chainId, tipJar };
}
// @type: narrow from string to union
