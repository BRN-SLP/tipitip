"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Hex } from "viem";

import { ParagraphTipper } from "./ParagraphTipper";
import {
  TIP_AMOUNT_PRESETS,
  TipAmountSelector,
} from "./TipAmountSelector";
import { splitParagraphs } from "@/lib/articles";
import { deriveParagraphKey } from "@/lib/paragraph-key";
import { useHashHighlight } from "@/hooks/useHashHighlight";
import { useProtocolFee } from "@/hooks/useProtocolFee";
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
  const t = useTranslations("reader");
  const paragraphs = useMemo(() => splitParagraphs(body), [body]);
  const [tipAmount, setTipAmount] = useState<bigint>(TIP_AMOUNT_PRESETS[1]);
  // The last *preset* the reader picked. Presets are sticky; a custom
  // amount is one-shot and reverts here right after it fires, so a manual
  // amount can never silently carry over to the next heart tap.
  const [lastPreset, setLastPreset] = useState<bigint>(TIP_AMOUNT_PRESETS[1]);
  const hashId = useHashHighlight();

  const { byParagraph, loading } = useTippedEvents(chainId, articleId);
  const tipper = useTipParagraph(articleId);
  const { feeBps, feePct } = useProtocolFee();

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
        <TipAmountSelector
          value={tipAmount}
          onChange={(next, source) => {
            setTipAmount(next);
            if (source === "preset") setLastPreset(next);
          }}
        />
        <div className="flex items-center gap-3">
          {feeBps > 0 && (
            <span
              className="hidden text-[11px] text-muted-foreground sm:inline"
              title={t("feeTitle")}
            >
              {t("feeLabel", { feePct })}
            </span>
          )}
          <TipperStatus state={tipper.state} />
        </div>
      </div>

      <article className="space-y-3">
        {indexed.map(({ text, index, paragraphKey }) => (
          <ParagraphTipper
            key={`${index}-${paragraphKey}`}
            paragraphIndex={index}
            paragraphKey={paragraphKey}
            hashHighlighted={hashId === `p-${index}`}
            text={text}
            stats={byParagraph.get(paragraphKey)}
            amountWei={tipAmount}
            onTip={(pk, amt) => {
              const result = tipper.tip(pk, amt);
              // One-shot custom: the instant a non-preset amount fires,
              // snap the selector back to the last preset so the next tap
              // can't repeat the manual amount by accident.
              if (!TIP_AMOUNT_PRESETS.some((p) => p === amt)) {
                setTipAmount(lastPreset);
              }
              return result;
            }}
            busy={tipBusy}
            disabled={!isConnected || loading}
          />
        ))}
      </article>
    </div>
  );
}

function TipperStatus({
  state,
}: {
  state: ReturnType<typeof useTipParagraph>["state"];
}) {
  const t = useTranslations("reader");
  switch (state.kind) {
    case "approving":
      return (
        <span className="text-xs text-muted-foreground">
          {t("approving")}
        </span>
      );
    case "tipping":
      return (
        <span className="text-xs text-muted-foreground">{t("sending")}</span>
      );
    case "error":
      return (
        <span className="text-xs text-destructive">{t("error", { message: state.message })}</span>
      );
    case "success":
    case "idle":
    default:
      return null;
  }
}
