"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ConnectButton } from "@/components/connect-button"
import { ThemeToggle } from "@/components/theme-toggle"

interface NavLink {
  name: string
  href: string
  external?: boolean
}

const navLinks: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "Write", href: "/write" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "For writers", href: "/for-writers" },
]

export function Navbar() {
  const pathname = usePathname()
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              {/* h-11 w-11 enforces 44 px touch target (WCAG 2.5.5 AAA)
                  — shadcn's default size="icon" is h-9 w-9 (36 px). */}
              <Button variant="ghost" size="icon" className="h-11 w-11 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              {/* Drawer header — full painted mark stands in for the
                  text wordmark we used to render here. Heart-only is
                  reserved for favicon / browser tab; in any "brand
                  zone" with room (drawer, sticky header) we show the
                  full mark including the painted "tipitip" lettering. */}
              <div className="flex items-center mb-8">
                <Image
                  src="/tipitip-logo.svg"
                  alt="TipiTip"
                  width={48}
                  height={48}
                  className="h-12 w-12"
                  priority
                />
              </div>
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className={`flex items-center gap-2 text-base font-medium transition-colors hover:text-primary ${
                      pathname === link.href ? "text-foreground" : "text-foreground/70"
                    }`}
                  >
                    {link.name}
                    {link.external && <ExternalLink className="h-4 w-4" />}
                  </Link>
                ))}
                <div className="mt-6 flex items-center gap-2 border-t pt-6">
                  <ThemeToggle />
                  <ConnectButton />
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo — full painted mark (heart + finger + tipitip
              wordmark). The square 640×640 SVG is rendered at h-10
              on mobile / h-12 on desktop so the brushy wordmark in
              the lower half stays legible inside the 64 px-tall
              sticky header. `alt=""` because the Link already owns
              the accessible name via aria-label; avoids a duplicate
              screen-reader announcement. */}
          <Link
            href="/"
            className="flex items-center hover:opacity-80 transition-opacity"
            aria-label="TipiTip — home"
          >
            <Image
              src="/tipitip-logo.svg"
              alt=""
              width={48}
              height={48}
              className="h-10 w-10 sm:h-12 sm:w-12"
              priority
            />
          </Link>
        </div>
        
        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href
                  ? "text-foreground"
                  : "text-foreground/70"
              }`}
            >
              {link.name}
              {link.external && <ExternalLink className="h-4 w-4" />}
            </Link>
          ))}
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ConnectButton />
          </div>
        </nav>
      </div>
    </header>
  )
}
