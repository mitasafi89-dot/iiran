import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | IIRan",
  description:
    "IIRan privacy policy. How we collect, use, and protect your personal information.",
  openGraph: {
    title: "Privacy Policy | IIRan",
    description: "How IIRan collects, uses, and protects your personal information.",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
          Legal
        </p>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-12">
          Last updated: April 1, 2026
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Introduction
            </h2>
            <p>
              IIRan (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is
              committed to protecting the privacy and security of your personal
              information. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you visit our website
              iiran.org, make a donation, or interact with our services.
            </p>
            <p>
              We are a registered nonprofit organization. We
              comply with applicable data protection laws, including the General
              Data Protection Regulation (GDPR) and other applicable
              international privacy regulations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. Information We Collect
            </h2>
            <h3 className="text-base font-medium text-foreground mb-2">
              2.1 Information You Provide
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">Donation information:</strong>{" "}
                Name, email address, billing address, and payment details.
                Cryptocurrency wallet addresses used for donations.
              </li>
              <li>
                <strong className="text-foreground">Contact information:</strong>{" "}
                Name and email address when you contact us, subscribe to
                newsletters, or request information.
              </li>
              <li>
                <strong className="text-foreground">Volunteer applications:</strong>{" "}
                Name, contact details, skills, and availability.
              </li>
            </ul>

            <h3 className="text-base font-medium text-foreground mb-2 mt-4">
              2.2 Information Collected Automatically
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">Usage data:</strong> Pages
                visited, time spent, referring URLs, and interaction patterns.
              </li>
              <li>
                <strong className="text-foreground">Device information:</strong>{" "}
                Browser type, operating system, screen resolution, and language
                settings.
              </li>
              <li>
                <strong className="text-foreground">IP address:</strong> Used for
                security purposes (rate limiting, fraud prevention) and
                approximate geographic location. We do not use IP addresses for
                tracking or advertising.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Process and confirm donations</li>
              <li>Send tax receipts and donation confirmations</li>
              <li>Provide impact reports to donors</li>
              <li>Respond to inquiries and support requests</li>
              <li>Send newsletters and updates (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-3">
              <strong className="text-foreground">
                We never sell, rent, or trade your personal information.
              </strong>{" "}
              We do not share donor information with other organizations for
              their fundraising or marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. Payment Security
            </h2>
            <p>
              Donations are accepted via cryptocurrency (USDT on the TRC-20
              network). Blockchain transactions are publicly verifiable. We do
              not collect or store any personal financial information such as
              credit card numbers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. Data Retention
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">Donation records:</strong>{" "}
                Retained for 7 years as required by applicable tax regulations for\n                nonprofit organizations.
              </li>
              <li>
                <strong className="text-foreground">Contact inquiries:</strong>{" "}
                Retained for 2 years from last communication.
              </li>
              <li>
                <strong className="text-foreground">Newsletter subscriptions:</strong>{" "}
                Until you unsubscribe.
              </li>
              <li>
                <strong className="text-foreground">Security logs:</strong>{" "}
                Retained for 90 days, then permanently deleted.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. Your Rights
            </h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (&quot;right to be forgotten&quot;)</li>
              <li>Object to or restrict processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
              <li>
                Lodge a complaint with a supervisory authority (for EU/EEA
                residents)
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email{" "}
              <a
                href="mailto:info@iiran.org"
                className="text-primary hover:underline"
              >
                info@iiran.org
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              7. Cookies
            </h2>
            <p>
              We use only essential cookies required for website functionality
              (theme preference, session management). We do not use advertising
              cookies, tracking pixels, or third-party analytics that profile
              users. We do not participate in cross-site tracking.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              8. Third-Party Services
            </h2>
            <ul className="list-disc pl-5 space-y-1">

              <li>
                <strong className="text-foreground">Vercel:</strong> Website hosting. See{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Vercel Privacy Policy
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              9. Children&apos;s Privacy
            </h2>
            <p>
              Our website is not directed to children under 13. We do not
              knowingly collect personal information from children. If we become
              aware that a child has provided us with personal data, we will
              delete it immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              10. International Transfers
            </h2>
            <p>
              Your information may be transferred to and maintained on servers
              located outside of your country of residence. We ensure appropriate
              safeguards are in place (Standard Contractual Clauses for EU/EEA
              data) to protect your information regardless of where it is
              processed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              11. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify
              you of material changes by posting the new policy on this page and
              updating the &quot;Last updated&quot; date. We encourage you to
              review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              12. Contact Us
            </h2>
            <p>
              For privacy-related inquiries, contact our Data Protection Officer:
            </p>
            <ul className="list-none space-y-1 mt-2">
              <li>
                <strong className="text-foreground">Email:</strong>{" "}
                <a
                  href="mailto:info@iiran.org"
                  className="text-primary hover:underline"
                >
                  info@iiran.org
                </a>
              </li>

            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
