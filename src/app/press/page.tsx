import type { Metadata } from "next";
import Link from "next/link";
import { Download, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Press & Media | IIRan",
  description:
    "IIRan press resources, media kit, press releases, and media coverage. Resources for journalists covering humanitarian issues in Iran.",
  openGraph: {
    title: "Press & Media | IIRan",
    description: "Press resources and media coverage of IIRan humanitarian work.",
  },
};

const pressReleases = [
  {
    date: "March 28, 2026",
    title: "IIRan Surpasses $24 Million in Total Aid Delivered",
    summary:
      "Organization marks milestone with expanded programs in 31 provinces, reaching over 2.4 million beneficiaries since founding.",
  },
  {
    date: "February 15, 2026",
    title: "Three New Medical Clinics Open in Kermanshah Province",
    summary:
      "In partnership with WHO and local health authorities, IIRan opens three primary healthcare facilities serving 800+ patients weekly.",
  },
  {
    date: "January 8, 2026",
    title: "IIRan Achieves CHS Alliance Verification for Humanitarian Quality",
    summary:
      "Independent evaluator verifies compliance with the Core Humanitarian Standard, recognizing exceptional accountability and transparency.",
  },
  {
    date: "November 20, 2025",
    title: "Winter Relief Campaign Launches Across Western Provinces",
    summary:
      "Emergency program targets 5,000 families with shelter materials, heating supplies, and winter clothing kits.",
  },
  {
    date: "September 3, 2025",
    title: "IIRan and UNICEF Announce Joint Education Initiative",
    summary:
      "Partnership will provide school supplies, teacher training, and safe learning spaces to 25,000 children in underserved areas.",
  },
];

const mediaCoverage = [
  {
    outlet: "Iran International",
    date: "March 2026",
    title: "How a growing nonprofit is changing humanitarian response inside Iran",
    type: "Feature",
  },
  {
    outlet: "Mehr News Agency",
    date: "February 2026",
    title: "Healthcare access improves in western Iran as new clinics open",
    type: "News",
  },
  {
    outlet: "Al Jazeera English",
    date: "January 2026",
    title: "Iran humanitarian groups adapt to new challenges",
    type: "Video",
  },
  {
    outlet: "Tehran Times",
    date: "December 2025",
    title: "Winter crisis: Preparing for the cold in Iran's western provinces",
    type: "Feature",
  },
  {
    outlet: "Press TV",
    date: "October 2025",
    title: "Non-partisan aid: The organizations working across political lines in Iran",
    type: "Documentary",
  },
  {
    outlet: "IRNA",
    date: "September 2025",
    title: "Inside the coalition building schools in Iran's underserved regions",
    type: "News",
  },
];

export default function PressPage() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
              Press &amp; Media
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              Media Resources
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              We work with journalists and media organizations to share accurate,
              timely information about the humanitarian situation in Iran. All
              press inquiries receive a response within 4 hours during business
              hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:press@iiran.org"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary hover:bg-primary/90 px-6 py-3 text-sm font-medium text-primary-foreground transition-colors"
              >
                Contact Press Office
              </a>
              <button className="inline-flex items-center justify-center gap-2 rounded-md border border-border hover:bg-accent px-6 py-3 text-sm font-medium transition-colors">
                <Download className="w-4 h-4" />
                Download Media Kit
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Facts */}
      <section className="py-12 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold tracking-tight mb-6">
            Quick Facts for Journalists
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <ul className="space-y-2">
              <li>
                <strong className="text-foreground">Founded:</strong> 2023
              </li>

              <li>
                <strong className="text-foreground">Status:</strong> 501(c)(3)
                registered nonprofit
              </li>
              <li>
                <strong className="text-foreground">Executive Director:</strong>{" "}
                Amir Hosseini
              </li>
            </ul>
            <ul className="space-y-2">
              <li>
                <strong className="text-foreground">Total Aid Delivered:</strong>{" "}
                $24.3M+ (as of Q1 2026)
              </li>
              <li>
                <strong className="text-foreground">People Reached:</strong>{" "}
                2.4M+
              </li>
              <li>
                <strong className="text-foreground">Countries Supporting:</strong>{" "}
                48
              </li>
              <li>
                <strong className="text-foreground">Program Efficiency:</strong>{" "}
                91.2% of funds to programs
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Media Coverage */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Media Coverage
          </h2>
          <p className="text-muted-foreground mb-8">
            Selected coverage from regional and international media outlets.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediaCoverage.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-primary">
                    {item.outlet}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.date}
                  </span>
                  <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded">
                    {item.type}
                  </span>
                </div>
                <h3 className="text-sm font-medium leading-snug">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Press Releases
          </h2>
          <p className="text-muted-foreground mb-8">
            Official announcements from IIRan.
          </p>
          <div className="space-y-6">
            {pressReleases.map((pr) => (
              <div
                key={pr.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="text-xs text-muted-foreground mb-2">
                  {pr.date}
                </div>
                <h3 className="text-base font-semibold mb-2">{pr.title}</h3>
                <p className="text-sm text-muted-foreground">{pr.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Kit Contents */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Media Kit
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Download our media kit for logos, brand guidelines, fact sheets, and
            high-resolution photos approved for editorial use.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                name: "Brand Guidelines & Logos",
                desc: "SVG, PNG, PDF formats. Light and dark variants.",
              },
              {
                name: "Fact Sheet",
                desc: "One-page overview with key statistics and mission statement.",
              },
              {
                name: "Photo Library",
                desc: "High-resolution photos cleared for editorial use.",
              },
              {
                name: "Leadership Bios & Headshots",
                desc: "Official biographies and photos of key personnel.",
              },
            ].map((kit) => (
              <div
                key={kit.name}
                className="rounded-xl border border-border bg-card p-5"
              >
                <h3 className="text-sm font-semibold mb-2">{kit.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{kit.desc}</p>
                <button className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interview CTA */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold tracking-tight mb-4">
            Request an Interview
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            Our Executive Director and program directors are available for
            interviews. We can provide on-the-ground context, data, and expert
            analysis on the Iran humanitarian situation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:press@iiran.org"
              className="inline-flex items-center gap-2 rounded-md bg-primary hover:bg-primary/90 px-6 py-3 text-sm font-medium text-primary-foreground transition-colors"
            >
              Email Press Office
            </a>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-md border border-border hover:bg-accent px-6 py-3 text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Leadership Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
