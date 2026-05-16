import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';

import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { WalletProvider } from "@/components/wallet-provider"

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700', '800'],
  axes: ['SOFT', 'opsz'],
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
  themeColor: '#0b1220',
  openGraph: {
    type: 'website',
    siteName: 'TipiTip',
    url: SITE_URL,
    title: 'TipiTip — tip writers per paragraph on Celo',
    description:
      'Reader taps ❤️ under any paragraph → instant cUSD tip to the author. Built on Celo, MiniPay-ready.',
    images: [
      {
        url: '/og.svg',
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
    images: ['/og.svg'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans">
        {/* Navbar is included on all pages */}
        <div className="relative flex min-h-screen flex-col">
          <WalletProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </WalletProvider>
        </div>
      </body>
    </html>
  );
}
