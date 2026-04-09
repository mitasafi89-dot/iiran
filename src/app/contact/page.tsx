import type { Metadata } from "next";
import { Mail, Clock, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | IIRan",
  description:
    "Get in touch with IIRan. Reach our team for donations, press inquiries, partnerships, volunteering, or general questions.",
  openGraph: {
    title: "Contact Us | IIRan",
    description: "Get in touch with the IIRan humanitarian team.",
  },
};

const offices = [
  {
    city: "Tehran",
    label: "Central Operations",
    email: "info@iiran.org",
  },
  {
    city: "Istanbul",
    label: "Regional Coordination",
    email: "info@iiran.org",
  },
  {
    city: "Dubai",
    label: "Gulf Operations",
    email: "info@iiran.org",
  },
  {
    city: "Toronto",
    label: "Diaspora Relations",
    email: "info@iiran.org",
  },
];

const contacts = [
  {
    icon: Mail,
    label: "General Inquiries",
    value: "info@iiran.org",
    href: "mailto:info@iiran.org",
    description: "For general questions about our mission and programs.",
  },
  {
    icon: Mail,
    label: "Donations & Giving",
    value: "donate@iiran.org",
    href: "mailto:donate@iiran.org",
    description:
      "Questions about your donation, tax receipts, or planned giving.",
  },
  {
    icon: MessageSquare,
    label: "Press & Media",
    value: "press@iiran.org",
    href: "mailto:press@iiran.org",
    description:
      "Media inquiries, interview requests, and press kit access.",
  },
  {
    icon: Mail,
    label: "Partnerships",
    value: "info@iiran.org",
    href: "mailto:info@iiran.org",
    description:
      "For organizations interested in collaboration or joint programs.",
  },
  {
    icon: Mail,
    label: "Volunteer & Careers",
    value: "info@iiran.org",
    href: "mailto:info@iiran.org",
    description:
      "Volunteering opportunities, internships, and open positions.",
  },
];

export default function ContactPage() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
              Contact
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We are here to answer your questions. Whether you are a donor,
              journalist, potential partner, or someone who wants to help, we
              would love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-10">
            How to Reach Us
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
            Our Offices
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
              Response Times
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">General inquiries:</strong>{" "}
                Within 2 business days
              </p>
              <p>
                <strong className="text-foreground">Donation questions:</strong>{" "}
                Within 1 business day
              </p>
              <p>
                <strong className="text-foreground">Press inquiries:</strong>{" "}
                Within 4 hours during business hours
              </p>
              <p>
                <strong className="text-foreground">Emergency / urgent:</strong>{" "}
                Email info@iiran.org with &quot;URGENT&quot; in the subject line
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
