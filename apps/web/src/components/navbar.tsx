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
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Write", href: "/write" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "For writers", href: "/for-writers" },
  { name: "Showcase", href: "/showcase" },
  { name: "Embed", href: "/embed" },
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
              {/* Drawer header - full brand lockup (Type Sort mark +
                  mono wordmark). Sized by font-size, tinted via the
                  foreground token so the block is plum ink on light
                  and cream on dark; the rose nick + coins carry the
                  accent on both themes. */}
              <div className="mb-8 flex items-center text-foreground text-[30px]">
                <TipiTipLogo />
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

          {/* Logo - the brand lockup, sized by font-size and tinted
              via the foreground token (plum ink on light, cream on
              dark). The lockup exposes its own role="img" name, which
              becomes this home link's accessible name. */}
          <Link
            href="/"
            className="flex items-center text-foreground transition-opacity hover:opacity-80 text-[26px] sm:text-[30px]"
          >
            <TipiTipLogo />
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
