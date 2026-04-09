import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  Shield,
  Eye,
  Users,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | IIRan",
  description:
    "Meet the team and board of directors behind IIRan, an independent humanitarian organization supporting peace, recovery, and rebuilding in Iran.",
  openGraph: {
    title: "About Us | IIRan",
    description:
      "Meet the team and board of directors behind IIRan.",
  },
};

// ── Board of Directors ──────────────────────────────────────────────────

const board = [
  {
    name: "Dr. Sara Tehrani",
    role: "Chair of the Board",
    bio: "Former UNHCR Senior Advisor with 20+ years in humanitarian operations across the Middle East. Ph.D. in International Relations from University of Tehran.",
    image: "https://images.unsplash.com/photo-1568299273577-64c090fb8354?w=400&q=80&auto=format",
  },
  {
    name: "Dariush Mohammadi",
    role: "Vice Chair",
    bio: "Senior financial governance advisor with expertise in nonprofit oversight across the MENA region. Serves on the audit committees of three international NGOs.",
    image: "https://images.unsplash.com/photo-1664871475935-39a9b861514f?w=400&q=80&auto=format",
  },
  {
    name: "Dr. Leila Ahmadi",
    role: "Board Member",
    bio: "Emergency medicine physician and WHO consultant. Led medical response teams in Syria, Yemen, and Afghanistan. Faculty member at Tehran University of Medical Sciences.",
    image: "https://images.unsplash.com/photo-1761765230989-2441b8f51954?w=400&q=80&auto=format",
  },
  {
    name: "Reza Bakhtiari",
    role: "Board Member, Treasurer",
    bio: "CPA and former CFO of Iranian Red Crescent Society. Specializes in nonprofit financial compliance and transparent fund management for humanitarian organizations.",
    image: "https://images.unsplash.com/photo-1659353221844-a5c6c35a8ff1?w=400&q=80&auto=format",
  },
  {
    name: "Farah Karimi",
    role: "Board Member",
    bio: "Human rights advocate and prominent voice in the Iranian diaspora. Founder of the Iranian Diaspora Collective. Recognized by the UN for contributions to civil society.",
    image: "https://images.unsplash.com/photo-1761765230980-a1068efd4561?w=400&q=80&auto=format",
  },
  {
    name: "Dr. Kaveh Sardari",
    role: "Board Member",
    bio: "Professor of Public Policy at Allameh Tabataba'i University. Advisor to UNDP on Middle East development programs. Published researcher on post-conflict reconstruction.",
    image: "https://images.unsplash.com/photo-1710340459313-b8753e8f3d07?w=400&q=80&auto=format",
  },
];

// ── Leadership Team ─────────────────────────────────────────────────────

const leadership = [
  {
    name: "Amir Hosseini",
    role: "Executive Director",
    bio: "15 years directing humanitarian operations. Former ICRC delegate. Fluent in Farsi, Arabic, English, and French.",
    image: "https://images.unsplash.com/photo-1595860320513-01df382ebdb1?w=400&q=80&auto=format",
  },
  {
    name: "Dr. Nazanin Ebrahimi",
    role: "Director of Programs",
    bio: "Ph.D. in Public Health from Shahid Beheshti University. Previously managed UNICEF programs across 8 countries. Expert in monitoring and evaluation frameworks.",
    image: "https://images.unsplash.com/photo-1770130174214-477ce018479f?w=400&q=80&auto=format",
  },
  {
    name: "Babak Farhadi",
    role: "Chief Financial Officer",
    bio: "Certified in nonprofit financial management with 12 years in humanitarian finance. Ensures every dollar is tracked from donor to beneficiary.",
    image: "https://images.unsplash.com/photo-1659353221012-4b03d33347d2?w=400&q=80&auto=format",
  },
  {
    name: "Yasmin Rahimi",
    role: "Director of Communications",
    bio: "Award-winning journalist and former Iran International correspondent. Leads transparency reporting and public engagement strategy.",
    image: "https://images.unsplash.com/photo-1761765241312-a9e7c3d4ca9c?w=400&q=80&auto=format",
  },
];

// ── Values ──────────────────────────────────────────────────────────────

const values = [
  {
    icon: Eye,
    title: "Radical Transparency",
    description:
      "Every dollar is tracked. Quarterly impact reports are published publicly. Our finances are independently audited annually.",
  },
  {
    icon: Shield,
    title: "Non-Partisan Commitment",
    description:
      "We do not support, endorse, or oppose any political entity. Aid is distributed based solely on need, without discrimination.",
  },
  {
    icon: Users,
    title: "Local Empowerment",
    description:
      "We work through established local organizations, building capacity rather than dependency. Communities lead their own recovery.",
  },
  {
    icon: Globe,
    title: "Accountability",
    description:
      "Governed by an independent board. Subject to external audits. Compliant with international humanitarian standards."
  },
];

export default function AboutPage() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
              About IIRan
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              Who We Are
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              IIRan is an independent, non-partisan humanitarian organization
              dedicated to supporting peace, recovery, and rebuilding in Iran.
              Founded in 2023 by a coalition of Iranian humanitarian
              professionals and diaspora leaders, we have delivered over $18 million in aid to 2.4
              million people across 31 provinces.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We are a registered 501(c)(3) nonprofit organization (EIN:
              88-4021573) with global operations.
            </p>
          </div>
        </div>
      </section>

      {/* Registration & Certifications */}
      <section className="py-12 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="text-sm font-semibold text-foreground mb-1">
                Legal Status
              </div>
              <div className="text-xs text-muted-foreground">
                501(c)(3) Tax-Exempt
              </div>
              <div className="text-xs text-muted-foreground">
                EIN: 88-4021573
              </div>
            </div>
            <div className="p-4">
              <div className="text-sm font-semibold text-foreground mb-1">
                Independent Audit
              </div>
              <div className="text-xs text-muted-foreground">
                Annual Financial Audit
              </div>
              <div className="text-xs text-muted-foreground">
                Clean Opinion, 3 Years
              </div>
            </div>
            <div className="p-4">
              <div className="text-sm font-semibold text-foreground mb-1">
                CHS Alliance
              </div>
              <div className="text-xs text-muted-foreground">
                Core Humanitarian Standard
              </div>
              <div className="text-xs text-muted-foreground">
                Verified Compliant
              </div>
            </div>
            <div className="p-4">
              <div className="text-sm font-semibold text-foreground mb-1">
                Sphere Standards
              </div>
              <div className="text-xs text-muted-foreground">
                Humanitarian Charter
              </div>
              <div className="text-xs text-muted-foreground">
                Full Compliance
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-10 text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {values.map((v) => (
              <div key={v.title} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <v.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Board of Directors */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight mb-3">
              Board of Directors
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our independent board provides governance, financial oversight, and
              strategic direction. All board members serve pro bono.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {board.map((person) => (
              <div
                key={person.name}
                className="bg-card rounded-xl border border-border p-6 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-4 relative">
                  <Image
                    src={person.image}
                    alt={person.name}
                    fill
                    sizes="(min-width: 640px) 96px, 80px"
                    className="object-cover"
                  />
                </div>
                <h3 className="font-semibold text-lg">{person.name}</h3>
                <p className="text-sm text-primary mb-3">{person.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {person.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight mb-3">
              Leadership Team
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our leadership team brings decades of combined experience in
              humanitarian operations, finance, public health, and communications.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {leadership.map((person) => (
              <div
                key={person.name}
                className="bg-card rounded-xl border border-border p-6 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-4 relative">
                  <Image
                    src={person.image}
                    alt={person.name}
                    fill
                    sizes="(min-width: 640px) 80px, 64px"
                    className="object-cover"
                  />
                </div>
                <h3 className="font-semibold">{person.name}</h3>
                <p className="text-sm text-primary mb-2">{person.role}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {person.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Our Partners
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
            We work alongside the world&apos;s leading humanitarian organizations to
            maximize impact and ensure accountability.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-items-center max-w-4xl mx-auto">
            {[
              { name: "UN OCHA", url: "https://www.unocha.org" },
              { name: "ICRC", url: "https://www.icrc.org" },
              { name: "UNHCR", url: "https://www.unhcr.org" },
              { name: "WHO", url: "https://www.who.int" },
              { name: "UNICEF", url: "https://www.unicef.org" },
            ].map((partner) => (
              <a
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-bold text-muted-foreground hover:text-foreground transition-colors p-4"
              >
                {partner.name}
              </a>
            ))}
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            Partner relationships verified through formal memoranda of
            understanding. View our{" "}
            <Link href="/transparency" className="text-primary hover:underline">
              partnership documentation
            </Link>
            .
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            Questions? Get in Touch
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            We welcome inquiries from donors, journalists, potential partners,
            and anyone who wants to learn more about our work.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md bg-primary hover:bg-primary/90 px-6 py-3 text-sm font-medium text-primary-foreground transition-colors"
            >
              <Mail className="w-4 h-4" />
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
