import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "../dictionaries";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return {
    title: `${dict.brandLogos.pageTitle} | IIRan`,
    robots: { index: false },
  };
}

export default async function BrandLogosPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = dict.brandLogos;

  const platforms = [
    { name: "telegram", label: t.telegram, w: 512, h: 512 },
    { name: "instagram", label: t.instagram, w: 320, h: 320 },
    { name: "x", label: t.xTwitter, w: 400, h: 400 },
    { name: "facebook", label: t.facebook, w: 170, h: 170 },
    { name: "linkedin", label: t.linkedIn, w: 400, h: 400 },
    { name: "youtube", label: t.youTube, w: 800, h: 800 },
    { name: "favicon", label: t.faviconPwa, w: 512, h: 512 },
    { name: "og", label: t.openGraph, w: 1200, h: 630 },
  ];

  const themes = [
    { suffix: "light", label: t.light },
    { suffix: "dark", label: t.dark },
    { suffix: "brand", label: t.brandBlue },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href={`/${locale}`} className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
        &larr; {t.backHome}
      </Link>

      <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
      <p className="text-muted-foreground mb-10 max-w-xl">
        {t.description}
      </p>

      {platforms.map((p) => (
        <section key={p.name} className="mb-12">
          <h2 className="text-xl font-semibold mb-1">{p.label}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {p.w}&times;{p.h}px
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themes.map((th) => {
              const file = `/logos/iiran-${p.name}-${th.suffix}.svg`;
              return (
                <div key={th.suffix} className="rounded-lg border border-border p-4 flex flex-col items-center gap-3">
                  <p className="text-xs font-medium text-muted-foreground">{th.label}</p>
                  <div
                    className="rounded-md overflow-hidden"
                    style={{
                      background: th.suffix === "dark" ? "#0a0a0f" : th.suffix === "brand" ? "#2563eb" : "#f5f5f5",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={file}
                      alt={`${t.logoAlt} - ${p.label} - ${th.label}`}
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
                    download={`iiran-${p.name}-${th.suffix}.svg`}
                    className="text-xs text-primary hover:underline"
                  >
                    {t.downloadSvg}
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
