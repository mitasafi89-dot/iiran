import type { Metadata } from "next";
import { getDictionary } from "../dictionaries";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return { title: `${dict.terms.pageTitle} | IIRan`, description: dict.terms.s1Text };
}

export default async function TermsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = dict.terms;

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">{t.metaLabel}</p>
        <h1 className="text-4xl font-bold tracking-tight mb-2">{t.pageTitle}</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: April 1, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s1Title}</h2>
            <p>{t.s1Text}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s2Title}</h2>
            <h3 className="text-base font-medium text-foreground mb-2">{t.s2_1Title}</h3>
            <p>{t.s2_1Text}</p>
            <h3 className="text-base font-medium text-foreground mb-2 mt-4">{t.s2_2Title}</h3>
            <p>{t.s2_2Text}{" "}<a href={`/${locale}/transparency`} className="text-primary hover:underline">{dict.nav?.transparency || "annual reports"}</a>.</p>
            <h3 className="text-base font-medium text-foreground mb-2 mt-4">{t.s2_3Title}</h3>
            <p>{t.s2_3Text}</p>
            <h3 className="text-base font-medium text-foreground mb-2 mt-4">{t.s2_4Title}</h3>
            <p>{t.s2_4Text}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s3Title}</h2>
            <p>{t.s3Intro}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t.s3_1}</li>
              <li>{t.s3_2}</li>
              <li>{t.s3_3}</li>
              <li>{t.s3_4}</li>
              <li>{t.s3_5}</li>
              <li>{t.s3_6}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s4Title}</h2>
            <p>{t.s4Text1}</p>
            <p>{t.s4Text2}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s5Title}</h2>
            <p>{t.s5Text1}</p>
            <p>{t.s5Text2}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s6Title}</h2>
            <p>{t.s6Text}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s7Title}</h2>
            <p>{t.s7Text}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s8Title}</h2>
            <p>{t.s8Text}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s9Title}</h2>
            <p>{t.s9Text}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t.s10Title}</h2>
            <p>{t.s10Text}</p>
            <ul className="list-none space-y-1 mt-2">
              <li><strong className="text-foreground">Email:</strong>{" "}<a href="mailto:info@iiran.org" className="text-primary hover:underline">info@iiran.org</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
