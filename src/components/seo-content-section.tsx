import Link from "next/link";
import { Heart, ShieldCheck, Users, Globe, Scale, Megaphone } from "lucide-react";

const waysTOHelp = [
  {
    icon: Heart,
    title: "Donate to Iran Relief",
    description:
      "Your donation funds food, medical care, clean water, and shelter for Iranian civilians. 91% of every dollar goes directly to programs.",
    cta: "Donate Now",
    href: "#help",
  },
  {
    icon: Megaphone,
    title: "Raise Awareness",
    description:
      "Share verified Iran news on social media, attend solidarity events, and amplify the voices of Iranians facing a government crackdown and internet blackout.",
    cta: "Share Our Mission",
    href: "#education",
  },
  {
    icon: Users,
    title: "Volunteer Your Skills",
    description:
      "Medical professionals, translators, legal experts, and educators can contribute through our partner network to support Iranian people directly.",
    cta: "Get Involved",
    href: "/contact",
  },
  {
    icon: Scale,
    title: "Advocate for Human Rights",
    description:
      "Contact elected officials, support resolutions protecting Iranian civilians, and stand with the Woman, Life, Freedom movement for Iran human rights.",
    cta: "Take Action",
    href: "/ethics",
  },
];

export function SeoContentSection() {
  return (
    <section id="how-to-help" className="py-24 bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Main heading targets: "how to help iran", "support iranian people" ── */}
        <div className="text-center mb-16 animate-fade-in-up">
          <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
            Stand With Iran
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            How to Help Iran: Support Iranian People Today
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Millions of Iranians face the worst humanitarian crisis in decades.
            War, sanctions, and a brutal crackdown on protests have left
            civilians without food, medicine, and shelter. Here is how you can
            make a difference right now.
          </p>
        </div>

        {/* ── Ways to help grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {waysTOHelp.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-card p-6 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-3">
                <item.icon className="w-8 h-8 text-primary shrink-0" strokeWidth={1.5} />
                <h3 className="text-base font-semibold">{item.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="text-sm font-medium text-primary hover:underline"
              >
                {item.cta} &rarr;
              </Link>
            </div>
          ))}
        </div>

        {/* ── Context block: targets informational keywords ── */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left: crisis context */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-6 h-6 text-primary" strokeWidth={1.5} />
                <h3 className="text-lg font-bold">The Iran Crisis in 2026</h3>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  In June 2025, military strikes targeted nuclear facilities and
                  critical infrastructure across Iran, triggering the Twelve-Day
                  War. Civilian casualties surged as hospitals, power grids, and
                  water systems were damaged. The economic toll of intensified
                  sanctions has pushed millions below the poverty line.
                </p>
                <p>
                  Since December 2025, mass protests have swept Iranian cities
                  calling for political change. Security forces have responded
                  with lethal force, with reports of over 16,500 killed and
                  330,000 injured. A nationwide internet blackout has cut
                  communities off from the world, making independent reporting
                  nearly impossible.
                </p>
                <p>
                  Children, women, and minorities bear the heaviest burden of
                  the crisis. The Woman, Life, Freedom movement continues to
                  demand basic human rights despite extreme repression. Iran
                  political prisoners number in the tens of thousands.
                </p>
              </div>
            </div>

            {/* Right: what IIRan does */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" strokeWidth={1.5} />
                <h3 className="text-lg font-bold">How IIRan Delivers Aid</h3>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  IIRan is a registered 501(c)(3) Iran charity that coordinates
                  with UN OCHA, ICRC, UNHCR, WHO, and UNICEF to deliver
                  humanitarian aid where it is needed most. We operate an Iran
                  relief fund that has reached 2.4 million people across 48
                  countries.
                </p>
                <p>
                  Our programs focus on five pillars: emergency food
                  distribution, medical care and supplies, clean water access,
                  emergency shelter, and education for displaced children.
                  Every donation is tracked with full transparency in our
                  quarterly impact reports.
                </p>
                <p>
                  Whether you want to donate to Iran relief, volunteer your
                  professional skills, or advocate for Iran peace and human
                  rights, IIRan provides verified, accountable channels to
                  support the Iranian people. Together, we can help Iran
                  rebuild.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
