import type { Metadata } from "next";
import { getDictionary } from "../dictionaries";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return { title: `${dict.accessibility.pageTitle} | IIRan`, description: dict.accessibility.commitmentText };
}

export default async function AccessibilityPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  const t = dict.accessibility;

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">{t.pageTitle}</p>
        <h1 className="text-4xl font-bold tracking-tight mb-2">{t.heading}</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: April 1, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.commitment}</h2>
            <p>{t.commitmentText}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.measuresTaken}</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-foreground">{t.semanticHtml}:</strong> {t.semanticHtmlDesc}</li>
              <li><strong className="text-foreground">{t.keyboardNav}:</strong> {t.keyboardNavDesc}</li>
              <li><strong className="text-foreground">{t.colorContrast}:</strong> {t.colorContrastDesc}</li>
              <li><strong className="text-foreground">{t.altText}:</strong> {t.altTextDesc}</li>
              <li><strong className="text-foreground">{t.responsiveDesign}:</strong> {t.responsiveDesignDesc}</li>
              <li><strong className="text-foreground">{t.reducedMotion}:</strong> {t.reducedMotionDesc}</li>
              <li><strong className="text-foreground">{t.darkMode}:</strong> {t.darkModeDesc}</li>
              <li><strong className="text-foreground">{t.formLabels}:</strong> {t.formLabelsDesc}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.conformance}</h2>
            <p>{t.conformanceText}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.knownLimitations}</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t.limitation1}</li>
              <li>{t.limitation2}</li>
              <li>{t.limitation3}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.feedback}</h2>
            <p>{t.feedbackText}</p>
            <ul className="list-none space-y-1 mt-3">
              <li><strong className="text-foreground">Email:</strong>{" "}<a href="mailto:info@iiran.org" className="text-primary hover:underline">info@iiran.org</a></li>
              <li><strong className="text-foreground">{t.responseTime}:</strong> {t.responseTimeValue}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.assessment}</h2>
            <p>{t.assessmentText}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
