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
  ChevronDown,
  ExternalLink,
  HelpCircle,
  UtensilsCrossed,
  Droplets,
  HeartPulse,
  Home,
  GraduationCap,
  Hammer,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { LucideIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n";

interface DonateDict {
  badge: string;
  heading: string;
  subheading: string;
  meals: string;
  mealsDesc: string;
  cleanWater: string;
  cleanWaterDesc: string;
  medicalAid: string;
  medicalAidDesc: string;
  shelter: string;
  shelterDesc: string;
  educationLabel: string;
  educationDesc: string;
  rebuild: string;
  rebuildDesc: string;
  sendUsdt: string;
  scanOrCopy: string;
  walletAddress: string;
  network: string;
  tron: string;
  token: string;
  usdt: string;
  standard: string;
  trc20: string;
  note: string;
  onlySendWarning: string;
  verifyTronscan: string;
  noUsdtYet: string;
  whyCrypto: string;
  whyCryptoSpeed: string;
  whyCryptoDirect: string;
  whyCryptoTransparent: string;
  orgBadge: string;
  newToCrypto: string;
  howToBuy: string;
  howToBuyDesc: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  withdrawNote: string;
  networkWarning: string;
  faqTitle: string;
  faqSubtitle: string;
  faqWhatIsUsdt: string;
  faqWhatIsUsdtA: string;
  faqNeverUsedCrypto: string;
  faqNeverUsedCryptoA: string;
  faqVerify: string;
  faqVerifyA: string;
  faqOtherCrypto: string;
  faqOtherCryptoA: string;
  faqProperUse: string;
  faqProperUseA: string;
  faqWrongToken: string;
  faqWrongTokenA: string;
  everyContribution: string;
  everyContributionDesc: string;
  donateNow: string;
}

const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_TRC20_ADDRESS || "";

const exchanges = [
  {
    name: "Binance",
    note: "Largest exchange globally. Lowest fees.",
    signUp: "https://accounts.binance.com/register",
    buyUsdt: "https://www.binance.com/en/trade/USDT_USD",
    withdrawGuide: "https://www.binance.com/en/support/faq/how-to-withdraw-crypto-from-binance-115003670492",
  },
  {
    name: "Bybit",
    note: "Fast setup. Card & Apple Pay.",
    signUp: "https://www.bybit.com/register",
    buyUsdt: "https://www.bybit.com/fiat/trade/otc?actionType=1&token=USDT&fiat=USD",
    withdrawGuide: "https://www.bybit.com/en/help-center/article/How-to-Withdraw-Coins",
  },
  {
    name: "Coinbase",
    note: "Best for US beginners.",
    signUp: "https://www.coinbase.com/signup",
    buyUsdt: "https://www.coinbase.com/price/tether",
    withdrawGuide: "https://help.coinbase.com/en/coinbase/trading-and-funding/sending-or-receiving-cryptocurrency/how-do-i-send-digital-currency-to-another-wallet",
  },
  {
    name: "Kraken",
    note: "Trusted security. EU & US.",
    signUp: "https://www.kraken.com/sign-up",
    buyUsdt: "https://www.kraken.com/prices/usdt-tether-price-chart/usd-us-dollar",
    withdrawGuide: "https://support.kraken.com/hc/en-us/articles/360000672763-How-to-withdraw-cryptocurrencies-from-your-Kraken-account",
  },
];

export default function DonateClient({ dict, locale, navDict }: { dict: DonateDict; locale: Locale; navDict: { transparency: string; about: string; contact: string } }) {
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const tiers: { amount: number; label: string; icon: LucideIcon; impact: string }[] = [
    { amount: 10, label: dict.meals, icon: UtensilsCrossed, impact: dict.mealsDesc },
    { amount: 25, label: dict.cleanWater, icon: Droplets, impact: dict.cleanWaterDesc },
    { amount: 50, label: dict.medicalAid, icon: HeartPulse, impact: dict.medicalAidDesc },
    { amount: 100, label: dict.shelter, icon: Home, impact: dict.shelterDesc },
    { amount: 250, label: dict.educationLabel, icon: GraduationCap, impact: dict.educationDesc },
    { amount: 500, label: dict.rebuild, icon: Hammer, impact: dict.rebuildDesc },
  ];

  const faqs = [
    { q: dict.faqWhatIsUsdt, a: dict.faqWhatIsUsdtA },
    { q: dict.faqNeverUsedCrypto, a: dict.faqNeverUsedCryptoA },
    { q: dict.faqVerify, a: dict.faqVerifyA },
    { q: dict.faqOtherCrypto, a: dict.faqOtherCryptoA },
    { q: dict.faqProperUse, a: dict.faqProperUseA },
    { q: dict.faqWrongToken, a: dict.faqWrongTokenA },
  ];

  function handleCopyAddress() {
    navigator.clipboard.writeText(USDT_ADDRESS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <main>
      {/* Hero + Payment */}
      <section className="pt-24 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Heart className="h-4 w-4" />
              {dict.badge}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{dict.heading}</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">{dict.subheading}</p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {/* Payment card */}
            <div className="md:col-span-3">
              <div className="rounded-2xl border-2 border-primary/20 bg-card p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Heart className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">{dict.sendUsdt}</h2>
                    <p className="text-xs text-muted-foreground">{dict.scanOrCopy}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="shrink-0 mx-auto sm:mx-0">
                    <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                      <QRCodeSVG value={USDT_ADDRESS} size={160} level="H" marginSize={0} />
                    </div>
                  </div>

                  <div className="flex-1 w-full min-w-0">
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">{dict.walletAddress}</label>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5 mb-4">
                      <code className="flex-1 text-xs break-all text-foreground font-mono select-all leading-relaxed">{USDT_ADDRESS}</code>
                      <button onClick={handleCopyAddress} className="shrink-0 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 hover:bg-accent transition-colors min-h-[36px]" aria-label="Copy wallet address">
                        {copied ? (<><Check className="w-3.5 h-3.5 text-green-600" /><span className="text-green-600">Copied</span></>) : (<><Copy className="w-3.5 h-3.5" /><span>Copy</span></>)}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-xs mb-4">
                      <div className="rounded-md bg-muted/60 px-2.5 py-2 text-center">
                        <span className="block text-[10px] text-muted-foreground uppercase tracking-wide">{dict.network}</span>
                        <span className="font-semibold">{dict.tron}</span>
                      </div>
                      <div className="rounded-md bg-muted/60 px-2.5 py-2 text-center">
                        <span className="block text-[10px] text-muted-foreground uppercase tracking-wide">{dict.token}</span>
                        <span className="font-semibold">{dict.usdt}</span>
                      </div>
                      <div className="rounded-md bg-muted/60 px-2.5 py-2 text-center">
                        <span className="block text-[10px] text-muted-foreground uppercase tracking-wide">{dict.standard}</span>
                        <span className="font-semibold">{dict.trc20}</span>
                      </div>
                    </div>

                    <div className="rounded-md border border-amber-300/40 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-950/30 px-3 py-2">
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        <strong>{dict.note}:</strong> {dict.onlySendWarning}
                      </p>
                    </div>

                    <a href={`https://tronscan.org/#/address/${USDT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                      {dict.verifyTronscan}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <a href="#how-to-buy" className="mt-4 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
                  <HelpCircle className="h-4 w-4" />
                  {dict.noUsdtYet}
                </a>
              </div>
            </div>

            {/* Sidebar */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  {dict.whyCrypto}
                </h3>
                <ul className="space-y-3 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2.5"><Zap className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span>{dict.whyCryptoSpeed}</span></li>
                  <li className="flex items-start gap-2.5"><Globe className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span>{dict.whyCryptoDirect}</span></li>
                  <li className="flex items-start gap-2.5"><Shield className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span>{dict.whyCryptoTransparent}</span></li>
                </ul>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3">Your Impact</h3>
                <div className="grid grid-cols-2 gap-2">
                  {tiers.map((tier) => (
                    <div key={tier.amount} className="rounded-lg bg-muted/40 px-3 py-2.5 text-center">
                      <tier.icon className="h-4 w-4 text-primary mx-auto mb-1" strokeWidth={1.5} />
                      <div className="text-sm font-bold">${tier.amount}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{tier.impact}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-xs text-muted-foreground">{dict.orgBadge}</p>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <Link href={`/${locale}/transparency`} className="text-[11px] text-primary hover:underline">{navDict.transparency}</Link>
                  <Link href={`/${locale}/about`} className="text-[11px] text-primary hover:underline">{navDict.about}</Link>
                  <Link href={`/${locale}/contact`} className="text-[11px] text-primary hover:underline">{navDict.contact}</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Buy Guide */}
      <section id="how-to-buy" className="py-16 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <HelpCircle className="h-4 w-4" />
              {dict.newToCrypto}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">{dict.howToBuy}</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">{dict.howToBuyDesc}</p>
          </div>

          {/* Step 1 */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">1</div>
              <div>
                <h3 className="font-semibold">{dict.step1Title.replace("Step 1: ", "")}</h3>
                <p className="text-xs text-muted-foreground">{dict.step1Desc}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {exchanges.map((ex) => (
                <a key={ex.name} href={ex.signUp} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-muted/30 px-4 py-3 hover:border-primary/30 hover:bg-muted/50 transition-colors group">
                  <div className="font-semibold text-sm flex items-center gap-1.5">{ex.name}<ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" /></div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{ex.note}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">2</div>
              <div>
                <h3 className="font-semibold">{dict.step2Title.replace("Step 2: ", "")}</h3>
                <p className="text-xs text-muted-foreground">{dict.step2Desc}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {exchanges.map((ex) => (
                <a key={ex.name} href={ex.buyUsdt} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-muted/30 px-4 py-3 hover:border-primary/30 hover:bg-muted/50 transition-colors group text-center">
                  <div className="font-semibold text-sm flex items-center justify-center gap-1.5">Buy on {ex.name}<ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" /></div>
                </a>
              ))}
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl border-2 border-primary/20 bg-card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">3</div>
              <div>
                <h3 className="font-semibold">{dict.step3Title.replace("Step 3: ", "")}</h3>
                <p className="text-xs text-muted-foreground">{dict.step3Desc}</p>
              </div>
            </div>
            <div className="rounded-lg bg-muted/40 px-4 py-3 mb-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs break-all text-foreground font-mono select-all">{USDT_ADDRESS}</code>
                <button onClick={handleCopyAddress} className="shrink-0 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 hover:bg-accent transition-colors min-h-[36px]" aria-label="Copy wallet address">
                  {copied ? (<><Check className="w-3.5 h-3.5 text-green-600" /><span className="text-green-600">Copied</span></>) : (<><Copy className="w-3.5 h-3.5" /><span>Copy</span></>)}
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{dict.withdrawNote}</p>
            <div className="flex flex-wrap gap-3">
              {exchanges.map((ex) => (
                <a key={ex.name} href={ex.withdrawGuide} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  {ex.name} withdrawal guide<ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-amber-300/40 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-950/30 px-3 py-2">
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">{dict.networkWarning}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">{dict.faqTitle}</h2>
            <p className="text-muted-foreground">{dict.faqSubtitle}</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium hover:bg-muted/50 transition-colors min-h-[44px]" aria-expanded={openFaq === i}>
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ml-4 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-primary/5">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <Heart className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">{dict.everyContribution}</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">{dict.everyContributionDesc}</p>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Heart className="h-4 w-4" />
            {dict.donateNow}
          </a>
        </div>
      </section>
    </main>
  );
}
