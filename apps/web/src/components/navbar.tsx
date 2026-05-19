"use client"

import Link from "next/link"
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
import { TipiTipLogo } from "@/components/tipitip-logo"

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
              {/* Drawer header — full painted mark. Inline SVG (not a
                  next/image of the static .svg) so the mark inherits
                  the surrounding text color via `currentColor`: dark
                  plum on light theme, warm cream on dark. The static
                  /tipitip-logo.svg stays for og:image / share. */}
              <div className="flex items-center mb-8 text-foreground">
                <TipiTipLogo className="h-12 w-auto" aria-label="TipiTip" />
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

          {/* Logo — full painted mark, inline so it inherits theme
              foreground via `currentColor`. ViewBox is cropped (see
              tipitip-logo.tsx) so the same h-12 wrapper now shows
              the artwork visibly bigger than the prior next/image
              render — the original .svg had ~33% empty padding.
              The <Link> owns the accessible name via aria-label;
              the SVG itself is aria-hidden to avoid duplicate SR
              announcement. */}
          <Link
            href="/"
            className="flex items-center text-foreground hover:opacity-80 transition-opacity"
            aria-label="TipiTip — home"
          >
            <TipiTipLogo className="h-10 w-auto sm:h-12" />
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
