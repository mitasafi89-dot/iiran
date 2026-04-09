import type { Metadata } from "next";
import { ShieldAlert, Mail, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Ethics & Whistleblower Policy | IIRan",
  description:
    "IIRan ethics policy and whistleblower protections. Report misconduct, fraud, or ethical concerns safely and confidentially.",
  openGraph: {
    title: "Ethics & Whistleblower Policy | IIRan",
    description:
      "Report misconduct safely. IIRan whistleblower protections and ethics policy.",
  },
};

export default function EthicsPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
          Governance
        </p>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Ethics &amp; Whistleblower Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-12">
          Last updated: April 1, 2026
        </p>

        {/* Reporting Banner */}
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6 mb-12">
          <div className="flex items-start gap-4">
            <ShieldAlert className="w-8 h-8 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Report a Concern
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                If you are a staff member, volunteer, partner, beneficiary, or
                member of the public and you have witnessed or suspect
                misconduct, fraud, abuse, or any violation of our policies, we
                encourage you to report it. All reports are treated
                confidentially.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <a
                    href="mailto:info@iiran.org"
                    className="text-primary font-medium hover:underline"
                  >
                    info@iiran.org
                  </a>
                  <span className="text-xs text-muted-foreground">
                    (encrypted, monitored by Board Audit Committee)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Anonymous reports accepted. No account or identification
                    required.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Code of Ethics
            </h2>
            <p>
              All IIRan board members, staff, volunteers, and partners are bound
              by our Code of Ethics, which requires:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">Integrity:</strong> Honest
                and transparent conduct in all operations
              </li>
              <li>
                <strong className="text-foreground">Non-discrimination:</strong>{" "}
                Aid distributed based solely on need, without discrimination by
                race, religion, nationality, gender, or political affiliation
              </li>
              <li>
                <strong className="text-foreground">Accountability:</strong>{" "}
                Responsible stewardship of donor funds and organizational
                resources
              </li>
              <li>
                <strong className="text-foreground">Respect:</strong> Dignity and
                respect for all beneficiaries, colleagues, and partners
              </li>
              <li>
                <strong className="text-foreground">Compliance:</strong>{" "}
                Adherence to all applicable laws, regulations, and IIRan
                policies
              </li>
              <li>
                <strong className="text-foreground">
                  Conflict of interest:
                </strong>{" "}
                Prompt disclosure of any real or perceived conflicts of interest
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. What to Report
            </h2>
            <p>We encourage reporting of any suspected:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Financial fraud, embezzlement, or misuse of donor funds</li>
              <li>Corruption, bribery, or kickbacks</li>
              <li>
                Diversion of humanitarian aid for non-intended purposes
              </li>
              <li>
                Sexual exploitation, abuse, or harassment (SEAH)
              </li>
              <li>Discrimination or harassment of any kind</li>
              <li>Violations of donor privacy or data protection</li>
              <li>Safety and security threats to staff or beneficiaries</li>
              <li>Falsification of reports, data, or financial records</li>
              <li>
                Any violation of IIRan policies or applicable law
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. Protection for Whistleblowers
            </h2>
            <p>
              IIRan strictly prohibits retaliation against anyone who, in good
              faith, reports a suspected violation. Protections include:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">Confidentiality:</strong>{" "}
                Reporter identity is protected to the maximum extent possible
              </li>
              <li>
                <strong className="text-foreground">Anonymity:</strong> Reports
                can be made anonymously. We will investigate regardless.
              </li>
              <li>
                <strong className="text-foreground">
                  No retaliation:
                </strong>{" "}
                Any employee who retaliates against a whistleblower is subject to
                immediate disciplinary action, up to and including termination
              </li>
              <li>
                <strong className="text-foreground">Legal protection:</strong>{" "}
                Whistleblowers are protected under applicable laws and
                international humanitarian accountability standards
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. Investigation Process
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Receipt:</strong> All reports
                are received by the Board Audit Committee, independent of
                management.
              </li>
              <li>
                <strong className="text-foreground">Assessment:</strong> Within
                48 hours, the Committee assesses the report and determines the
                appropriate course of action.
              </li>
              <li>
                <strong className="text-foreground">Investigation:</strong> An
                investigation is conducted by the Committee or an independent
                third party. Investigations are completed within 30 days when
                possible.
              </li>
              <li>
                <strong className="text-foreground">Resolution:</strong>{" "}
                Findings and corrective actions are documented. Reporters receive
                an outcome summary (unless anonymous).
              </li>
              <li>
                <strong className="text-foreground">Reporting:</strong> The Board
                receives quarterly summaries of all ethics reports and
                resolutions.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. Governance Oversight
            </h2>
            <p>
              The Board Audit Committee has independent authority to investigate
              ethics complaints, engage external investigators or legal counsel,
              and recommend corrective action. The Committee reports directly to
              the full Board of Directors, not to management.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. External Reporting
            </h2>
            <p>
              If you believe your concern has not been adequately addressed
              internally, you may also report to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">CHS Alliance:</strong>{" "}
                Report concerns to the Core Humanitarian Standard Alliance
              </li>
              <li>
                <strong className="text-foreground">HQAI:</strong>{" "}
                Independent quality assurance body for humanitarian organizations
              </li>
              <li>
                <strong className="text-foreground">OCHA:</strong>{" "}
                UN Office for the Coordination of Humanitarian Affairs
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
