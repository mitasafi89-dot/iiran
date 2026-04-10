"use client";

import { usePathname } from "next/navigation";
import { locales, localeNames, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname();

  function switchLocale(newLocale: Locale) {
    // Replace the first path segment (current locale) with the new one
    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPath = segments.join("/");

    // Set cookie so middleware remembers the choice
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    window.location.href = newPath;
  }

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded-md hover:bg-accent min-h-[36px]"
        aria-label={label}
        aria-haspopup="listbox"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <span className="hidden sm:inline">{localeNames[current]}</span>
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5l3 3 3-3"/></svg>
      </button>
      <div className="absolute right-0 top-full mt-1 w-36 rounded-md border border-border bg-card shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50" role="listbox">
        {locales.map((locale) => (
          <button
            key={locale}
            role="option"
            aria-selected={locale === current}
            onClick={() => switchLocale(locale)}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md ${
              locale === current ? "font-semibold text-primary" : "text-foreground"
            }`}
          >
            {localeNames[locale]}
          </button>
        ))}
      </div>
    </div>
  );
}
