"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  Shield,
  Zap,
  Globe,
  Copy,
  Check,
  ArrowRight,
  HeartPulse,
  Droplets,
  GraduationCap,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";

const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_TRC20_ADDRESS || "";

export function DonationSection({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const [copied, setCopied] = useState(false);

  const highlights = [
    { icon: HeartPulse, stat: "$50", label: dict.donation.medicalKit },
    { icon: Droplets, stat: "$25", label: dict.donation.cleanWater },
    { icon: GraduationCap, stat: "$250", label: dict.donation.educationSupplies },
  ];

  function handleCopyAddress() {
    navigator.clipboard.writeText(USDT_ADDRESS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section id="help" className="py-24 bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 animate-fade-in-up">
          <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
            {dict.donation.sectionLabel}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {dict.donation.title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            {dict.donation.description}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{dict.donation.yourImpact}</h3>
              {highlights.map((h) => (
                <div key={h.stat} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <h.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="text-lg font-bold">{h.stat}</span>
                    <p className="text-sm text-muted-foreground">{h.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                {dict.donation.whyCrypto}
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{dict.donation.instantSettlement}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Globe className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{dict.donation.noIntermediaries}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{dict.donation.fullyVerifiable}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{dict.donation.sendUsdt}</h3>
                  <p className="text-xs text-muted-foreground">{dict.donation.scanQr}</p>
                </div>
              </div>

              <div className="flex justify-center mb-6">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <QRCodeSVG value={USDT_ADDRESS} size={180} level="M" marginSize={0} />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  {dict.donation.walletAddress}
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
                  <code className="flex-1 text-xs break-all text-foreground font-mono select-all">
                    {USDT_ADDRESS}
                  </code>
                  <button
                    onClick={handleCopyAddress}
                    className="shrink-0 rounded-md p-2 hover:bg-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={dict.donation.walletAddress}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                  <span className="block text-[11px] text-muted-foreground uppercase tracking-wide">
                    {dict.donation.network}
                  </span>
                  <span className="font-medium">{dict.donation.tronTrc20}</span>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                  <span className="block text-[11px] text-muted-foreground uppercase tracking-wide">
                    {dict.donation.token}
                  </span>
                  <span className="font-medium">{dict.donation.usdtTether}</span>
                </div>
              </div>

              <div className="rounded-lg border border-amber-300/40 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-950/30 px-4 py-3">
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>{dict.donation.note}:</strong> {dict.donation.onlySendUsdt}
                </p>
              </div>
            </div>

            <Link
              href={`/${lang}/donate`}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {dict.donation.viewAllOptions}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
