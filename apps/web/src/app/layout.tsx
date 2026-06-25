import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';

import { Footer } from '@/components/footer';
import { FrameReady } from '@/components/frame/FrameReady';
import { Navbar } from '@/components/navbar';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/toaster';
import { WalletProvider } from "@/components/wallet-provider"

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500'],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tipitip-sable.vercel.app';

const WEBSITE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'TipiTip',
  url: SITE_URL,
  description: 'Per-paragraph cUSD micro-tipping on Celo.',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  title: {
    default: 'TipiTip — tip writers per paragraph on Celo',
    template: '%s · TipiTip',
  },
  description:
    'Publish a markdown article in a minute and let readers tip you in cUSD per paragraph. No subscriptions, no middlemen, no minimum payouts.',
  applicationName: 'TipiTip',
  keywords: [
    'Celo',
    'cUSD',
    'MiniPay',
    'tipping',
    'micro-payments',
    'writers',
    'markdown',
  ],
  authors: [{ name: 'TipiTip' }],
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' }],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    siteName: 'TipiTip',
    url: SITE_URL,
    title: 'TipiTip — tip writers per paragraph on Celo',
    description:
      'Tap any paragraph to send the author an instant cUSD micro-tip. Built on Celo, MiniPay-ready.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'TipiTip — per-paragraph cUSD tipping on Celo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TipiTip — tip writers per paragraph on Celo',
    description:
      'Tap any paragraph to send the author an instant cUSD micro-tip.',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
};

/**
 * Viewport metadata. Split from `metadata` because Next.js 14 moved
 * theme-color / color-scheme into a dedicated `Viewport` type.
 *
 * Dark is the default theme, so the mobile browser chrome (address bar,
 * Android task switcher) is tinted navy for everyone. `colorScheme:
 * 'dark light'` keeps both modes supported (light stays available via
 * the toggle) so built-in widgets and scrollbars react correctly.
 */
export const viewport: Viewport = {
  // Dark is the default site appearance, so the mobile browser chrome
  // is tinted navy for everyone (light stays available via the toggle).
  themeColor: '#0b1220',
  colorScheme: 'dark light',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
        />
        {/* Warpcast Mini App splash dismiss. Mounted as the first
            child so its useEffect fires before any wagmi /
            RainbowKit work — if the wallet subtree ever crashes
            inside an iframe sandbox, this still resolves first. */}
        <FrameReady />
        {/* Navbar is included on all pages */}
        <NextIntlClientProvider>
        <ThemeProvider>
          <div className="relative flex min-h-screen flex-col">
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
            >
              Skip to content
            </a>
            <WalletProvider>
              <Navbar />
              {/* Machine-print registration frame — fixed viewport corners,
                  shown on every page for a consistent editorial signature. */}
              <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-4 z-[60] hidden md:block"
              >
                <span className="absolute left-0 top-0 h-4 w-4 border-l border-t border-primary/40" />
                <span className="absolute right-0 top-0 h-4 w-4 border-r border-t border-primary/40" />
                <span className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-primary/40" />
                <span className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-primary/40" />
              </div>
              {/* Per-page components render their own <main> landmark; this
                  wrapper is just the skip-link target + flex spacer. */}
              <div id="main" tabIndex={-1} className="flex-1 outline-none">
                {children}
              </div>
              <Footer />
              <Toaster />
            </WalletProvider>
          </div>
        </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
// @edge: handle nullish input gracefully
// @cleanup: remove legacy fallback path
// @i18n: extract pluralization logic
