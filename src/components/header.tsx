import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { IIRanLogo } from "@/components/iiran-logo";

const navLinks = [
  { href: "#stories", label: "Stories" },
  { href: "#dashboard", label: "Crisis Data" },
  { href: "#news", label: "News" },
  { href: "#help", label: "How to Help" },
  { href: "#impact", label: "Impact" },
  { href: "/about", label: "About" },
  { href: "/transparency", label: "Transparency" },
];

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight shrink-0">
            <IIRanLogo variant={1} className="w-6 h-6 text-primary" />
            <span>IIRan</span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-5" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/donate"
              className="hidden sm:inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]"
            >
              Donate
            </Link>

            {/* Mobile menu */}
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
