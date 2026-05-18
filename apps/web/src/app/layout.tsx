import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';

import { Footer } from '@/components/footer';
import { FrameReady } from '@/components/frame/FrameReady';
import { Navbar } from '@/components/navbar';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/toaster';
import { WalletProvider } from "@/components/wallet-provider"

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700', '800'],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tipitip-sable.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
      'Reader taps ❤️ under any paragraph → instant cUSD tip to the author. Built on Celo, MiniPay-ready.',
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
      'Reader taps ❤️ under any paragraph → instant cUSD tip to the author.',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
  // Talent App domain ownership verification (Proof of Ship S2 submission).
  // Talent App fetches the homepage and looks for this meta tag once,
  // then keeps the project linked to the domain.
  other: {
    'talentapp:project_verification':
      '48d665b012a2ac6976c59b8403473ff4a6762ebb23e60737c54f2de3f595f7d0c4b54357f3b1d19db77e3655cf3afa0bd7e8b711f6dc009baec9a645aca25aec',
  },
};

/**
 * Viewport metadata. Split from the `metadata` export because Next.js
 * 14 moved theme-color / color-scheme / viewport-width into a dedicated
 * `Viewport` type — the older nested form on `metadata` is deprecated
 * and produces a build warning.
 *
 * Why two themeColor entries:
 *   The mobile browser chrome (Safari/Chrome address bar, Android task
 *   switcher) reads this tag to tint its UI. A single static value
 *   leaves users in the "wrong" theme with a chrome that clashes with
 *   the rest of the screen — e.g. a light-mode reader gets a dark
 *   slate bar above the cream page. Two media-query entries let the
 *   browser pick the right one automatically when the system or user
 *   toggle flips the preference.
 *
 * `colorScheme: 'light dark'` tells the UA both modes are supported,
 * which enables built-in form widgets, scrollbars, and any
 * `color-scheme:` CSS query to react correctly.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf8f4' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1220' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans">
        {/* Warpcast Mini App splash dismiss. Mounted as the first
            child so its useEffect fires before any wagmi /
            RainbowKit work — if the wallet subtree ever crashes
            inside an iframe sandbox, this still resolves first. */}
        <FrameReady />
        {/* Navbar is included on all pages */}
        <ThemeProvider>
          <div className="relative flex min-h-screen flex-col">
            <WalletProvider>
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
              <Toaster />
            </WalletProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
