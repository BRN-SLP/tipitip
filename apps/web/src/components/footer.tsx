import Link from "next/link";

import { NetworkBadge } from "@/components/network-badge";
import { TipiTipLogo } from "@/components/tipitip-logo";
import { MANIFESTO } from "@/lib/manifesto";

// Sourced from next.config.js `env` (package version + Vercel commit SHA)
// so it tracks releases and deploys instead of going stale.
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";
const COMMIT_SHA = process.env.NEXT_PUBLIC_COMMIT_SHA || "";
const REPO_URL = "https://github.com/BRN-SLP/tipitip";
const NPM_URL = "https://www.npmjs.com/package/@tipitip/embed";

type FootLink = readonly [label: string, href: string];

const COLUMNS: { title: string; links: readonly FootLink[] }[] = [
  {
    title: "Product",
    links: [
      ["Write", "/write"],
      ["Leaderboard", "/leaderboard"],
      ["Showcase", "/showcase"],
      ["Embed", "/embed"],
    ],
  },
  {
    title: "Learn",
    links: [
      ["For writers", "/for-writers"],
      ["The manifesto", `/a/${MANIFESTO.articleId}`],
    ],
  },
  {
    title: "Build",
    links: [
      ["npm @tipitip/embed", NPM_URL],
      ["GitHub", REPO_URL],
    ],
  },
];

function FootColumn({
  title,
  links,
}: {
  title: string;
  links: readonly FootLink[];
}) {
  return (
    <div>
      <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground">
        {title}
      </h3>
      <ul className="space-y-2 font-mono text-[13px]">
        {links.map(([label, href]) => {
          const external = href.startsWith("http");
          return (
            <li key={href}>
              <Link
                href={href}
                className="link-underline text-muted-foreground transition-colors hover:text-foreground"
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-background/60 backdrop-blur-md">
      <div className="container mx-auto max-w-screen-2xl px-4 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          {/* brand */}
          <div className="max-w-xs">
            <div className="text-foreground">
              <TipiTipLogo className="text-[22px]" />
            </div>
            <p className="mt-4 font-mono text-xs leading-relaxed text-muted-foreground">
              Tip writers per paragraph.
              <br />
              cUSD micro-tips · MiniPay-ready · 2.5% protocol fee
              <br />
              Built on Celo.
            </p>
          </div>

          {/* link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((c) => (
              <FootColumn key={c.title} title={c.title} links={c.links} />
            ))}
          </div>
        </div>

        {/* meta row */}
        <div className="mt-10 flex flex-col gap-3 border-t border-dashed pt-6 font-mono text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            v{VERSION}
            {COMMIT_SHA ? ` · ${COMMIT_SHA}` : ""} · MIT
          </span>
          <NetworkBadge />
        </div>
      </div>
    </footer>
  );
}
