import type { Metadata } from "next";
import { getDictionary } from "../dictionaries";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import DonateClient from "./donate-client";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return {
    title: `${dict.donatePage.heading} | IIRan`,
    description: dict.donatePage.subheading,
  };
}

export default async function DonatePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  return <DonateClient dict={dict.donatePage} locale={locale} navDict={{ transparency: dict.nav.transparency, about: dict.nav.about, contact: dict.common.contactUs }} />;
}
