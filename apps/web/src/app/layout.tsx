import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable}`}
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
