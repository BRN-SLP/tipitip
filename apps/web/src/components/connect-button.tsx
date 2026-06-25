"use client";

import { ConnectButton as RainbowKitConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import { AlertTriangle, Heart, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/**
 * TipiTip-branded connect button.
 *
 * Uses RainbowKit's `ConnectButton.Custom` so we control every visible
 * pixel while keeping their modal/account flow. Three states:
 *
 *   1. Disconnected - rose-filled "Connect" with a heart icon. Click
 *      opens the RainbowKit modal.
 *   2. Connected — split pill: left half is a chain badge (clickable,
 *      opens chain switcher), right half is the truncated address
 *      with a wallet icon (clickable, opens account modal).
 *   3. Wrong network — single amber pill with a warning icon.
 *
 * Inside MiniPay's injected Opera wallet the entire button hides —
 * the wallet handles its own UI surface.
 */
export function ConnectButton() {
  const [isMinipay, setIsMinipay] = useState(false);
  const t = useTranslations("connectButton");

  useEffect(() => {
    const eth = (window as { ethereum?: { isMiniPay?: boolean } }).ethereum;
    if (eth?.isMiniPay) setIsMinipay(true);
  }, []);

  if (isMinipay) return null;

  return (
    <RainbowKitConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            aria-hidden={!ready ? "true" : undefined}
            style={!ready ? { opacity: 0, pointerEvents: "none" } : undefined}
          >
            {(() => {
              if (!connected) {
                return (
                  <motion.button
                    type="button"
                    onClick={openConnectModal}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    // min-h-11 enforces 44 px touch target (WCAG 2.5.5 AAA)
                    // on mobile, where the primary connect-CTA must
                    // be impossible to miss with a thumb.
                    className="group inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition hover:shadow-md hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <Heart
                      aria-hidden="true"
                      className="h-3.5 w-3.5 fill-current transition-transform group-hover:scale-110"
                    />
                    <span className="font-medium">{t("connect")}</span>
                  </motion.button>
                );
              }

              if (chain.unsupported) {
                return (
                  <motion.button
                    type="button"
                    onClick={openChainModal}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-300"
                  >
                    <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
                    <span>{t("wrongNetwork")}</span>
                  </motion.button>
                );
              }

              return (
                <div className="inline-flex min-h-11 items-stretch overflow-hidden rounded-md border border-primary/20 bg-primary/5 text-sm">
                  <motion.button
                    type="button"
                    onClick={openChainModal}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center gap-2 border-r border-primary/15 px-3 py-1.5 text-foreground/80 transition hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={t("switchNetwork", { network: chain.name ?? "" })}
                  >
                    {chain.hasIcon && chain.iconUrl ? (
                      <span
                        aria-hidden="true"
                        className="h-3.5 w-3.5 overflow-hidden rounded-full"
                        style={{ background: chain.iconBackground }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt=""
                          src={chain.iconUrl}
                          className="h-full w-full object-cover"
                        />
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 rounded-full bg-emerald-500"
                      />
                    )}
                    <span className="hidden font-medium sm:inline">
                      {chain.name}
                    </span>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={openAccountModal}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-foreground transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={t("account")}
                  >
                    <Wallet aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium">
                      {account.displayName}
                    </span>
                    {account.displayBalance && (
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        · {account.displayBalance}
                      </span>
                    )}
                  </motion.button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </RainbowKitConnectButton.Custom>
  );
}
// @dev: connect-button component
// @a11y: ensure keyboard navigation works
// @todo: profile under high load
// @perf: add caching layer here
// @edge: handle nullish input gracefully
// @guard: validate before processing
