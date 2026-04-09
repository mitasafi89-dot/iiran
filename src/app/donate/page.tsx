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

// ── Data ────────────────────────────────────────────────────────────────

const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_TRC20_ADDRESS || "";

const tiers: {
  amount: number;
  label: string;
  icon: LucideIcon;
  impact: string;
}[] = [
  { amount: 10, label: "Meals", icon: UtensilsCrossed, impact: "Feeds 1 family for a day" },
  { amount: 25, label: "Clean Water", icon: Droplets, impact: "Clean water for 10 people" },
  { amount: 50, label: "Medical Aid", icon: HeartPulse, impact: "Emergency medical kit" },
  { amount: 100, label: "Shelter", icon: Home, impact: "Shelter for 1 family" },
  { amount: 250, label: "Education", icon: GraduationCap, impact: "Supplies for 25 children" },
  { amount: 500, label: "Rebuild", icon: Hammer, impact: "Community rebuilding" },
];

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

const faqs: { q: string; a: string }[] = [
  {
    q: "What is USDT and why do you use it?",
    a: "USDT (Tether) is a stablecoin - a cryptocurrency whose value is pegged 1:1 to the US dollar. If you send $50 in USDT, we receive exactly $50. Unlike Bitcoin or Ethereum, there is no price volatility, so your intended donation amount is what we receive. We use the TRC-20 (TRON) network because it offers the fastest settlement and lowest fees - often under $1.",
  },
  {
    q: "I have never used crypto before. Is it difficult?",
    a: "Not at all. Buying USDT is similar to using a money transfer app. Create an account on an exchange (Binance, Coinbase, etc.), deposit money from your bank or card, buy USDT, and send it to our address. Most exchanges have step-by-step guides. The entire process takes about 10-15 minutes the first time.",
  },
  {
    q: "Can I verify my donation on the blockchain?",
    a: "Yes. Every transaction on the TRON network is permanently recorded on a public ledger. After sending, you can search the wallet address on Tronscan.org to see your transaction and all fund movements. This is one of the key advantages of crypto donations - full transparency.",
  },
  {
    q: "Can I donate other cryptocurrencies?",
    a: "Currently we accept only USDT on the TRC-20 network. This ensures we receive a stable dollar value with minimal fees. We may expand to additional tokens in the future.",
  },
  {
    q: "How do I know my donation will be used properly?",
    a: "IIRan is a registered 501(c)(3) nonprofit. All donations are tracked on-chain and allocated to verified humanitarian programs. We publish transparency reports detailing fund allocation. You can follow the wallet address on any block explorer to see all transactions.",
  },
  {
    q: "What if I send the wrong token or use the wrong network?",
    a: "Please only send USDT on the TRC-20 network. Sending other tokens or using a different network (such as ERC-20 or BEP-20) may result in permanent loss of funds. Always double-check the network selection before confirming.",
  },
];

// ── Page Component ──────────────────────────────────────────────────────

export default function DonatePage() {
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleCopyAddress() {
    navigator.clipboard.writeText(USDT_ADDRESS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <main>
      {/* ── Hero + Payment (above the fold) ──────────────────────── */}
      <section className="pt-24 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Compact header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Heart className="h-4 w-4" />
              501(c)(3) Nonprofit
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Donate to Help Iranian Civilians
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Send USDT to directly fund food, medical care, and shelter for
              families in crisis.
            </p>
          </div>

          {/* Two-column: QR payment + sidebar */}
          <div className="grid md:grid-cols-5 gap-6">
            {/* ── Payment card (main action) ──── */}
            <div className="md:col-span-3">
              <div className="rounded-2xl border-2 border-primary/20 bg-card p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Heart className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Send USDT (TRC-20)</h2>
                    <p className="text-xs text-muted-foreground">
                      Scan the QR code or copy the address
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {/* QR Code */}
                  <div className="shrink-0 mx-auto sm:mx-0">
                    <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                      <QRCodeSVG
                        value={USDT_ADDRESS}
                        size={160}
                        level="H"
                        marginSize={0}
                      />
                    </div>
                  </div>

                  {/* Address + network */}
                  <div className="flex-1 w-full min-w-0">
                    {/* Address */}
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                      Wallet Address
                    </label>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5 mb-4">
                      <code className="flex-1 text-xs break-all text-foreground font-mono select-all leading-relaxed">
                        {USDT_ADDRESS}
                      </code>
                      <button
                        onClick={handleCopyAddress}
                        className="shrink-0 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 hover:bg-accent transition-colors min-h-[36px]"
                        aria-label="Copy wallet address"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-green-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Network pills */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-xs mb-4">
                      <div className="rounded-md bg-muted/60 px-2.5 py-2 text-center">
                        <span className="block text-[10px] text-muted-foreground uppercase tracking-wide">
                          Network
                        </span>
                        <span className="font-semibold">TRON</span>
                      </div>
                      <div className="rounded-md bg-muted/60 px-2.5 py-2 text-center">
                        <span className="block text-[10px] text-muted-foreground uppercase tracking-wide">
                          Token
                        </span>
                        <span className="font-semibold">USDT</span>
                      </div>
                      <div className="rounded-md bg-muted/60 px-2.5 py-2 text-center">
                        <span className="block text-[10px] text-muted-foreground uppercase tracking-wide">
                          Standard
                        </span>
                        <span className="font-semibold">TRC-20</span>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="rounded-md border border-amber-300/40 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-950/30 px-3 py-2">
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        <strong>Note:</strong> Only send USDT on TRC-20.
                        Other tokens or networks may cause loss of funds.
                      </p>
                    </div>

                    {/* Tronscan link */}
                    <a
                      href={`https://tronscan.org/#/address/${USDT_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      Verify on Tronscan
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* Don't have USDT helper */}
                <a
                  href="#how-to-buy"
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  Don&apos;t have USDT yet? We&apos;ll show you how (takes 10 min)
                </a>
              </div>
            </div>

            {/* ── Sidebar: Trust + impact ──── */}
            <div className="md:col-span-2 flex flex-col gap-4">
              {/* Trust signals */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Why Crypto
                </h3>
                <ul className="space-y-3 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <Zap className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span>
                      <strong className="text-foreground">1-3 min settlement</strong>{" "}
                      with fees under $1
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Globe className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span>
                      <strong className="text-foreground">No intermediaries</strong>{" "}
                      - 100% reaches relief programs
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Shield className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span>
                      <strong className="text-foreground">Fully verifiable</strong>{" "}
                      on the public blockchain
                    </span>
                  </li>
                </ul>
              </div>

              {/* Impact mini-grid */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3">Your Impact</h3>
                <div className="grid grid-cols-2 gap-2">
                  {tiers.map((t) => (
                    <div
                      key={t.amount}
                      className="rounded-lg bg-muted/40 px-3 py-2.5 text-center"
                    >
                      <t.icon className="h-4 w-4 text-primary mx-auto mb-1" strokeWidth={1.5} />
                      <div className="text-sm font-bold">${t.amount}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                        {t.impact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Org badge */}
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">IIRan, Inc.</strong>{" "}
                  - Registered 501(c)(3) Nonprofit
                </p>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <Link href="/transparency" className="text-[11px] text-primary hover:underline">
                    Transparency
                  </Link>
                  <Link href="/about" className="text-[11px] text-primary hover:underline">
                    About
                  </Link>
                  <Link href="/contact" className="text-[11px] text-primary hover:underline">
                    Contact
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── New to Crypto? Guide ─────────────────────────────────── */}
      <section id="how-to-buy" className="py-16 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <HelpCircle className="h-4 w-4" />
              New to Crypto?
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              How to Buy USDT with US Dollars
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              USDT is a stablecoin worth exactly $1. Buying it is as simple as
              using a money transfer app. Here is how:
            </p>
          </div>

          {/* Step 1: Pick an exchange & sign up */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Sign up on an exchange</h3>
                <p className="text-xs text-muted-foreground">
                  Pick any exchange below. Sign up takes 5 minutes.
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {exchanges.map((ex) => (
                <a
                  key={ex.name}
                  href={ex.signUp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border bg-muted/30 px-4 py-3 hover:border-primary/30 hover:bg-muted/50 transition-colors group"
                >
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    {ex.name}
                    <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {ex.note}
                  </p>
                </a>
              ))}
            </div>
          </div>

          {/* Step 2: Buy USDT */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold">Buy USDT with your card or bank</h3>
                <p className="text-xs text-muted-foreground">
                  USDT is a stablecoin worth exactly $1. Pay with card, bank transfer, or Apple/Google Pay.
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {exchanges.map((ex) => (
                <a
                  key={ex.name}
                  href={ex.buyUsdt}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border bg-muted/30 px-4 py-3 hover:border-primary/30 hover:bg-muted/50 transition-colors group text-center"
                >
                  <div className="font-semibold text-sm flex items-center justify-center gap-1.5">
                    Buy on {ex.name}
                    <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Step 3: Send to our wallet */}
          <div className="rounded-xl border-2 border-primary/20 bg-card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold">Withdraw USDT to our wallet</h3>
                <p className="text-xs text-muted-foreground">
                  Send your USDT to the address at the top of this page. Select the <strong>TRC-20 (TRON)</strong> network.
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-muted/40 px-4 py-3 mb-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs break-all text-foreground font-mono select-all">
                  {USDT_ADDRESS}
                </code>
                <button
                  onClick={handleCopyAddress}
                  className="shrink-0 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 hover:bg-accent transition-colors min-h-[36px]"
                  aria-label="Copy wallet address"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Not sure how to withdraw? Here are guides for each exchange:
            </p>
            <div className="flex flex-wrap gap-3">
              {exchanges.map((ex) => (
                <a
                  key={ex.name}
                  href={ex.withdrawGuide}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {ex.name} withdrawal guide
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-amber-300/40 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-950/30 px-3 py-2">
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Make sure you select <strong>TRC-20 (TRON)</strong> as the network when withdrawing. Arrives in 1-3 minutes, fees under $1.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Common questions about donating with cryptocurrency.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium hover:bg-muted/50 transition-colors min-h-[44px]"
                  aria-expanded={openFaq === i}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ml-4 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="py-16 bg-primary/5">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <Heart className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Every Contribution Matters</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Whether $10 or $500, your donation directly funds food, medical
            supplies, shelter, and education for Iranian families in need.
          </p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Heart className="h-4 w-4" />
            Donate Now
          </a>
        </div>
      </section>
    </main>
  );
}
