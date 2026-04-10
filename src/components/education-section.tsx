"use client";

import { Clock, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface EducationDict {
  sectionLabel: string;
  title: string;
  description: string;
  timeline: string;
  y2020: string;
  y2021: string;
  y2022: string;
  y2023: string;
  y2024: string;
  y2025: string;
  y2026: string;
  faq: string;
  faqHowHelp: string;
  faqHowHelpA: string;
  faqCrisis: string;
  faqCrisisA: string;
  faqDonation: string;
  faqDonationA: string;
  faqLegit: string;
  faqLegitA: string;
  faqWLF: string;
  faqWLFA: string;
  faqSanctions: string;
  faqSanctionsA: string;
  faqVolunteer: string;
  faqVolunteerA: string;
}

export function EducationSection({ dict }: { dict: EducationDict }) {
  const timeline = [
    { year: "2020", event: dict.y2020 },
    { year: "2021", event: dict.y2021 },
    { year: "2022", event: dict.y2022 },
    { year: "2023", event: dict.y2023 },
    { year: "2024", event: dict.y2024 },
    { year: "2025", event: dict.y2025 },
    { year: "2026", event: dict.y2026 },
  ];

  const faqs = [
    { q: dict.faqHowHelp, a: dict.faqHowHelpA },
    { q: dict.faqCrisis, a: dict.faqCrisisA },
    { q: dict.faqDonation, a: dict.faqDonationA },
    { q: dict.faqLegit, a: dict.faqLegitA },
    { q: dict.faqWLF, a: dict.faqWLFA },
    { q: dict.faqSanctions, a: dict.faqSanctionsA },
    { q: dict.faqVolunteer, a: dict.faqVolunteerA },
  ];

  return (
    <section id="education" className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
            {dict.sectionLabel}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {dict.title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {dict.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
          {/* Timeline */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Clock className="w-9 h-9 text-primary" strokeWidth={1.5} />
              <h3 className="text-xl font-bold">{dict.timeline}</h3>
            </div>
            <div className="relative pl-8 border-l-2 border-primary/20 space-y-8">
              {timeline.map((item) => (
                <div
                  key={item.year}
                  className="relative"
                >
                  <div className="absolute -left-[2.45rem] top-0.5 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                  <div className="text-sm font-bold text-primary mb-1">{item.year}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.event}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <HelpCircle className="w-9 h-9 text-primary" strokeWidth={1.5} />
              <h3 className="text-xl font-bold">{dict.faq}</h3>
            </div>
            <Accordion className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-sm text-left font-medium">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      {/* FAQ Schema for Google Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.a,
              },
            })),
          }),
        }}
      />
    </section>
  );
}
