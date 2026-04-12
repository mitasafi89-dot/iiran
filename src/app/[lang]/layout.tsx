import type { Metadata, Viewport } from "next";
import { Inter, Vazirmatn } from "next/font/google";
import { headers } from "next/headers";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { locales, isRtl, isValidLocale, type Locale } from "@/lib/i18n";
import { getDictionary } from "./dictionaries";
import { notFound } from "next/navigation";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
  display: "swap",
  preload: false,
});

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f9" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? lang : "en";
  const dict = await getDictionary(locale);

  const ogLocaleMap: Record<string, string> = {
    en: "en_US",
    fa: "fa_IR",
    ar: "ar_SA",
    fr: "fr_FR",
    tr: "tr_TR",
  };

  return {
    title: {
      default: `IIRan | ${dict.hero.title} ${dict.hero.titleHighlight}`,
      template: "%s | IIRan",
    },
    description: dict.hero.description,
    keywords: [
      "Iran war",
      "Iran crisis",
      "help Iran",
      "how to help Iran",
      "donate to Iran",
      "Iran humanitarian aid",
      "support Iranian people",
      "Iran protests",
      "Iran human rights",
      "stand with Iran",
      "Iran relief fund",
      "Iran charity",
      "Iran civilian casualties",
      "Iran women rights",
      "Woman Life Freedom Iran",
      "Iran sanctions impact",
      "Iran political prisoners",
      "Iran rebuilding",
      "Iran peace",
      "Iran news today",
    ],
    metadataBase: new URL("https://iiran.org"),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}`])
      ),
    },
    openGraph: {
      title: dict.hero.title + " " + dict.hero.titleHighlight,
      description: dict.hero.description,
      type: "website",
      locale: ogLocaleMap[locale] || "en_US",
      siteName: "IIRan",
      url: `https://iiran.org/${locale}`,
    },
    twitter: {
      card: "summary_large_image",
      title: dict.hero.title + " " + dict.hero.titleHighlight,
      description: dict.hero.description,
    },
    robots: { index: true, follow: true },
    verification: {
      google: "google-site-verification-placeholder",
    },
    other: {
      "msvalidate.01": "bing-verification-placeholder",
    },
  };
}

// ── JSON-LD Structured Data ─────────────────────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "NGO",
      "@id": "https://iiran.org/#organization",
      name: "IIRan",
      alternateName: "IIRan, Inc.",
      url: "https://iiran.org",
      description:
        "Independent nonprofit providing humanitarian aid to Iran. Help Iran through verified food, medical, and shelter relief for civilians affected by war, sanctions, and crisis.",
      foundingDate: "2023",
      nonprofitStatus: "501(c)(3)",
      areaServed: {
        "@type": "Country",
        name: "Iran",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          email: "info@iiran.org",
          contactType: "donor support",
          availableLanguage: ["English", "Farsi", "Arabic", "French", "Turkish"],
        },
        {
          "@type": "ContactPoint",
          email: "press@iiran.org",
          contactType: "press",
        },
      ],
      sameAs: [
        "https://t.me/iiran_org",
        "https://www.instagram.com/iiran_org",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://iiran.org/#website",
      url: "https://iiran.org",
      name: "IIRan",
      publisher: { "@id": "https://iiran.org/#organization" },
      inLanguage: ["en", "fa", "ar", "fr", "tr"],
    },
    {
      "@type": "DonateAction",
      "@id": "https://iiran.org/#donate",
      name: "Donate to IIRan",
      description:
        "Support humanitarian relief in Iran. Donate to deliver food, medical care, and shelter to Iranian civilians. 91% of every dollar goes directly to programs.",
      recipient: { "@id": "https://iiran.org/#organization" },
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://iiran.org/#help",
      },
    },
  ],
};

export default async function LangLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;

  if (!isValidLocale(lang)) {
    notFound();
  }

  const locale = lang as Locale;
  const rtl = isRtl(locale);
  const dict = await getDictionary(locale);
  const nonce = (await headers()).get("x-nonce") ?? "";
  const fontClass = rtl
    ? `${inter.variable} ${vazirmatn.variable}`
    : inter.variable;

  return (
    <html
      lang={locale}
      dir={rtl ? "rtl" : "ltr"}
      className={`${fontClass} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://cdn.presstv.ir" />
        <link rel="dns-prefetch" href="https://cdn-media.tass.ru" />
        <link rel="dns-prefetch" href="https://media.mehrnews.com" />
        <link
          rel="preload"
          as="image"
          href="https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1920&q=75&auto=format"
        />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`min-h-full flex flex-col${rtl ? " font-vazirmatn" : ""}`}>
        <ThemeProvider>
          <a href="#main" className="skip-to-main bg-primary text-primary-foreground">
            {dict.common.skipToMain}
          </a>
          <Header dict={dict} lang={locale} />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Footer dict={dict} lang={locale} />
        </ThemeProvider>
      </body>
    </html>
  );
}
