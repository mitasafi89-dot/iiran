import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Logos | IIRan",
  robots: { index: false },
};

const platforms = [
  { name: "telegram", label: "Telegram", w: 512, h: 512 },
  { name: "instagram", label: "Instagram", w: 320, h: 320 },
  { name: "x", label: "X (Twitter)", w: 400, h: 400 },
  { name: "facebook", label: "Facebook", w: 170, h: 170 },
  { name: "linkedin", label: "LinkedIn", w: 400, h: 400 },
  { name: "youtube", label: "YouTube", w: 800, h: 800 },
  { name: "favicon", label: "Favicon / PWA", w: 512, h: 512 },
  { name: "og", label: "Open Graph", w: 1200, h: 630 },
];

const themes = [
  { suffix: "light", label: "Light" },
  { suffix: "dark", label: "Dark" },
  { suffix: "brand", label: "Brand Blue" },
];

export default function BrandLogosPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
        &larr; Back to home
      </Link>

      <h1 className="text-3xl font-bold mb-2">Brand Logos</h1>
      <p className="text-muted-foreground mb-10 max-w-xl">
        Ready-to-use logos for social media platforms. Right-click and
        &quot;Save as&quot; to download, or use the direct links below.
        All files are SVG (infinitely scalable).
      </p>

      {platforms.map((p) => (
        <section key={p.name} className="mb-12">
          <h2 className="text-xl font-semibold mb-1">{p.label}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {p.w}&times;{p.h}px
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themes.map((t) => {
              const file = `/logos/iiran-${p.name}-${t.suffix}.svg`;
              return (
                <div key={t.suffix} className="rounded-lg border border-border p-4 flex flex-col items-center gap-3">
                  <p className="text-xs font-medium text-muted-foreground">{t.label}</p>
                  <div
                    className="rounded-md overflow-hidden"
                    style={{
                      background: t.suffix === "dark" ? "#0a0a0f" : t.suffix === "brand" ? "#2563eb" : "#f5f5f5",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={file}
                      alt={`IIRan logo - ${p.label} - ${t.label}`}
                      width={Math.min(p.w, 200)}
                      height={Math.min(p.h, 200)}
                      className="block"
                      style={{
                        width: Math.min(p.w, 200),
                        height: "auto",
                      }}
                    />
                  </div>
                  <a
                    href={file}
                    download={`iiran-${p.name}-${t.suffix}.svg`}
                    className="text-xs text-primary hover:underline"
                  >
                    Download SVG
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
