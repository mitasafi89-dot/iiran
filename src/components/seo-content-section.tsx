import Link from "next/link";
import { Heart, ShieldCheck, Users, Globe, Scale, Megaphone } from "lucide-react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";

export function SeoContentSection({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const waysTOHelp = [
    {
      icon: Heart,
      title: dict.seo.donateTitle,
      description: dict.seo.donateText,
      cta: dict.seo.donateNow,
      href: "#help",
    },
    {
      icon: Megaphone,
      title: dict.seo.awarenessTitle,
      description: dict.seo.awarenessText,
      cta: dict.seo.shareMission,
      href: "#education",
    },
    {
      icon: Users,
      title: dict.seo.volunteerTitle,
      description: dict.seo.volunteerText,
      cta: dict.seo.getInvolved,
      href: `/${lang}/contact`,
    },
    {
      icon: Scale,
      title: dict.seo.advocateTitle,
      description: dict.seo.advocateText,
      cta: dict.seo.takeAction,
      href: `/${lang}/ethics`,
    },
  ];

  return (
    <section id="how-to-help" className="py-24 bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
            {dict.seo.sectionLabel}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {dict.seo.title}
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {dict.seo.intro}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {waysTOHelp.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-card p-6 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-3">
                <item.icon className="w-8 h-8 text-primary shrink-0" strokeWidth={1.5} />
                <h3 className="text-base font-semibold">{item.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="text-sm font-medium text-primary hover:underline"
              >
                {item.cta} &rarr;
              </Link>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-6 h-6 text-primary" strokeWidth={1.5} />
                <h3 className="text-lg font-bold">{dict.seo.crisisTitle}</h3>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>{dict.seo.crisisP1}</p>
                <p>{dict.seo.crisisP2}</p>
                <p>{dict.seo.crisisP3}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" strokeWidth={1.5} />
                <h3 className="text-lg font-bold">{dict.seo.howWeDeliverTitle}</h3>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>{dict.seo.howWeDeliverP1}</p>
                <p>{dict.seo.howWeDeliverP2}</p>
                <p>{dict.seo.howWeDeliverP3}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
