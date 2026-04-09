import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Donate cryptocurrency (USDT) to support humanitarian aid for Iranian civilians. Fast, transparent, blockchain-verified donations with zero intermediary fees. 501(c)(3) nonprofit.",
  openGraph: {
    title: "Donate to IIRan | Crypto Humanitarian Aid for Iran",
    description:
      "Support Iranian civilians with a crypto donation. USDT on TRC-20 for instant, fee-free, blockchain-verified humanitarian aid.",
  },
};

export default function DonateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
