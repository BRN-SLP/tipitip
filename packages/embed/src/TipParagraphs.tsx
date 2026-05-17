import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

import { splitParagraphs } from "./markdown";

export type Hex = `0x${string}`;

export interface TipParagraphsProps {
  /** 32-byte article id as registered on-chain (hex with 0x prefix). */
  articleId: Hex;
  /**
   * Base URL of the TipiTip site that hosts the article + its API.
   * Defaults to the canonical production deployment. Override for
   * testing against a Vercel preview, localhost, or staging env.
   */
  baseUrl?: string;
  /**
   * Chain to read tip events from. Defaults to Celo Mainnet (42220).
   * Pass 11142220 for Celo Sepolia while developing.
   */
  chainId?: 42220 | 11142220;
  /**
   * How often to refresh tip counts, in milliseconds. Default 30000.
   * Pass 0 to disable polling (counters update only on initial mount).
   */
  pollIntervalMs?: number;
  /** Optional element shown while the article body is loading. */
  loadingFallback?: React.ReactNode;
  /** Optional element shown when loading fails. */
  errorFallback?: React.ReactNode;
  /** Optional className applied to the outer <article> wrapper. */
  className?: string;
  /**
   * Optional CSS-variable overrides applied to the wrapper. Lets the
   * host theme the embed without overriding every selector.
   */
  style?: React.CSSProperties;
}

interface TipStats {
  count: number;
  total: string; // wei as decimal string
}

interface TipStatsResponse {
  articleId: string;
  chainId: number;
  paragraphs: Record<string, TipStats>;
  latestBlock: string;
}

const DEFAULT_BASE_URL = "https://tipitip-sable.vercel.app";
const DEFAULT_POLL_MS = 30_000;

/**
 * Drop-in embedded TipiTip reader.
 *
 * Fetches the published article body, splits it with the same algorithm
 * the on-chain tipping uses, and renders each paragraph with a live tip
 * counter. The heart button next to every paragraph deep-links to the
 * canonical TipiTip article page, where the actual cUSD transaction
 * happens inside the wallet-connected host application — keeping this
 * embed dependency-free (no viem, no wagmi, no keccak256 in your tree).
 *
 * v0.1 is intentionally read-and-redirect. A v0.2 with inline tip
 * signing (wagmi peer dep, MiniPay-aware) will follow.
 */
export function TipParagraphs({
  articleId,
  baseUrl = DEFAULT_BASE_URL,
  chainId = 42220,
  pollIntervalMs = DEFAULT_POLL_MS,
  loadingFallback,
  errorFallback,
  className,
  style,
}: TipParagraphsProps) {
  const cleanBase = useMemo(() => baseUrl.replace(/\/+$/, ""), [baseUrl]);
  const [body, setBody] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, TipStats>>({});
  const [error, setError] = useState<string | null>(null);

  // 1. Load the article body once. The content is content-addressed
  //    on-chain, so a refetch is only needed if the articleId changes.
  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch(`${cleanBase}/api/articles/${articleId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setBody(text);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "load failed");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [articleId, cleanBase]);

  // 2. Poll tip-stats. Initial fetch + optional refresh loop.
  //    Network blips don't surface — counters keep their last good state.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function pull(): Promise<void> {
      try {
        const res = await fetch(
          `${cleanBase}/api/tip-stats/${articleId}?chainId=${chainId}`,
        );
        if (!res.ok) return;
        const json = (await res.json()) as TipStatsResponse;
        if (!cancelled) setStats(json.paragraphs ?? {});
      } catch {
        // Network blip — keep last good stats; do not surface to user.
      }
    }

    pull();
    if (pollIntervalMs > 0) {
      timer = setInterval(pull, pollIntervalMs);
    }
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [articleId, chainId, cleanBase, pollIntervalMs]);

  const paragraphs = useMemo(
    () => (body ? splitParagraphs(body) : []),
    [body],
  );

  if (error) {
    return (
      <div className={`tipitip-embed tipitip-embed--error ${className ?? ""}`}>
        {errorFallback ?? (
          <p style={{ color: "#b91c1c", fontSize: 14 }}>
            Failed to load article: {error}
          </p>
        )}
      </div>
    );
  }
  if (body === null) {
    return (
      <div className={`tipitip-embed tipitip-embed--loading ${className ?? ""}`}>
        {loadingFallback ?? (
          <p style={{ opacity: 0.6, fontSize: 14 }}>Loading article…</p>
        )}
      </div>
    );
  }

  return (
    <article
      className={`tipitip-embed ${className ?? ""}`}
      style={{
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        lineHeight: 1.65,
        ...style,
      }}
    >
      {paragraphs.map((text, index) => (
        <ParagraphBlock
          key={index}
          baseUrl={cleanBase}
          articleId={articleId}
          index={index}
          text={text}
          stats={stats[String(index)]}
        />
      ))}
      <Footer baseUrl={cleanBase} articleId={articleId} />
    </article>
  );
}

interface ParagraphBlockProps {
  baseUrl: string;
  articleId: Hex;
  index: number;
  text: string;
  stats?: TipStats;
}

function ParagraphBlock({
  baseUrl,
  articleId,
  index,
  text,
  stats,
}: ParagraphBlockProps) {
  const count = stats?.count ?? 0;
  const totalCusd = stats ? formatCusd(stats.total) : "0";
  const tipHref = `${baseUrl}/a/${articleId}#p-${index}`;

  return (
    <section
      className="tipitip-embed__paragraph"
      style={{ margin: "0 0 1.25rem 0" }}
    >
      <div
        className="tipitip-embed__body"
        style={{ marginBottom: "0.5rem" }}
      >
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
      <a
        className="tipitip-embed__tip"
        href={tipHref}
        target="_blank"
        rel="noopener noreferrer"
        title="Tip this paragraph on TipiTip"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 10px",
          fontSize: 12,
          color: "#52525b",
          textDecoration: "none",
          background: "transparent",
          border: "1px solid #e4e4e7",
          borderRadius: 999,
          transition: "background 120ms ease, border-color 120ms ease",
        }}
      >
        <span aria-hidden="true" style={{ color: "#dc2626" }}>
          ♥
        </span>
        <span>
          {count} {count === 1 ? "tip" : "tips"}
          {count > 0 ? ` · ${totalCusd} cUSD` : ""}
        </span>
      </a>
    </section>
  );
}

function Footer({ baseUrl, articleId }: { baseUrl: string; articleId: Hex }) {
  return (
    <p
      style={{
        marginTop: "1.5rem",
        paddingTop: "1rem",
        borderTop: "1px solid #e4e4e7",
        fontSize: 11,
        color: "#71717a",
        textAlign: "right",
      }}
    >
      <a
        href={`${baseUrl}/a/${articleId}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "inherit", textDecoration: "underline" }}
      >
        Read full article on TipiTip →
      </a>
    </p>
  );
}

/** Format a wei string into a short cUSD value with up to 4 decimals. */
function formatCusd(weiStr: string): string {
  try {
    const wei = BigInt(weiStr);
    if (wei === 0n) return "0";
    const decimals = 18n;
    const scale = 10n ** decimals;
    const whole = wei / scale;
    const remainder = wei % scale;
    const fracStr = remainder
      .toString()
      .padStart(Number(decimals), "0")
      .slice(0, 4)
      .replace(/0+$/, "");
    return fracStr ? `${whole}.${fracStr}` : whole.toString();
  } catch {
    return "0";
  }
}
