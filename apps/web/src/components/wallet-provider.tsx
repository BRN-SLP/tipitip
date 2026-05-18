"use client";

import { RainbowKitProvider, connectorsForWallets } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { WagmiProvider, createConfig, http, useConnect } from "wagmi";
import { celo, mainnet } from "wagmi/chains";
import { ConnectButton } from "./connect-button";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [injectedWallet],
    },
  ],
  {
    appName: "TipiTip",
    projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "",
  }
);

// Ethereum mainnet is declared here purely as a read-only chain for
// ENS reverse-resolution. RainbowKit's `account.displayName` falls
// back to a truncated address unless an L1 with the ENS registry is
// in the config — once mainnet is present, connected users with a
// primary ENS name see e.g. "vitalik.eth" instead of "0xd8dA…6045".
// `celo` stays first in the array so it remains the default chain
// for transactions; the user is never prompted to switch to L1.
//
// Celo Sepolia is intentionally NOT in this list. The Proof of Ship
// leaderboard only counts mainnet transactions, and exposing a
// testnet switcher to readers invites confusion ("why didn't my tip
// arrive?"). Sepolia contracts remain deployed for V2 upgrade
// rehearsals — they are simply not user-facing.
const wagmiConfig = createConfig({
  chains: [celo, mainnet],
  connectors,
  transports: {
    [celo.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

function WalletProviderInner({ children }: { children: React.ReactNode }) {
  const { connect, connectors } = useConnect();

  useEffect(() => {
    // Check if the app is running inside MiniPay
    if (window.ethereum && window.ethereum.isMiniPay) {
      // Find the injected connector, which is what MiniPay uses
      const injectedConnector = connectors.find((c) => c.id === "injected");
      if (injectedConnector) {
        connect({ connector: injectedConnector });
      }
    }
  }, [connect, connectors]);

  return <>{children}</>;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <WalletProviderInner>{children}</WalletProviderInner>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
