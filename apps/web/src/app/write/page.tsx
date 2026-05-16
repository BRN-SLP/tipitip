"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { useWaitForTransactionReceipt } from "wagmi";

import { ConnectPrompt } from "@/components/connect-prompt";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MAX_BODY_BYTES,
  MAX_SLUG_LENGTH,
  type PublishArticleResponse,
} from "@/lib/articles";
import { getTipJarAddress, tipJarAbi } from "@/lib/contracts";
import { deriveArticleId, deriveContentHash } from "@/lib/paragraph-key";
import { toSlug } from "@/lib/slug";

type PublishState =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "awaiting_signature"; articleId: `0x${string}` }
  | {
      kind: "confirming";
      articleId: `0x${string}`;
      txHash: `0x${string}`;
    }
  | { kind: "success"; articleId: `0x${string}` }
  | { kind: "error"; message: string };

export default function WriterPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);
  const [body, setBody] = useState("");
  const [state, setState] = useState<PublishState>({ kind: "idle" });

  // Auto-derive slug from title until the user edits the slug directly.
  useEffect(() => {
    if (!slugDirty) setSlug(toSlug(title));
  }, [title, slugDirty]);

  const tipJarAddress = useMemo(() => {
    try {
      return getTipJarAddress(chainId);
    } catch {
      return undefined;
    }
  }, [chainId]);

  const articleId = useMemo<`0x${string}` | undefined>(() => {
    if (!address || !slug) return undefined;
    return deriveArticleId(address, slug);
  }, [address, slug]);

  const {
    writeContractAsync,
    data: txHash,
    reset: resetWrite,
  } = useWriteContract();
  const { isLoading: receiptLoading, isSuccess: receiptSuccess } =
    useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (state.kind !== "confirming") return;
    if (receiptSuccess) {
      setState({ kind: "success", articleId: state.articleId });
      router.push(`/a/${state.articleId}`);
    }
  }, [receiptSuccess, state, router]);

  const bodyTooBig = body.length > MAX_BODY_BYTES;
  const canPublish =
    isConnected &&
    !!address &&
    !!tipJarAddress &&
    !!articleId &&
    title.trim().length > 0 &&
    slug.length > 0 &&
    slug.length <= MAX_SLUG_LENGTH &&
    body.trim().length > 0 &&
    !bodyTooBig &&
    state.kind === "idle";

  async function handlePublish() {
    if (!address || !tipJarAddress || !articleId) return;
    setState({ kind: "uploading" });

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, slug, body }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errBody.error ?? `upload failed (${res.status})`);
      }
      const json = (await res.json()) as PublishArticleResponse;
      // Defence-in-depth: server-computed contentHash must match local hash.
      const localHash = deriveContentHash(body);
      if (json.contentHash.toLowerCase() !== localHash.toLowerCase()) {
        throw new Error("content hash mismatch after upload");
      }

      setState({ kind: "awaiting_signature", articleId });

      const sentTx = await writeContractAsync({
        address: tipJarAddress,
        abi: tipJarAbi,
        functionName: "registerArticle",
        args: [articleId, localHash, slug],
      });
      setState({ kind: "confirming", articleId, txHash: sentTx });
    } catch (err: unknown) {
      resetWrite();
      const message = err instanceof Error ? err.message : "publish failed";
      setState({ kind: "error", message });
    }
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Write an article</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isConnected ? (
            <ConnectPrompt
              title="Connect to publish your article"
              subtitle="Authors sign the on-chain registration with their wallet so tips flow directly to them."
              benefits={[
                "Article body uploaded to decentralized storage",
                "Per-paragraph tipping enabled on share",
                "Sub-cent gas on Celo · MiniPay-friendly",
              ]}
            />
          ) : !tipJarAddress ? (
            <p className="text-sm text-destructive">
              No TipJar contract configured for the current network. Switch to
              Celo or Celo Sepolia.
            </p>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="On the price of bread"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="text-sm font-medium">
              Slug
            </label>
            <input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlug(toSlug(e.target.value));
                setSlugDirty(true);
              }}
              maxLength={MAX_SLUG_LENGTH}
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Used in your shareable URL. Lowercase letters, digits, hyphens
              only. Up to {MAX_SLUG_LENGTH} characters.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Body</label>
            <MarkdownEditor
              value={body}
              onChange={setBody}
              disabled={state.kind !== "idle"}
            />
            {bodyTooBig && (
              <p className="text-xs text-destructive">
                Body is too large ({body.length}/{MAX_BODY_BYTES} characters).
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <PublishStatus state={state} receiptLoading={receiptLoading} />
            <Button
              size="lg"
              onClick={handlePublish}
              disabled={!canPublish}
            >
              {state.kind === "idle" ? "Publish" : "Publishing…"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PublishStatus({
  state,
  receiptLoading,
}: {
  state: PublishState;
  receiptLoading: boolean;
}) {
  switch (state.kind) {
    case "idle":
      return null;
    case "uploading":
      return (
        <p className="text-sm text-muted-foreground">Uploading content…</p>
      );
    case "awaiting_signature":
      return (
        <p className="text-sm text-muted-foreground">
          Confirm the transaction in your wallet…
        </p>
      );
    case "confirming":
      return (
        <p className="text-sm text-muted-foreground">
          {receiptLoading ? "Waiting for on-chain confirmation…" : "Confirmed."}
        </p>
      );
    case "success":
      return <p className="text-sm text-emerald-600">Published. Redirecting…</p>;
    case "error":
      return <p className="text-sm text-destructive">Error: {state.message}</p>;
  }
}
