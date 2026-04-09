import { Home, HeartPulse, GraduationCap, Droplets } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const weeklyUpdates = [
  {
    week: "Mar 31 - Apr 6, 2026",
    highlights: [
      "12,500 food packages distributed across 3 provinces",
      "New medical clinic opened in Kermanshah, serving 800+ patients",
      "Water purification systems installed in 5 rural communities",
    ],
  },
  {
    week: "Mar 24 - Mar 30, 2026",
    highlights: [
      "Emergency shelter materials delivered to 340 families",
      "Education program expanded to 3 new districts",
      "Mental health support services launched in Tabriz",
    ],
  },
  {
    week: "Mar 17 - Mar 23, 2026",
    highlights: [
      "Partnership with local NGOs increased aid distribution by 40%",
      "Solar power installations completed for 2 community centers",
      "Vocational training program enrolled 150 new participants",
    ],
  },
];

const metrics: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "Families Housed This Month", value: "1,240", icon: Home },
  { label: "Medical Consultations", value: "8,600", icon: HeartPulse },
  { label: "Children in School Programs", value: "4,200", icon: GraduationCap },
  { label: "Clean Water Access (people)", value: "32,000", icon: Droplets },
];

export function ImpactSection() {
  return (
    <section id="impact" className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
            Transparent Results
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Our Impact
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We believe in full transparency. Here is a weekly breakdown of how your
            support is making a tangible difference.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-16">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-border bg-card p-4 sm:p-5 text-center"
            >
              <div className="flex justify-center mb-2">
                <metric.icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" strokeWidth={1.5} />
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">{metric.value}</div>
              <div className="text-xs text-muted-foreground">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* Weekly Updates */}
        <div className="max-w-3xl mx-auto space-y-6">
          {weeklyUpdates.map((update) => (
            <div
              key={update.week}
              className="rounded-xl border border-border bg-card p-6"
            >
              <h3 className="font-semibold text-sm mb-3 text-primary">
                Week of {update.week}
              </h3>
              <ul className="space-y-2">
                {update.highlights.map((highlight, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5 flex-shrink-0">&#10003;</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
