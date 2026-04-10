import type { Metadata } from "next";
import Link from "next/link";
import { FileText, BarChart3, DollarSign, PieChart } from "lucide-react";
import { getDictionary } from "../dictionaries";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return { title: `${dict.transparency.pageTitle} | IIRan`, description: dict.transparency.description };
}

const annualReports = [
  { year: "2025", revenue: "$24.3M", programs: "91.2%", admin: "5.8%", fundraising: "3.0%", status: "Audited" },
  { year: "2023", revenue: "$8.7M", programs: "89.8%", admin: "6.8%", fundraising: "3.4%", status: "Audited" },
];

const quarterlyUpdates = [
  {
    quarter: "Q1 2026",
    highlights: [
      "Opened 3 new medical clinics in Kermanshah province",
      "Delivered 45,000 food packages across western provinces",
      "Education program expanded to reach 12,000 children",
      "Clean water infrastructure completed in 8 villages",
    ],
    spending: "$6.2M",
  },
  {
    quarter: "Q4 2025",
    highlights: [
      "Winter shelter program housed 1,800 families",
      "Emergency medical supplies distributed to 15 hospitals",
      "Vocational training graduated 340 participants",
      "Partnership with 5 new local NGOs formalized",
    ],
    spending: "$7.1M",
  },
  {
    quarter: "Q3 2025",
    highlights: [
      "Earthquake relief response in East Azerbaijan",
      "School rebuilding program completed 12 facilities",
      "Mental health counseling reached 2,400 individuals",
      "Agricultural recovery seeds distributed to 800 farmers",
    ],
    spending: "$5.8M",
  },
];

export default async function TransparencyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = dict.transparency;

  const programSpending = [
    { category: t.foodNutrition, percentage: 28, amount: "$6.8M" },
    { category: t.medicalAid, percentage: 24, amount: "$5.8M" },
    { category: t.shelterHousing, percentage: 18, amount: "$4.4M" },
    { category: t.cleanWater, percentage: 14, amount: "$3.4M" },
    { category: t.educationPrograms, percentage: 10, amount: "$2.4M" },
    { category: t.communityRebuilding, percentage: 6, amount: "$1.5M" },
  ];

  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">{t.pageTitle}</p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">{t.heading}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{t.description}</p>
          </div>
        </div>
      </section>

      {/* Key Financial Stats */}
      <section className="py-12 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <DollarSign className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">91.2%</div>
              <div className="text-xs text-muted-foreground">{t.goesToPrograms}</div>
            </div>
            <div>
              <PieChart className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">&lt;6%</div>
              <div className="text-xs text-muted-foreground">{t.adminCosts}</div>
            </div>
            <div>
              <BarChart3 className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">$24.3M</div>
              <div className="text-xs text-muted-foreground">{t.totalRevenue2025}</div>
            </div>
            <div>
              <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">3 Years</div>
              <div className="text-xs text-muted-foreground">{t.independentlyAudited}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Spending Breakdown */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-3">{t.programSpending}</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">{t.programSpendingDesc}</p>
          <div className="space-y-4 max-w-2xl">
            {programSpending.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{item.category}</span>
                  <span className="text-sm text-muted-foreground">{item.amount} ({item.percentage}%)</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${item.percentage * (100 / 28)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Annual Reports Table */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-3">{t.auditedReports}</h2>
          <p className="text-muted-foreground mb-8">{t.auditedReportsDesc}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-3 pr-4 font-semibold">{t.year}</th>
                  <th className="py-3 pr-4 font-semibold">{t.totalRevenueLabel}</th>
                  <th className="py-3 pr-4 font-semibold">{t.programs}</th>
                  <th className="py-3 pr-4 font-semibold">{t.admin}</th>
                  <th className="py-3 pr-4 font-semibold">{t.fundraising}</th>
                  <th className="py-3 pr-4 font-semibold">{t.auditor}</th>
                </tr>
              </thead>
              <tbody>
                {annualReports.map((r) => (
                  <tr key={r.year} className="border-b border-border/50 text-muted-foreground">
                    <td className="py-3 pr-4 font-medium text-foreground">{r.year}</td>
                    <td className="py-3 pr-4">{r.revenue}</td>
                    <td className="py-3 pr-4 text-green-600 dark:text-green-400 font-medium">{r.programs}</td>
                    <td className="py-3 pr-4">{r.admin}</td>
                    <td className="py-3 pr-4">{r.fundraising}</td>
                    <td className="py-3 pr-4">{t.independentAuditors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            {t.financialFilings}
          </p>
        </div>
      </section>

      {/* Quarterly Updates */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-3">{t.quarterlyUpdates}</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">{t.quarterlyDesc}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quarterlyUpdates.map((q) => (
              <div key={q.quarter} className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{q.quarter}</h3>
                  <span className="text-sm text-primary font-medium">{q.spending}</span>
                </div>
                <ul className="space-y-2">
                  {q.highlights.map((h) => (
                    <li key={h} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-green-600 dark:text-green-400 shrink-0">&#10003;</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Third-Party Validation */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-8">{t.verifiedTitle}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            <div className="p-4">
              <div className="text-lg font-bold text-foreground mb-1">CHS Alliance</div>
              <div className="text-sm font-bold text-primary">{t.verified}</div>
              <div className="text-xs text-muted-foreground">Core Humanitarian Standard</div>
            </div>
            <div className="p-4">
              <div className="text-lg font-bold text-foreground mb-1">Sphere Standards</div>
              <div className="text-sm font-bold text-primary">{t.compliant}</div>
              <div className="text-xs text-muted-foreground">Humanitarian Charter</div>
            </div>
            <div className="p-4">
              <div className="text-lg font-bold text-foreground mb-1">HQAI</div>
              <div className="text-sm font-bold text-primary">{t.certified}</div>
              <div className="text-xs text-muted-foreground">{t.qualityAccountability}</div>
            </div>
            <div className="p-4">
              <div className="text-lg font-bold text-foreground mb-1">Annual Audit</div>
              <div className="text-sm font-bold text-primary">{t.clean}</div>
              <div className="text-xs text-muted-foreground">{t.unqualifiedOpinion}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold tracking-tight mb-4">{t.questionsTitle}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">{t.questionsText}</p>
          <Link href={`/${locale}/contact`} className="inline-flex items-center gap-2 rounded-md bg-primary hover:bg-primary/90 px-6 py-3 text-sm font-medium text-primary-foreground transition-colors">{t.askAnything}</Link>
        </div>
      </section>
    </div>
  );
}
