import Link from "next/link";
import Image from "next/image";

// ── Partner data with verifiable links ──────────────────────────────────
const partners = [
  { name: "UN OCHA", abbr: "UN OCHA", url: "https://www.unocha.org" },
  { name: "ICRC", abbr: "ICRC", url: "https://www.icrc.org" },
  { name: "UNHCR", abbr: "UNHCR", url: "https://www.unhcr.org" },
  { name: "WHO", abbr: "WHO", url: "https://www.who.int" },
  { name: "UNICEF", abbr: "UNICEF", url: "https://www.unicef.org" },
];

// ── Minimal UN-style SVG logos for instant brand recognition ────────────
function UNOCHAIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 4 L16 28 M4 16 L28 16 M8 8 L24 24 M24 8 L8 24" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <circle cx="16" cy="16" r="6" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function ICRCIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <rect x="8" y="8" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 11 L16 21 M11 16 L21 16" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

function UNHCRIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M10 22 C10 22 16 6 16 6 C16 6 22 22 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 22 L24 22" stroke="currentColor" strokeWidth="1" />
      <circle cx="16" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function WHOIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 4 L16 28" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 6 C20 10 20 22 16 26 C12 22 12 10 16 6Z" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M4 16 L28 16" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function UNICEFIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="13" r="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10 24 C10 20 22 20 22 24" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

const partnerLogos: Record<string, React.FC<{ className?: string }>> = {
  "UN OCHA": UNOCHAIcon,
  "ICRC": ICRCIcon,
  "UNHCR": UNHCRIcon,
  "WHO": WHOIcon,
  "UNICEF": UNICEFIcon,
};

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0B1929]">
      <Image
        src="https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1920&q=75&auto=format"
        alt=""
        fill
        preload
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1929]/90 via-[#0F2137]/75 to-[#0B1929]/90" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center animate-fade-in-up">
        <p className="text-sm sm:text-base font-medium tracking-widest uppercase text-blue-200/80 mb-4">
          Verified 501(c)(3) Nonprofit Delivering Aid in Iran
        </p>
        <h1 className="text-[clamp(1.75rem,5vw,4.5rem)] font-bold tracking-tight text-white leading-[1.1] mb-6">
          Help Iran:{" "}
          <span className="text-blue-200">Humanitarian Aid &amp; Relief for Civilians</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Iranians face war, sanctions, and a deepening humanitarian crisis. Donate
          to deliver food, medical care, and shelter to civilians in need. Stand
          with Iran through transparent, verified relief.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up [animation-delay:300ms]">
          <Link
            href="#education"
            className="inline-flex items-center justify-center rounded-md bg-blue-800 hover:bg-blue-900 px-8 py-3.5 text-base font-semibold text-white transition-colors shadow-lg shadow-blue-950/40 min-h-[44px]"
          >
            Learn About Our Work
          </Link>
          <Link
            href="#help"
            className="inline-flex items-center justify-center rounded-md border border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 px-8 py-3.5 text-base font-semibold text-white transition-colors min-h-[44px]"
          >
            Donate
          </Link>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-white/60 text-sm animate-fade-in [animation-delay:1200ms]">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">2.4M+</div>
            <div>People Reached</div>
          </div>
          <div className="w-px h-10 bg-white/20 hidden sm:block" aria-hidden="true" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">48</div>
            <div>Countries Supporting</div>
          </div>
          <div className="w-px h-10 bg-white/20 hidden sm:block" aria-hidden="true" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">$18M</div>
            <div>Aid Delivered</div>
          </div>
        </div>
        <p className="mt-3 text-xs text-white/40 animate-fade-in [animation-delay:1400ms]">
          Source: UN OCHA &amp; partner reports, 2026
        </p>
      </div>

      {/* Trust bar with partner logos */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/5 backdrop-blur-sm border-t border-white/10 animate-fade-in [animation-delay:1500ms]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-6 lg:gap-x-10">
          <span className="text-xs text-white/40 uppercase tracking-wider hidden sm:block">Data&nbsp;Partners</span>
          <div className="w-px h-5 bg-white/20 hidden sm:block" aria-hidden="true" />
          {partners.map((p) => {
            const IconComponent = partnerLogos[p.abbr];
            return (
              <a
                key={p.abbr}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-white/60 hover:text-white/90 transition-colors py-1"
                aria-label={p.name}
              >
                {IconComponent ? (
                  <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                ) : null}
                <span className="hidden sm:inline text-xs font-semibold tracking-wide">
                  {p.abbr}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
