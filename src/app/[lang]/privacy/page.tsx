import type { Metadata } from "next";
import { getDictionary } from "../dictionaries";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return { title: `${dict.privacy.pageTitle} | IIRan`, description: dict.privacy.intro };
}

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  const t = dict.privacy;

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">{t.metaLabel}</p>
        <h1 className="text-4xl font-bold tracking-tight mb-2">{t.pageTitle}</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: April 1, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Introduction</h2>
            <p>{t.intro}</p>
            <p>{t.introNote}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s2Title}</h2>
            <h3 className="text-base font-medium text-foreground mb-2">{t.s2_1Title}</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">{t.donationInfo}:</strong> {t.donationInfoDesc}</li>
              <li><strong className="text-foreground">{t.contactInfo}:</strong> {t.contactInfoDesc}</li>
              <li><strong className="text-foreground">{t.volunteerApps}:</strong> {t.volunteerAppsDesc}</li>
            </ul>
            <h3 className="text-base font-medium text-foreground mb-2 mt-4">{t.s2_2Title}</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">{t.usageData}:</strong> {t.usageDataDesc}</li>
              <li><strong className="text-foreground">{t.deviceInfo}:</strong> {t.deviceInfoDesc}</li>
              <li><strong className="text-foreground">{t.ipAddress}:</strong> {t.ipAddressDesc}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s3Title}</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t.s3_1}</li>
              <li>{t.s3_2}</li>
              <li>{t.s3_3}</li>
              <li>{t.s3_4}</li>
              <li>{t.s3_5}</li>
              <li>{t.s3_6}</li>
              <li>{t.s3_7}</li>
              <li>{t.s3_8}</li>
            </ul>
            <p className="mt-3"><strong className="text-foreground">{t.noSell}</strong> {t.noShare}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s4Title}</h2>
            <p>{t.s4Text}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s5Title}</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">{t.donationRecords}:</strong> {t.donationRecordsDesc}</li>
              <li><strong className="text-foreground">{t.contactInquiries}:</strong> {t.contactInquiriesDesc}</li>
              <li><strong className="text-foreground">{t.newsletterSubs}:</strong> {t.newsletterSubsDesc}</li>
              <li><strong className="text-foreground">{t.securityLogs}:</strong> {t.securityLogsDesc}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s6Title}</h2>
            <p>{t.s6Intro}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t.s6_1}</li>
              <li>{t.s6_2}</li>
              <li>{t.s6_3}</li>
              <li>{t.s6_4}</li>
              <li>{t.s6_5}</li>
              <li>{t.s6_6}</li>
              <li>{t.s6_7}</li>
            </ul>
            <p className="mt-3">{t.s6Contact}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s7Title}</h2>
            <p>{t.s7Text}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s8Title}</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">{t.s8Vercel}:</strong> {t.s8VercelDesc}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s9Title}</h2>
            <p>{t.s9Text}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s10Title}</h2>
            <p>{t.s10Text}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s11Title}</h2>
            <p>{t.s11Text}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s12Title}</h2>
            <p>{t.s12Text}</p>
            <ul className="list-none space-y-1 mt-2">
              <li><strong className="text-foreground">Email:</strong>{" "}<a href="mailto:info@iiran.org" className="text-primary hover:underline">info@iiran.org</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
