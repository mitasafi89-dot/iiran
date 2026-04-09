import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f9" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "IIRan | Help Iran - Humanitarian Aid, Relief & Rebuilding",
    template: "%s | IIRan",
  },
  description:
    "How to help Iran: donate to verified humanitarian aid for Iranian civilians affected by war and crisis. IIRan delivers food, medical care, and shelter. 501(c)(3) nonprofit. Stand with Iran.",
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
    canonical: "/",
  },
  openGraph: {
    title: "Help Iran | Donate to Humanitarian Aid & Relief for Iranian Civilians",
    description:
      "How to help Iran: verified humanitarian aid reaching 2.4M+ civilians. Donate to food, medical care, shelter, and rebuilding. 501(c)(3) nonprofit. Stand with Iran.",
    type: "website",
    locale: "en_US",
    siteName: "IIRan",
    url: "https://iiran.org",
  },
  twitter: {
    card: "summary_large_image",
    title: "Help Iran | Donate to Humanitarian Aid for Iranian Civilians",
    description:
      "How to help Iran: verified aid reaching 2.4M+ civilians. Donate to food, medical care, shelter. Stand with Iran.",
  },
  robots: { index: true, follow: true },
  verification: {
    google: "google-site-verification-placeholder",
  },
  other: {
    "msvalidate.01": "bing-verification-placeholder",
  },
};

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
      taxID: "88-4021573",
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
          availableLanguage: ["English", "Farsi", "Arabic", "French"],
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
      inLanguage: "en-US",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <a href="#main" className="skip-to-main bg-primary text-primary-foreground">
            Skip to main content
          </a>
          <Header />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
