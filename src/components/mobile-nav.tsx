"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";

export function MobileNav({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const navLinks = [
    { href: `/${lang}#stories`, label: dict.nav.stories },
    { href: `/${lang}#dashboard`, label: dict.nav.crisisData },
    { href: `/${lang}#news`, label: dict.nav.news },
    { href: `/${lang}#help`, label: dict.nav.howToHelp },
    { href: `/${lang}#impact`, label: dict.nav.impact },
    { href: `/${lang}/about`, label: dict.nav.about },
    { href: `/${lang}/transparency`, label: dict.nav.transparency },
  ];

  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [open]);

  return (
    <div className="lg:hidden" ref={navRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-11 h-11 rounded-md hover:bg-accent transition-colors"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu}
      >
        {open ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Menu className="w-5 h-5" aria-hidden="true" />
        )}
      </button>
      {open && (
        <div
          id="mobile-nav-panel"
          className="fixed top-16 left-0 right-0 bg-background border-b border-border shadow-lg max-h-[calc(100dvh-4rem)] overflow-y-auto"
        >
          <nav className="flex flex-col py-2 px-4" aria-label={dict.nav.mobileNav}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-3 border-b border-border/50 last:border-0 min-h-[44px] flex items-center"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={`/${lang}/donate`}
              onClick={() => setOpen(false)}
              className="mt-3 mb-2 inline-flex items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px] sm:hidden"
            >
              {dict.nav.donate}
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
