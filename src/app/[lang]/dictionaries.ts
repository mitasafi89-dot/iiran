import "server-only";
import type { Locale } from "@/lib/i18n";

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  fa: () => import("./dictionaries/fa.json").then((m) => m.default),
  ar: () => import("./dictionaries/ar.json").then((m) => m.default),
  fr: () => import("./dictionaries/fr.json").then((m) => m.default),
  tr: () => import("./dictionaries/tr.json").then((m) => m.default),
};

export const getDictionary = async (locale: Locale) => dictionaries[locale]();

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
