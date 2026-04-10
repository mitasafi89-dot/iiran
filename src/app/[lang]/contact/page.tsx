import type { Metadata } from "next";
import { Mail, Clock, MessageSquare } from "lucide-react";
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
    title: `${dict.contact.pageTitle} | IIRan`,
    description: dict.contact.description,
    openGraph: {
      title: `${dict.contact.pageTitle} | IIRan`,
      description: dict.contact.description,
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = dict.contact;

  const offices = [
    { city: t.tehran, label: t.centralOps, email: "info@iiran.org" },
    { city: t.istanbul, label: t.regionalCoord, email: "info@iiran.org" },
    { city: t.dubai, label: t.gulfOps, email: "info@iiran.org" },
    { city: t.toronto, label: t.diasporaRelations, email: "info@iiran.org" },
  ];

  const contacts = [
    { icon: Mail, label: t.generalInquiries, value: "info@iiran.org", href: "mailto:info@iiran.org", description: t.generalDesc },
    { icon: Mail, label: t.donationsGiving, value: "donate@iiran.org", href: "mailto:donate@iiran.org", description: t.donationsDesc },
    { icon: MessageSquare, label: t.pressMedia, value: "press@iiran.org", href: "mailto:press@iiran.org", description: t.pressDesc },
    { icon: Mail, label: t.partnerships, value: "info@iiran.org", href: "mailto:info@iiran.org", description: t.partnershipsDesc },
    { icon: Mail, label: t.volunteerCareers, value: "info@iiran.org", href: "mailto:info@iiran.org", description: t.volunteerDesc },
  ];

  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
              {t.pageTitle}
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              {t.heading}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t.description}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-10">
            {t.howToReach}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-colors group"
              >
                <c.icon className="w-5 h-5 text-primary mb-3" strokeWidth={1.5} />
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {c.label}
                </h3>
                <p className="text-sm text-primary font-medium mb-2">
                  {c.value}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {c.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-10">
            {t.offices}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {offices.map((o) => (
              <div
                key={o.city}
                className="rounded-xl border border-border bg-card p-6"
              >
                <h3 className="font-semibold text-lg mb-1">{o.city}</h3>
                <p className="text-sm text-primary mb-3">{o.label}</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 shrink-0" />
                    <a href={`mailto:${o.email}`} className="hover:text-foreground transition-colors">
                      {o.email}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Response Times */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <Clock className="w-8 h-8 text-primary mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="text-xl font-bold tracking-tight mb-4">
              {t.responseTimes}
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">{t.generalInquiries}:</strong>{" "}
                {t.generalResponse}
              </p>
              <p>
                <strong className="text-foreground">{t.donationsGiving}:</strong>{" "}
                {t.donationResponse}
              </p>
              <p>
                <strong className="text-foreground">{t.pressMedia}:</strong>{" "}
                {t.pressResponse}
              </p>
              <p>
                <strong className="text-foreground">{t.emergency}:</strong>{" "}
                {t.emergencyResponse}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
