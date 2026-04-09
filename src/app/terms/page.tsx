import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | IIRan",
  description:
    "IIRan terms of service. Terms and conditions governing use of the iiran.org website and donation services.",
  openGraph: {
    title: "Terms of Service | IIRan",
    description: "Terms governing use of the iiran.org website and services.",
  },
};

export default function TermsPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
          Legal
        </p>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mb-12">
          Last updated: April 1, 2026
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the IIRan website (iiran.org), you agree to
              be bound by these Terms of Service. If you do not agree to these
              terms, please do not use our website or services. IIRan is operated
              by IIRan, Inc., a registered nonprofit organization
              (EIN: 88-4021573).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. Donations
            </h2>
            <h3 className="text-base font-medium text-foreground mb-2">
              2.1 General
            </h3>
            <p>
              All donations to IIRan are voluntary and non-refundable.
              Donations are tax-deductible to the extent permitted by law under
              Section 170 of the Internal Revenue Code. You will receive an
              email confirmation and annual tax receipt for your records.
            </p>

            <h3 className="text-base font-medium text-foreground mb-2 mt-4">
              2.2 Use of Funds
            </h3>
            <p>
              We allocate at least 90% of every donation directly to program
              services. Administrative and fundraising costs are kept below 10%.
              Detailed financial breakdowns are published in our{" "}
              <a href="/transparency" className="text-primary hover:underline">
                annual reports
              </a>
              .
            </p>

            <h3 className="text-base font-medium text-foreground mb-2 mt-4">
              2.3 Recurring Donations
            </h3>
            <p>
              If you choose to make a recurring monthly donation, you authorize
              us to charge your selected payment method on the same date each
              month. You may cancel a recurring donation at any time by emailing{" "}
              <a
                href="mailto:donate@iiran.org"
                className="text-primary hover:underline"
              >
                donate@iiran.org
              </a>{" "}
              and we will process the cancellation promptly.
            </p>

            <h3 className="text-base font-medium text-foreground mb-2 mt-4">
              2.4 Refund Policy
            </h3>
            <p>
              Donations are generally non-refundable. If you believe a donation
              was made in error (e.g., incorrect amount, unauthorized
              transaction), please contact us within 30 days at{" "}
              <a
                href="mailto:donate@iiran.org"
                className="text-primary hover:underline"
              >
                donate@iiran.org
              </a>
              . We will review each request on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. Website Use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use automated tools to scrape or mine data from our website</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Transmit malware, viruses, or malicious code</li>
              <li>
                Interfere with or disrupt the website or connected infrastructure
              </li>
              <li>
                Impersonate IIRan or its representatives
              </li>
              <li>
                Use the website for any unlawful purpose
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. Intellectual Property
            </h2>
            <p>
              The IIRan name, logo, and original content on this website are
              protected by copyright and trademark law. News articles, stories,
              and media content from third-party sources are attributed to their
              respective creators and used under fair use or with permission.
            </p>
            <p>
              You may share our content for non-commercial purposes with
              appropriate attribution. For media use, please contact{" "}
              <a
                href="mailto:press@iiran.org"
                className="text-primary hover:underline"
              >
                press@iiran.org
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. Disclaimer of Warranties
            </h2>
            <p>
              Our website and services are provided &quot;as is&quot; and
              &quot;as available&quot; without warranties of any kind, either
              express or implied. We do not guarantee that the website will be
              uninterrupted, secure, or error-free.
            </p>
            <p>
              While we strive to provide accurate and up-to-date information,
              humanitarian situation data is sourced from multiple organizations
              and may contain delays or inaccuracies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, IIRan and its directors,
              officers, employees, and volunteers shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages
              arising from your use of the website or services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              7. Third-Party Links
            </h2>
            <p>
              Our website may contain links to third-party websites (news
              sources, partner organizations, payment processors). We are not
              responsible for the content, privacy practices, or availability of
              these external sites. Access them at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              8. Governing Law
            </h2>
            <p>
              These Terms are governed by applicable international law.
              Any disputes arising from these Terms shall be resolved
              through good-faith mediation or, if necessary, binding
              arbitration under internationally recognized procedures.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              9. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. Material
              changes will be posted on this page with an updated date.
              Continued use of the website after changes constitutes acceptance
              of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              10. Contact
            </h2>
            <p>
              Questions about these Terms should be directed to:
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
