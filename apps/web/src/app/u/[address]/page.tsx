import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { formatUnits, getAddress, isAddress } from "viem";

import { PageHeader } from "@/components/page-header";
import { RevealOnScroll } from "@/components/hero/RevealOnScroll";
import { displayName as ensDisplay, resolveEnsName } from "@/lib/ens";
import { getProfile } from "@/lib/profile";

interface PageProps {
  params: Promise<{ address: string }>;
}

interface EarningsTotals {
  earned: string;
  tips: number;
  supporters: number;
  articles: number;
}

interface EarningsArticle {
  articleId: string;
  slug: string;
  total: string;
}

function cusd(wei: string): string {
  return Number(formatUnits(BigInt(wei), 18)).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { address } = await params;
  if (!isAddress(address)) return { title: "Writer not found" };
  const profile = await getProfile(address);
  if (!profile?.isPublic) {
    return { title: "Writer profile", robots: { index: false } };
  }
  const name =
    profile.displayName || `${address.slice(0, 6)}…${address.slice(-4)}`;
  return {
    title: `${name} on TipiTip`,
    description: profile.bio || `Tip ${name}'s writing, by the paragraph.`,
  };
}

/** Best-effort fetch of the writer's on-chain totals + articles for the public
 *  page. Returns nulls on any failure so the profile still renders. */
async function loadEarnings(
  address: string,
): Promise<{ totals: EarningsTotals | null; articles: EarningsArticle[] }> {
  try {
    // Use the canonical site origin, never the request Host header — trusting
    // the inbound Host here would be an SSRF vector (server fetches whatever
    // host the caller claims) on non-Vercel deployments.
    const base = (
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://tipitip-sable.vercel.app"
    ).replace(/\/+$/, "");
    const res = await fetch(`${base}/api/writer/${address}/earnings`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { totals: null, articles: [] };
    const json = (await res.json()) as {
      totals?: EarningsTotals;
      articles?: EarningsArticle[];
    };
    return { totals: json.totals ?? null, articles: json.articles ?? [] };
  } catch {
    return { totals: null, articles: [] };
  }
}

export default async function WriterProfilePage({ params }: PageProps) {
  const { address } = await params;
  if (!isAddress(address)) notFound();
  const addr = getAddress(address);

  const [profile, ens] = await Promise.all([
    getProfile(addr),
    resolveEnsName(addr),
  ]);
  const name = profile?.displayName || ensDisplay(addr, ens);
  const truncated = `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  // Honor the public toggle: private (or absent) profiles render a calm,
  // contentless state and are not surfaced.
  if (!profile?.isPublic) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
          Writer
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold">{truncated}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          This writer has not published a public profile yet.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          Explore TipiTip →
        </Link>
      </main>
    );
  }

  const { totals, articles } = await loadEarnings(addr);
  const stats: Array<{ label: string; value: string }> = [
    { label: "Earned (gross)", value: `${cusd(totals?.earned ?? "0")} cUSD` },
    { label: "Tips", value: (totals?.tips ?? 0).toLocaleString() },
    { label: "Supporters", value: (totals?.supporters ?? 0).toLocaleString() },
    { label: "Articles", value: (totals?.articles ?? 0).toLocaleString() },
  ];

  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      <RevealOnScroll>
        <PageHeader
          eyebrow="Writer"
          title={name}
          subtitle={<span className="font-mono text-xs">{truncated}</span>}
        />
        {profile.bio && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {profile.bio}
          </p>
        )}
        {profile.links && profile.links.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.links.map((l) => (
              <a
                key={`${l.label}-${l.url}`}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs transition-colors hover:border-primary/40 hover:text-primary"
              >
                {l.label}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ))}
          </div>
        )}
      </RevealOnScroll>

      <RevealOnScroll delay={0.08}>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border bg-card/40 p-3">
              <div className="text-lg font-semibold tracking-tight">
                {s.value}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
        {(totals?.tips ?? 0) > 0 && (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            Earned is gross tips, before the 2.5% protocol fee.
          </p>
        )}
      </RevealOnScroll>

      {articles.length > 0 && (
        <RevealOnScroll delay={0.12}>
          <section className="mt-10">
            <h2 className="font-serif text-xl font-semibold">Articles</h2>
            <ul className="mt-3 divide-y">
              {articles.map((a) => (
                <li
                  key={a.articleId}
                  className="flex items-baseline justify-between gap-4 py-3"
                >
                  <Link
                    href={`/a/${a.articleId}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {a.slug || "(untitled)"}
                  </Link>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {cusd(a.total)} cUSD
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </RevealOnScroll>
      )}
    </main>
  );
}
// @note: coordinated with PR #87
// @note: see issue tracker for context
// @edge: test with maximum input length
// @perf: use index for O(1) lookup
// @todo: add loading skeleton UI
// @todo: profile under high load
// @edge: zero-value special case
// @config: read from next.config env section
// @a11y: focus management on route change
