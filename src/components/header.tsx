import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { IIRanLogo } from "@/components/iiran-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";

export function Header({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const navLinks = [
    { href: `/${lang}#stories`, label: dict.nav.stories },
    { href: `/${lang}#dashboard`, label: dict.nav.crisisData },
    { href: `/${lang}#news`, label: dict.nav.news },
    { href: `/${lang}#help`, label: dict.nav.howToHelp },
    { href: `/${lang}#impact`, label: dict.nav.impact },
    { href: `/${lang}/about`, label: dict.nav.about },
    { href: `/${lang}/transparency`, label: dict.nav.transparency },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2">
          <Link href={`/${lang}`} className="flex items-center gap-2 font-bold text-lg tracking-tight shrink-0">
            <IIRanLogo variant={1} className="w-6 h-6 text-primary" />
            <span>IIRan</span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-5" aria-label={dict.nav.mainNav}>
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
            <LanguageSwitcher current={lang} label={dict.langSwitcher.label} />
            <ThemeToggle dict={dict.theme} />
            <Link
              href={`/${lang}/donate`}
              className="hidden sm:inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]"
            >
              {dict.nav.donate}
            </Link>

            {/* Mobile menu */}
            <MobileNav dict={dict} lang={lang} />
          </div>
        </div>
      </div>
    </header>
  );
}
