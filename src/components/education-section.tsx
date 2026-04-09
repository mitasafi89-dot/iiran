"use client";

import { Clock, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const timeline = [
  { year: "2020", event: "Sanctions intensify, compounding economic hardship. Humanitarian organizations warn of a growing Iran crisis affecting civilian access to food and medicine." },
  { year: "2021", event: "Floods and earthquakes compound existing challenges. International Iran humanitarian aid efforts expand to meet surging needs." },
  { year: "2022", event: "Mahsa Amini protests erupt nationwide. The Woman Life Freedom movement draws global attention to Iran human rights abuses and political prisoners." },
  { year: "2023", event: "IIRan founded as a 501(c)(3) nonprofit. First humanitarian aid shipments reach affected communities in multiple provinces." },
  { year: "2024", event: "Regional conflict escalates. Rebuilding programs launched in 12 provinces; education centers reopened for children displaced by the Iran crisis." },
  { year: "2025", event: "Israel strikes Iranian nuclear sites in June; US strikes follow. The Twelve-Day War causes mass civilian casualties. Over 2 million people supported through Iran relief fund operations." },
  { year: "2026", event: "Mass protests since December 2025. Severe government crackdown with 16,500+ killed. Internet blackout isolates millions. Iran rebuilding and humanitarian aid more urgent than ever." },
];

const faqs = [
  {
    q: "How can I help Iran right now?",
    a: "The most immediate way to help Iran is to donate to verified humanitarian organizations like IIRan that deliver food, medical supplies, and shelter to Iranian civilians. You can also raise awareness by sharing verified news, contacting elected officials to advocate for civilian protection, and supporting Iranian diaspora community events and fundraisers.",
  },
  {
    q: "What is the current humanitarian crisis in Iran?",
    a: "Iran faces a multi-layered humanitarian crisis in 2026. Military strikes in mid-2025 damaged critical infrastructure. Protests since December 2025 have been met with lethal force, with over 16,500 killed and 330,000 injured. International sanctions compound economic hardship, limiting access to food, clean water, and medicine for millions. An internet blackout has isolated entire communities from the outside world.",
  },
  {
    q: "Where does my donation to Iran go?",
    a: "91% of every dollar donated goes directly to programs: food packages, emergency medical supplies, shelter materials, clean water systems, and educational resources for children. All spending is tracked and reported in quarterly impact reports. IIRan partners with established international NGOs (UN OCHA, ICRC, UNICEF) and vetted local organizations with verified distribution records.",
  },
  {
    q: "Is IIRan a legitimate charity for Iran relief?",
    a: "Yes. IIRan, Inc. is a registered 501(c)(3) nonprofit (EIN: 88-4021573). We are non-partisan and do not support, endorse, or oppose any political entity. Our sole focus is the well-being of Iranian civilians affected by crisis. All financial records are publicly available.",
  },
  {
    q: "What is the Woman, Life, Freedom movement in Iran?",
    a: "Woman, Life, Freedom (Zan, Zendegi, Azadi) is a protest movement that began after the death of Mahsa Amini in September 2022 while in custody of Iran's morality police. It has become a broader call for Iran human rights, women's rights, and an end to compulsory veiling. The movement has drawn global solidarity and remains central to ongoing protests in 2025-2026.",
  },
  {
    q: "How do sanctions impact ordinary people in Iran?",
    a: "International sanctions on Iran, while targeting the government, have severe ripple effects on civilians. They restrict access to imported medicines, medical equipment, and food supplies. Iran's currency has lost over 80% of its value, pushing millions below the poverty line. Humanitarian exemptions exist but are difficult to navigate, creating gaps that organizations like IIRan work to fill.",
  },
  {
    q: "Can I volunteer or help Iran in ways other than donating?",
    a: "Yes. Beyond financial donations, you can volunteer for awareness campaigns, share verified news from Iran on social media, organize community fundraisers, write to elected officials urging civilian protection, or provide professional services (medical, legal, educational) through our partner network. Every action to amplify Iranian voices makes a difference.",
  },
];

export function EducationSection() {
  return (
    <section id="education" className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
            Understand the Iran Crisis
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            How to Help Iran: What You Need to Know
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Understanding the humanitarian crisis in Iran is the first step toward making a difference. Learn about the war, protests, sanctions impact, and how your support reaches those in need.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
          {/* Timeline */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Clock className="w-9 h-9 text-primary" strokeWidth={1.5} />
              <h3 className="text-xl font-bold">Timeline of Events</h3>
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
              <h3 className="text-xl font-bold">Frequently Asked Questions</h3>
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
