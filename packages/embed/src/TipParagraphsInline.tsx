"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { parseUnits, type Hex } from "viem";

import { splitParagraphs } from "./markdown.js";
import { deriveParagraphKey } from "./paragraph-key.js";
import {
  createTipEngine,
  type SupportedChainId,
  type TipStatus,
} from "./tip-engine.js";

export type { Hex } from "viem";

export interface TipParagraphsInlineProps {
  /** 32-byte article id as registered on-chain (hex with 0x prefix). */
  articleId: Hex;
  /**
   * Base URL of the TipiTip site hosting the article body + stats API.
   * Defaults to the canonical production deployment.
   */
  baseUrl?: string;
  /** Celo Mainnet (42220, default) or Celo Sepolia (11142220). */
  chainId?: SupportedChainId;
  /** Override the TipJar proxy address (staging / fork). */
  tipJarAddress?: Hex;
  /** Override the cUSD token address. */
  cusdAddress?: Hex;
  /** Override the read RPC endpoint. */
  rpcUrl?: string;
  /**
   * Selectable tip amounts in whole cUSD. Default [0.001, 0.005, 0.01].
   * The first entry is the initial selection.
   */
  tipAmountsCusd?: number[];
  /** How often to refresh tip counts, ms. Default 30000. 0 disables. */
  pollIntervalMs?: number;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  className?: string;
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
const DEFAULT_AMOUNTS = [0.001, 0.005, 0.01];

/**
 * Inline (wallet-signing) TipiTip embed.
 *
 * Unlike the lite `TipParagraphs` (which deep-links back to the canonical
 * site), this variant signs the cUSD tip transaction directly from the
 * host page using the reader's injected wallet (MiniPay or any Celo
 * EVM wallet), via the self-contained viem `tip-engine`. No wagmi, no
 * RainbowKit, no host wallet context required.
 *
 * Requires `viem` as a peer dependency. If you only need read-and-redirect
 * counters, import `TipParagraphs` from the package root instead, which
 * stays dependency-free.
 */
export function TipParagraphsInline({
  articleId,
  baseUrl = DEFAULT_BASE_URL,
  chainId = 42220,
  tipJarAddress,
  cusdAddress,
  rpcUrl,
  tipAmountsCusd = DEFAULT_AMOUNTS,
  pollIntervalMs = DEFAULT_POLL_MS,
  loadingFallback,
  errorFallback,
  className,
  style,
}: TipParagraphsInlineProps) {
  const cleanBase = useMemo(() => baseUrl.replace(/\/+$/, ""), [baseUrl]);
  const [body, setBody] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, TipStats>>({});
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<Hex | null>(null);
  const [amount, setAmount] = useState<number>(
    tipAmountsCusd[0] ?? DEFAULT_AMOUNTS[0],
  );
  // Last preset chosen. Presets are sticky; a custom amount is one-shot
  // and reverts to this the instant it fires (see onAfterFire below), so a
  // manual amount can never silently repeat on the next tap.
  const [lastPreset, setLastPreset] = useState<number>(
    tipAmountsCusd[0] ?? DEFAULT_AMOUNTS[0],
  );

  const engine = useMemo(
    () => createTipEngine({ chainId, tipJarAddress, cusdAddress, rpcUrl }),
    [chainId, tipJarAddress, cusdAddress, rpcUrl],
  );

  // Load the article body once.
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

  // Poll tip-stats.
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
        // keep last good stats
      }
    }

    pull();
    if (pollIntervalMs > 0) timer = setInterval(pull, pollIntervalMs);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [articleId, chainId, cleanBase, pollIntervalMs]);

  const connect = useCallback(async () => {
    try {
      const addr = await engine.connect();
      setAddress(addr);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "connect failed");
    }
  }, [engine]);

  const paragraphs = useMemo(
    () => (body ? splitParagraphs(body) : []),
    [body],
  );

  if (error && body === null) {
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
      className={`tipitip-embed tipitip-embed--inline ${className ?? ""}`}
      style={{
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        lineHeight: 1.65,
        ...style,
      }}
    >
      <TipToolbar
        address={address}
        amount={amount}
        amounts={tipAmountsCusd}
        onConnect={connect}
        onAmount={(a, source) => {
          setAmount(a);
          if (source === "preset") setLastPreset(a);
        }}
      />
      {paragraphs.map((text, index) => (
        <InlineParagraph
          key={index}
          articleId={articleId}
          index={index}
          text={text}
          stats={stats[String(index)]}
          amountCusd={amount}
          engine={engine}
          onAfterFire={() => {
            // One-shot custom: snap back to the last preset the moment a
            // non-preset amount fires, so the next tap can't repeat it.
            if (!tipAmountsCusd.includes(amount)) setAmount(lastPreset);
          }}
          ensureConnected={async () => {
            if (address) return address;
            const addr = await engine.connect();
            setAddress(addr);
            return addr;
          }}
        />
      ))}
      <Footer baseUrl={cleanBase} articleId={articleId} />
    </article>
  );
}

/** Largest single custom tip (fat-finger guard; one-shot revert is the
 *  real safety). Mirrors the canonical reader's cap. */
const MAX_CUSTOM_CUSD = 100;

function TipToolbar({
  address,
  amount,
  amounts,
  onConnect,
  onAmount,
}: {
  address: Hex | null;
  amount: number;
  amounts: number[];
  onConnect: () => void;
  onAmount: (a: number, source: "preset" | "custom") => void;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");
  const [customError, setCustomError] = useState(false);
  const customActive = !amounts.includes(amount);

  const submitCustom = () => {
    const raw = customText.trim().replace(/^\$/, "").replace(",", ".");
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0 || n > MAX_CUSTOM_CUSD) {
      setCustomError(true);
      return;
    }
    onAmount(n, "custom");
    setCustomOpen(false);
    setCustomText("");
    setCustomError(false);
  };

  const chip = (active: boolean) => ({
    padding: "4px 10px",
    fontSize: 12,
    borderRadius: 999,
    cursor: "pointer",
    border: "1px solid",
    borderColor: active ? "#dc2626" : "#e4e4e7",
    background: active ? "#fef2f2" : "transparent",
    color: active ? "#dc2626" : "#52525b",
  });

  return (
    <div
      className="tipitip-embed__toolbar"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: "1.25rem",
        paddingBottom: "0.75rem",
        borderBottom: "1px solid #e4e4e7",
      }}
    >
      <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
        {amounts.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onAmount(a, "preset")}
            style={chip(a === amount)}
          >
            ${a}
          </button>
        ))}
        {customOpen ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#52525b" }}>$</span>
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                setCustomError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitCustom();
                if (e.key === "Escape") {
                  setCustomOpen(false);
                  setCustomText("");
                  setCustomError(false);
                }
              }}
              placeholder="0.25"
              aria-label="Custom tip amount in cUSD"
              style={{
                width: 56,
                fontSize: 12,
                padding: "4px 6px",
                borderRadius: 6,
                border: `1px solid ${customError ? "#dc2626" : "#e4e4e7"}`,
                outline: "none",
              }}
            />
            <button type="button" onClick={submitCustom} style={chip(false)}>
              ✓
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            style={chip(customActive)}
          >
            {customActive ? `$${amount}` : "Custom"}
          </button>
        )}
      </div>
      {address ? (
        <span style={{ fontSize: 12, color: "#16a34a" }}>
          ♦ {address.slice(0, 6)}…{address.slice(-4)}
        </span>
      ) : (
        <button
          type="button"
          onClick={onConnect}
          style={{
            padding: "5px 12px",
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 999,
            cursor: "pointer",
            border: "1px solid #dc2626",
            background: "#dc2626",
            color: "#fff",
          }}
        >
          Connect wallet
        </button>
      )}
    </div>
  );
}

interface InlineParagraphProps {
  articleId: Hex;
  index: number;
  text: string;
  stats?: TipStats;
  amountCusd: number;
  engine: ReturnType<typeof createTipEngine>;
  ensureConnected: () => Promise<Hex>;
  /** Called the instant a tip is initiated, so the parent can revert a
   *  one-shot custom amount back to the last preset. */
  onAfterFire?: () => void;
}

function InlineParagraph({
  articleId,
  index,
  text,
  stats,
  amountCusd,
  engine,
  ensureConnected,
  onAfterFire,
}: InlineParagraphProps) {
  const [optimistic, setOptimistic] = useState(0);
  const [status, setStatus] = useState<TipStatus>({ kind: "idle" });

  const baseCount = stats?.count ?? 0;
  const count = baseCount + optimistic;
  const totalCusd = stats ? formatCusd(stats.total) : "0";
  const busy = status.kind === "approving" || status.kind === "tipping";

  const onTip = useCallback(async () => {
    if (busy) return;
    setOptimistic((n) => n + 1);
    // Capture the amount NOW, before the parent reverts a one-shot custom.
    const amountWei = parseUnits(String(amountCusd), 18);
    onAfterFire?.();
    try {
      await ensureConnected();
      const paragraphKey = deriveParagraphKey(articleId, index, text);
      await engine.tip({
        articleId,
        paragraphKey,
        amountWei,
        onStatus: setStatus,
      });
    } catch {
      setOptimistic((n) => Math.max(0, n - 1));
    }
  }, [busy, ensureConnected, articleId, index, text, amountCusd, engine, onAfterFire]);

  const label =
    status.kind === "approving"
      ? "Approving…"
      : status.kind === "tipping"
        ? "Tipping…"
        : `${count} ${count === 1 ? "tip" : "tips"}${count > 0 ? ` · ${totalCusd} cUSD` : ""}`;

  return (
    <section
      className="tipitip-embed__paragraph"
      style={{ margin: "0 0 1.25rem 0" }}
    >
      <div className="tipitip-embed__body" style={{ marginBottom: "0.5rem" }}>
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
      <button
        type="button"
        className="tipitip-embed__tip"
        onClick={onTip}
        disabled={busy}
        title={`Tip $${amountCusd} cUSD to this paragraph`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 10px",
          fontSize: 12,
          color: status.kind === "error" ? "#b91c1c" : "#52525b",
          cursor: busy ? "wait" : "pointer",
          background: "transparent",
          border: "1px solid #e4e4e7",
          borderRadius: 999,
          opacity: busy ? 0.7 : 1,
          transition: "background 120ms ease, border-color 120ms ease",
        }}
      >
        <span aria-hidden="true" style={{ color: "#dc2626" }}>
          ♥
        </span>
        <span>{status.kind === "error" ? "Retry" : label}</span>
      </button>
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
        Powered by TipiTip →
      </a>
    </p>
  );
}

/** Format a wei string into a short cUSD value with up to 4 decimals. */
function formatCusd(weiStr: string): string {
  try {
    const wei = BigInt(weiStr);
    if (wei === 0n) return "0";
    const scale = 10n ** 18n;
    const whole = wei / scale;
    const remainder = wei % scale;
    const fracStr = remainder
      .toString()
      .padStart(18, "0")
      .slice(0, 4)
      .replace(/0+$/, "");
    return fracStr ? `${whole}.${fracStr}` : whole.toString();
  } catch {
    return "0";
  }
}
