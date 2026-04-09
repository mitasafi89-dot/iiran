import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility Statement | IIRan",
  description:
    "IIRan accessibility commitment. Our ongoing efforts to ensure our website is accessible to all users.",
  openGraph: {
    title: "Accessibility Statement | IIRan",
    description: "IIRan accessibility commitment and WCAG conformance.",
  },
};

export default function AccessibilityPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
          Accessibility
        </p>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Accessibility Statement
        </h1>
        <p className="text-sm text-muted-foreground mb-12">
          Last updated: April 1, 2026
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Our Commitment
            </h2>
            <p>
              IIRan is committed to ensuring that our website is accessible to
              the widest possible audience, including people with disabilities.
              We actively work to increase the accessibility and usability of
              our website and hold ourselves to the standards of the Web Content
              Accessibility Guidelines (WCAG) 2.2 Level AA.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Measures Taken
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Semantic HTML:</strong> We
                use proper heading hierarchy, landmarks, and ARIA attributes to
                ensure screen readers can navigate our content effectively.
              </li>
              <li>
                <strong className="text-foreground">Keyboard navigation:</strong>{" "}
                All interactive elements are accessible via keyboard. Focus
                indicators are visible on all focusable elements.
              </li>
              <li>
                <strong className="text-foreground">Color contrast:</strong> Text
                and interactive elements meet WCAG AA contrast ratios (minimum
                4.5:1 for normal text, 3:1 for large text).
              </li>
              <li>
                <strong className="text-foreground">Alternative text:</strong>{" "}
                All images include descriptive alt text. Decorative images are
                properly marked as presentation-only.
              </li>
              <li>
                <strong className="text-foreground">Responsive design:</strong>{" "}
                Our website is fully functional at zoom levels up to 400% and on
                all screen sizes.
              </li>
              <li>
                <strong className="text-foreground">Reduced motion:</strong> We
                respect the &quot;prefers-reduced-motion&quot; operating system
                setting and minimize animations when enabled.
              </li>
              <li>
                <strong className="text-foreground">Dark mode:</strong> Full dark
                mode support that respects system preferences.
              </li>
              <li>
                <strong className="text-foreground">Form labels:</strong> All
                form inputs have associated labels and error messages are clearly
                announced.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Conformance Status
            </h2>
            <p>
              We aim to conform to WCAG 2.2 Level AA. While we strive for full
              conformance, some third-party content (embedded videos, external
              news sources) may not fully meet all criteria. We are working with
              content providers to improve accessibility.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Known Limitations
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Some embedded YouTube videos may lack captions or audio
                descriptions.
              </li>
              <li>
                PDF documents linked from external sources may not be fully
                accessible.
              </li>
              <li>
                The interactive global support map has limited screen reader
                support; we provide a text-based alternative.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Feedback
            </h2>
            <p>
              If you encounter any accessibility barriers on our website, please
              let us know. We take all feedback seriously and will work to
              resolve issues promptly.
            </p>
            <ul className="list-none space-y-1 mt-3">
              <li>
                <strong className="text-foreground">Email:</strong>{" "}
                <a
                  href="mailto:info@iiran.org"
                  className="text-primary hover:underline"
                >
                  info@iiran.org
                </a>
              </li>

              <li>
                <strong className="text-foreground">Response time:</strong>{" "}
                Within 5 business days
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Assessment
            </h2>
            <p>
              IIRan assesses the accessibility of our website through a
              combination of automated testing tools, manual testing with
              assistive technologies, and periodic third-party audits. Our most
              recent audit was conducted in March 2026 by an independent\n              accessibility specialist.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
