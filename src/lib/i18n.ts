export const locales = ["en", "fa", "ar", "fr", "tr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const rtlLocales: ReadonlySet<Locale> = new Set(["fa", "ar"]);

export function isRtl(locale: Locale): boolean {
  return rtlLocales.has(locale);
}

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

/** Human-readable names for the language switcher */
export const localeNames: Record<Locale, string> = {
  en: "English",
  fa: "فارسی",
  ar: "العربية",
  fr: "Français",
  tr: "Türkçe",
};
