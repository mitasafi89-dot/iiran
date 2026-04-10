import type { Metadata } from "next";
import Link from "next/link";
import { Download, ExternalLink } from "lucide-react";
import { getDictionary } from "../dictionaries";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return {
    title: `${dict.press.pageTitle} | IIRan`,
    description: dict.press.description,
  };
}

const pressReleases = [
  {
    date: "March 28, 2026",
    title: "IIRan Surpasses $24 Million in Total Aid Delivered",
    summary: "Organization marks milestone with expanded programs in 31 provinces, reaching over 2.4 million beneficiaries since founding.",
  },
  {
    date: "February 15, 2026",
    title: "Three New Medical Clinics Open in Kermanshah Province",
    summary: "In partnership with WHO and local health authorities, IIRan opens three primary healthcare facilities serving 800+ patients weekly.",
  },
  {
    date: "January 8, 2026",
    title: "IIRan Achieves CHS Alliance Verification for Humanitarian Quality",
    summary: "Independent evaluator verifies compliance with the Core Humanitarian Standard, recognizing exceptional accountability and transparency.",
  },
  {
    date: "November 20, 2025",
    title: "Winter Relief Campaign Launches Across Western Provinces",
    summary: "Emergency program targets 5,000 families with shelter materials, heating supplies, and winter clothing kits.",
  },
  {
    date: "September 3, 2025",
    title: "IIRan and UNICEF Announce Joint Education Initiative",
    summary: "Partnership will provide school supplies, teacher training, and safe learning spaces to 25,000 children in underserved areas.",
  },
];

const mediaCoverage = [
  { outlet: "Iran International", date: "March 2026", title: "How a growing nonprofit is changing humanitarian response inside Iran", type: "feature" as const },
  { outlet: "Mehr News Agency", date: "February 2026", title: "Healthcare access improves in western Iran as new clinics open", type: "news" as const },
  { outlet: "Al Jazeera English", date: "January 2026", title: "Iran humanitarian groups adapt to new challenges", type: "video" as const },
  { outlet: "Tehran Times", date: "December 2025", title: "Winter crisis: Preparing for the cold in Iran's western provinces", type: "feature" as const },
  { outlet: "Press TV", date: "October 2025", title: "Non-partisan aid: The organizations working across political lines in Iran", type: "documentary" as const },
  { outlet: "IRNA", date: "September 2025", title: "Inside the coalition building schools in Iran's underserved regions", type: "news" as const },
];

const typeMap = { feature: "feature", news: "newsLabel", video: "videoLabel", documentary: "documentary" } as const;

export default async function PressPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = dict.press;

  const mediaKitItems = [
    { name: t.brandGuidelines, desc: t.brandGuidelinesDesc },
    { name: t.factSheet, desc: t.factSheetDesc },
    { name: t.photoLibrary, desc: t.photoLibraryDesc },
    { name: t.leadershipBios, desc: t.leadershipBiosDesc },
  ];

  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">{t.pageTitle}</p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">{t.heading}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">{t.description}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="mailto:press@iiran.org" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary hover:bg-primary/90 px-6 py-3 text-sm font-medium text-primary-foreground transition-colors">{t.contactPress}</a>
              <button className="inline-flex items-center justify-center gap-2 rounded-md border border-border hover:bg-accent px-6 py-3 text-sm font-medium transition-colors">
                <Download className="w-4 h-4" />
                {t.downloadMediaKit}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Facts */}
      <section className="py-12 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold tracking-tight mb-6">{t.quickFacts}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <ul className="space-y-2">
              <li><strong className="text-foreground">{t.founded}:</strong> 2023</li>
              <li><strong className="text-foreground">{t.status}:</strong> {t.statusValue}</li>
              <li><strong className="text-foreground">{t.executiveDirector}:</strong> Amir Hosseini</li>
            </ul>
            <ul className="space-y-2">
              <li><strong className="text-foreground">{t.totalAid}:</strong> {t.totalAidValue}</li>
              <li><strong className="text-foreground">{t.peopleReached}:</strong> 2.4M+</li>
              <li><strong className="text-foreground">{t.countriesSupporting}:</strong> 48</li>
              <li><strong className="text-foreground">{t.programEfficiency}:</strong> {t.programEfficiencyValue}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Media Coverage */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-3">{t.mediaCoverage}</h2>
          <p className="text-muted-foreground mb-8">{t.mediaCoverageDesc}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediaCoverage.map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-primary">{item.outlet}</span>
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                  <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded">{(t as Record<string, string>)[typeMap[item.type]]}</span>
                </div>
                <h3 className="text-sm font-medium leading-snug">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-3">{t.pressReleases}</h2>
          <p className="text-muted-foreground mb-8">{t.pressReleasesDesc}</p>
          <div className="space-y-6">
            {pressReleases.map((pr) => (
              <div key={pr.title} className="rounded-xl border border-border bg-card p-6">
                <div className="text-xs text-muted-foreground mb-2">{pr.date}</div>
                <h3 className="text-base font-semibold mb-2">{pr.title}</h3>
                <p className="text-sm text-muted-foreground">{pr.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Kit Contents */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-3">{t.mediaKit}</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">{t.mediaKitDesc}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mediaKitItems.map((kit) => (
              <div key={kit.name} className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-2">{kit.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{kit.desc}</p>
                <button className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interview CTA */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold tracking-tight mb-4">{t.requestInterview}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">{t.requestInterviewDesc}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="mailto:press@iiran.org" className="inline-flex items-center gap-2 rounded-md bg-primary hover:bg-primary/90 px-6 py-3 text-sm font-medium text-primary-foreground transition-colors">{t.emailPress}</a>
            <Link href={`/${locale}/about`} className="inline-flex items-center gap-2 rounded-md border border-border hover:bg-accent px-6 py-3 text-sm font-medium transition-colors">
              <ExternalLink className="w-4 h-4" />
              {t.viewLeadership}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
