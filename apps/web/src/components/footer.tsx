import Link from "next/link";
import { useTranslations } from "next-intl";

import { FooterSupportLink } from "@/components/footer-support-link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { NetworkBadge } from "@/components/network-badge";
import { TipiTipLogo } from "@/components/tipitip-logo";
import { MANIFESTO } from "@/lib/manifesto";

// Sourced from next.config.js `env` (package version + Vercel commit SHA)
// so it tracks releases and deploys instead of going stale.
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";
const COMMIT_SHA = process.env.NEXT_PUBLIC_COMMIT_SHA || "";
const REPO_URL = "https://github.com/BRN-SLP/tipitip";
const NPM_URL = "https://www.npmjs.com/package/@tipitip/embed";

type FootLink = readonly [labelKey: string, href: string];

const COLUMNS: { titleKey: string; links: readonly FootLink[] }[] = [
  {
    titleKey: "colProduct",
    links: [
      ["write", "/write"],
      ["leaderboard", "/leaderboard"],
      ["showcase", "/showcase"],
      ["embed", "/embed"],
    ],
  },
  {
    titleKey: "colLearn",
    links: [
      ["forWriters", "/for-writers"],
      ["manifesto", `/a/${MANIFESTO.articleId}`],
    ],
  },
  {
    titleKey: "colBuild",
    links: [
      ["npm", NPM_URL],
      ["github", REPO_URL],
    ],
  },
];

function FootColumn({
  titleKey,
  links,
}: {
  titleKey: string;
  links: readonly FootLink[];
}) {
  const t = useTranslations("footer");
  return (
    <div>
      <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground">
        {t(titleKey)}
      </h3>
      <ul className="space-y-2 font-mono text-[13px]">
        {links.map(([labelKey, href]) => {
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
                {t(`links.${labelKey}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Footer() {
  const t = useTranslations("footer");
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
              {t("tagline1")}
              <br />
              {t("tagline2")}
              <br />
              {t("tagline3")}
            </p>
          </div>

          {/* link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((c) => (
              <FootColumn
                key={c.titleKey}
                titleKey={c.titleKey}
                links={c.links}
              />
            ))}
          </div>
        </div>

        {/* meta row */}
        <div className="mt-10 flex flex-col gap-3 border-t border-dashed pt-6 font-mono text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            v{VERSION}
            {COMMIT_SHA ? ` · ${COMMIT_SHA}` : ""} · MIT
          </span>
          <FooterSupportLink />
          <NetworkBadge />
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  );
}
// @a11y: navigation role
