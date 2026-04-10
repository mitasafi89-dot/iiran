import type { Metadata } from "next";
import { ShieldAlert, Mail, Lock } from "lucide-react";
import { getDictionary } from "../dictionaries";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return { title: `${dict.ethics.pageTitle} | IIRan`, description: dict.ethics.reportText };
}

export default async function EthicsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  const t = dict.ethics;

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">{t.pageTitle}</p>
        <h1 className="text-4xl font-bold tracking-tight mb-2">{t.heading}</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: April 1, 2026</p>

        {/* Reporting Banner */}
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6 mb-12">
          <div className="flex items-start gap-4">
            <ShieldAlert className="w-8 h-8 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">{t.reportConcern}</h2>
              <p className="text-sm text-muted-foreground mb-4">{t.reportText}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <a href="mailto:info@iiran.org" className="text-primary font-medium hover:underline">info@iiran.org</a>
                  <span className="text-xs text-muted-foreground">({t.encrypted})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{t.anonymous}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.codeOfEthics}</h2>
            <p>{t.codeOfEthicsText}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">{t.integrity}:</strong> {t.integrityDesc}</li>
              <li><strong className="text-foreground">{t.nonDiscrimination}:</strong> {t.nonDiscriminationDesc}</li>
              <li><strong className="text-foreground">{t.accountabilityLabel}:</strong> {t.accountabilityDesc}</li>
              <li><strong className="text-foreground">{t.respect}:</strong> {t.respectDesc}</li>
              <li><strong className="text-foreground">{t.compliance}:</strong> {t.complianceDesc}</li>
              <li><strong className="text-foreground">{t.conflictOfInterest}:</strong> {t.conflictDesc}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.whatToReport}</h2>
            <p>{t.whatToReportText}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t.report1}</li>
              <li>{t.report2}</li>
              <li>{t.report3}</li>
              <li>{t.report4}</li>
              <li>{t.report5}</li>
              <li>{t.report6}</li>
              <li>{t.report7}</li>
              <li>{t.report8}</li>
              <li>{t.report9}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.whistleblowerProtection}</h2>
            <p>{t.whistleblowerText}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">{t.confidentiality}:</strong> {t.confidentialityDesc}</li>
              <li><strong className="text-foreground">{t.anonymity}:</strong> {t.anonymityDesc}</li>
              <li><strong className="text-foreground">{t.noRetaliation}:</strong> {t.noRetaliationDesc}</li>
              <li><strong className="text-foreground">{t.legalProtection}:</strong> {t.legalProtectionDesc}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.investigationProcess}</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li><strong className="text-foreground">{t.receipt}:</strong> {t.receiptDesc}</li>
              <li><strong className="text-foreground">{t.assessmentLabel}:</strong> {t.assessmentDesc}</li>
              <li><strong className="text-foreground">{t.investigation}:</strong> {t.investigationDesc}</li>
              <li><strong className="text-foreground">{t.resolution}:</strong> {t.resolutionDesc}</li>
              <li><strong className="text-foreground">{t.reporting}:</strong> {t.reportingDesc}</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.governance}</h2>
            <p>{t.governanceText}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.externalReporting}</h2>
            <p>{t.externalReportingText}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">{t.chsAlliance}:</strong> {t.chsDesc}</li>
              <li><strong className="text-foreground">{t.hqai}:</strong> {t.hqaiDesc}</li>
              <li><strong className="text-foreground">{t.ocha}:</strong> {t.ochaDesc}</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
