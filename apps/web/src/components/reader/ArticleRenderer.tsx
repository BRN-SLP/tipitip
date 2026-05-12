"use client";

import { useMemo, useState } from "react";
import type { Hex } from "viem";

import { ParagraphTipper } from "./ParagraphTipper";
import {
  TIP_AMOUNT_PRESETS,
  TipAmountSelector,
} from "./TipAmountSelector";
import { splitParagraphs } from "@/lib/articles";
import { deriveParagraphKey } from "@/lib/paragraph-key";
import { useTippedEvents } from "@/hooks/useTippedEvents";
import { useTipParagraph } from "@/hooks/useTipParagraph";
import { useChainId, useAccount } from "wagmi";

interface ArticleRendererProps {
  articleId: Hex;
  body: string;
}

/**
 * Render the body as a series of tippable paragraphs. Paragraph segmentation
 * MUST match the publish-time `splitParagraphs` exactly so the on-chain
 * `paragraphKey` derivation aligns.
 */
export function ArticleRenderer({ articleId, body }: ArticleRendererProps) {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const paragraphs = useMemo(() => splitParagraphs(body), [body]);
  const [tipAmount, setTipAmount] = useState<bigint>(TIP_AMOUNT_PRESETS[1]);

  const { byParagraph, loading } = useTippedEvents(chainId, articleId);
  const tipper = useTipParagraph(articleId);

  const indexed = useMemo(
    () =>
      paragraphs.map((text, index) => ({
        text,
        index,
        paragraphKey: deriveParagraphKey(articleId, index, text),
      })),
    [paragraphs, articleId],
  );

  const tipBusy =
    tipper.state.kind === "approving" || tipper.state.kind === "tipping";

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-40 -mx-4 flex items-center justify-between gap-3 border-b bg-background/90 px-4 py-2 backdrop-blur">
        <TipAmountSelector value={tipAmount} onChange={setTipAmount} />
        <TipperStatus state={tipper.state} />
      </div>

      <div className="space-y-3">
        {indexed.map(({ text, index, paragraphKey }) => (
          <ParagraphTipper
            key={`${index}-${paragraphKey}`}
            paragraphKey={paragraphKey}
            text={text}
            stats={byParagraph.get(paragraphKey)}
            amountWei={tipAmount}
            onTip={(pk, amt) => tipper.tip(pk, amt)}
            busy={tipBusy}
            disabled={!isConnected || loading}
          />
        ))}
      </div>
    </div>
  );
}

function TipperStatus({
  state,
}: {
  state: ReturnType<typeof useTipParagraph>["state"];
}) {
  switch (state.kind) {
    case "approving":
      return (
        <span className="text-xs text-muted-foreground">
          Approving cUSD allowance…
        </span>
      );
    case "tipping":
      return (
        <span className="text-xs text-muted-foreground">Sending tip…</span>
      );
    case "error":
      return (
        <span className="text-xs text-destructive">Error: {state.message}</span>
      );
    case "success":
    case "idle":
    default:
      return null;
  }
}
