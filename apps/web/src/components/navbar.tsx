"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ConnectButton } from "@/components/connect-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { TipiTipLogo } from "@/components/tipitip-logo"

const navLinks = [
  { key: "read", href: "/read" },
  { key: "leaderboard", href: "/leaderboard" },
  { key: "write", href: "/write" },
  { key: "dashboard", href: "/dashboard" },
  { key: "forWriters", href: "/for-writers" },
  { key: "showcase", href: "/showcase" },
] as const

export function Navbar() {
  const pathname = usePathname()
  const t = useTranslations("nav")

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      {/* max-w-6xl matches the landing content so the logo aligns with
          the hero and the controls align with the demo card edge. */}
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Left: mobile menu + logo */}
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              {/* h-11 w-11 enforces a 44px touch target (WCAG 2.5.5 AAA);
                  shadcn's default size="icon" is 36px. */}
              <Button variant="ghost" size="icon" className="h-11 w-11 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t("toggleMenu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetTitle className="sr-only">{t("menuTitle")}</SheetTitle>
              <div className="mb-8 flex items-center text-foreground text-[30px]">
                <TipiTipLogo />
              </div>
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className={`text-base font-medium transition-colors hover:text-foreground ${
                      pathname === link.href ? "text-foreground" : "text-foreground/70"
                    }`}
                  >
                    {t(`links.${link.key}`)}
                  </Link>
                ))}
                <div className="mt-6 flex items-center gap-2 border-t pt-6">
                  <ThemeToggle />
                  <ConnectButton />
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            aria-label="TipiTip home"
            className="flex items-center text-foreground transition-opacity hover:opacity-80 text-[26px] sm:text-[30px]"
          >
            <TipiTipLogo />
          </Link>
        </div>

        {/* Center: desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`text-sm transition-colors hover:text-foreground ${
                pathname === link.href ? "text-foreground" : "text-foreground/70"
              }`}
            >
              {t(`links.${link.key}`)}
            </Link>
          ))}
        </nav>

        {/* Right: controls */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
// @a11y: navigation role
