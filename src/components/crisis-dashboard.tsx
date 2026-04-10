"use client";

import { useEffect, useState } from "react";
import { Home, Package, AlertTriangle, HeartPulse, Hammer, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DashboardData {
  displaced: number;
  aidDelivered: number;
  urgentNeeds: number;
  medicalAid: number;
  sheltersBuilt: number;
  mealsServed: number;
  lastUpdated: string;
  activeDisasters?: number;
  recentReports?: number;
  dataSource?: string;
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Respect reduced-motion: animate instantly (duration=0)
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = prefersReducedMotion ? 0 : 2000;
    let start: number | null = null;
    let raf: number;

    function step(ts: number) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / (duration || 1), 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

interface CrisisDict {
  sectionLabel: string;
  title: string;
  description: string;
  displaced: string;
  aidPackages: string;
  urgentNeeds: string;
  medicalInterventions: string;
  sheltersBuilt: string;
  mealsServed: string;
  lastUpdatedAt: string;
  utc: string;
  activeDisaster: string;
  activeDisasters: string;
  reportsOnFile: string;
}

export function CrisisDashboard({ data, dict }: { data: DashboardData; dict: CrisisDict }) {
  const stats: { label: string; key: keyof DashboardData; suffix: string; icon: LucideIcon }[] = [
    { label: dict.displaced, key: "displaced", suffix: "+", icon: Home },
    { label: dict.aidPackages, key: "aidDelivered", suffix: "+", icon: Package },
    { label: dict.urgentNeeds, key: "urgentNeeds", suffix: "", icon: AlertTriangle },
    { label: dict.medicalInterventions, key: "medicalAid", suffix: "+", icon: HeartPulse },
    { label: dict.sheltersBuilt, key: "sheltersBuilt", suffix: "+", icon: Hammer },
    { label: dict.mealsServed, key: "mealsServed", suffix: "+", icon: UtensilsCrossed },
  ];

  return (
    <section id="dashboard" className="py-24 bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
            {dict.sectionLabel}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {dict.title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {dict.description}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="rounded-xl border border-border bg-card p-4 sm:p-6 text-center"
            >
              <div className="flex justify-center mb-2">
                <stat.icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary" strokeWidth={1.5} />
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-1">
                <AnimatedCounter
                  value={data[stat.key] as number}
                  suffix={stat.suffix}
                />
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          {dict.lastUpdatedAt} {new Date(data.lastUpdated).toISOString().replace("T", " ").slice(0, 19)} {dict.utc}
          {data.dataSource && <> &middot; {data.dataSource}</>}
          {data.activeDisasters != null && data.activeDisasters > 0 && (
            <> &middot; {data.activeDisasters} {data.activeDisasters !== 1 ? dict.activeDisasters : dict.activeDisaster}</>
          )}
          {data.recentReports != null && data.recentReports > 0 && (
            <> &middot; {data.recentReports.toLocaleString()} {dict.reportsOnFile}</>
          )}
        </p>
      </div>
    </section>
  );
}
