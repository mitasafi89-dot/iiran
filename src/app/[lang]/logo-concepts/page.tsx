import type { Metadata } from "next";
import { IIRanLogo } from "@/components/iiran-logo";
import { getDictionary } from "../dictionaries";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.logoConc.pageTitle,
    robots: { index: false, follow: false },
  };
}

export default async function LogoConceptsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = dict.logoConc;

  const variants = [
    { id: 1 as const, name: t.globeIran, rationale: t.globeIranDesc },
    { id: 2 as const, name: t.interlockingII, rationale: t.interlockingIIDesc },
    { id: 3 as const, name: t.sunriseHands, rationale: t.sunriseHandsDesc },
    { id: 4 as const, name: t.doveShield, rationale: t.doveShieldDesc },
    { id: 5 as const, name: t.starHorizon, rationale: t.starHorizonDesc },
  ];

  const sizes = [
    { label: "24px", cls: "w-6 h-6" },
    { label: "32px", cls: "w-8 h-8" },
    { label: "48px", cls: "w-12 h-12" },
    { label: "64px", cls: "w-16 h-16" },
    { label: "96px", cls: "w-24 h-24" },
  ];

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t.pageTitle}</h1>
        <p className="text-muted-foreground mb-12">
          {t.description}
        </p>

        <div className="space-y-16">
          {variants.map((v) => (
            <section key={v.id} className="rounded-xl border border-border bg-card p-4 sm:p-6 lg:p-8">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-xs font-mono text-muted-foreground">V{v.id}</span>
                <h2 className="text-xl font-bold">{v.name}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-8">{v.rationale}</p>

              {/* Size ladder */}
              <div className="flex flex-wrap items-end gap-4 sm:gap-6 lg:gap-8 mb-8">
                {sizes.map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-2">
                    <IIRanLogo variant={v.id} className={`${s.cls} text-foreground`} />
                    <span className="text-[10px] text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* In-context preview: logo + wordmark */}
              <div className="flex flex-wrap gap-8">
                {/* Light bg preview */}
                <div className="flex items-center gap-2.5 rounded-lg bg-white px-5 py-3 border border-neutral-200">
                  <IIRanLogo variant={v.id} className="w-7 h-7 text-neutral-900" />
                  <span className="font-bold text-lg tracking-tight text-neutral-900">IIRan</span>
                </div>
                {/* Dark bg preview */}
                <div className="flex items-center gap-2.5 rounded-lg bg-neutral-900 px-5 py-3 border border-neutral-700">
                  <IIRanLogo variant={v.id} className="w-7 h-7 text-white" />
                  <span className="font-bold text-lg tracking-tight text-white">IIRan</span>
                </div>
                {/* Primary color preview */}
                <div className="flex items-center gap-2.5 rounded-lg bg-primary/10 px-5 py-3 border border-primary/20">
                  <IIRanLogo variant={v.id} className="w-7 h-7 text-primary" />
                  <span className="font-bold text-lg tracking-tight text-foreground">IIRan</span>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
