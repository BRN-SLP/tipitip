import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

const DEFAULT_BASE_URL = "https://tipitip.app";

export interface TipParagraphsProps {
  /** 32-byte article id as registered on-chain. */
  articleId: `0x${string}`;
  /** Override the host that serves /api/articles/{id}. Default: tipitip.app. */
  baseUrl?: string;
  /** Optional element rendered while the body is loading. */
  fallback?: React.ReactNode;
}

/**
 * Drop-in embedded reader for a TipiTip article.
 *
 * NOTE: alpha release. This currently renders the markdown body as a static
 * article — the per-paragraph tipping UI is not yet exposed via the package
 * (depends on viem + wagmi wiring in the host app). Track progress at
 * https://github.com/<repo>/tipitip.
 */
export function TipParagraphs({
  articleId,
  baseUrl = DEFAULT_BASE_URL,
  fallback,
}: TipParagraphsProps) {
  const [body, setBody] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${baseUrl}/api/articles/${articleId}`)
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
  }, [articleId, baseUrl]);

  if (error) {
    return (
      <div className="tipitip-embed-error" style={{ color: "#b91c1c" }}>
        Failed to load article: {error}
      </div>
    );
  }
  if (body === null) {
    return <>{fallback ?? <div className="tipitip-embed-loading">Loading…</div>}</>;
  }

  return (
    <article className="tipitip-embed">
      <ReactMarkdown>{body}</ReactMarkdown>
      <p style={{ marginTop: "1rem", fontSize: "0.75rem", opacity: 0.7 }}>
        <a
          href={`${baseUrl}/a/${articleId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read & tip on TipiTip →
        </a>
      </p>
    </article>
  );
}
