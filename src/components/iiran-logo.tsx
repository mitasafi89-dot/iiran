/**
 * IIRan Logo — 5 concept variants.
 *
 * Design constraints:
 *  - Must be legible at 24×24 (favicon) through 120×120 (hero).
 *  - Must work in monochrome (single currentColor).
 *  - Must be recognizable without text.
 *  - Must convey: humanitarianism, Iran, peace/recovery, global reach.
 *
 * Usage:
 *   <IIRanLogo variant={1} className="w-8 h-8 text-primary" />
 *
 * All variants use a 32×32 viewBox for consistency.
 */

interface LogoProps {
  className?: string;
  variant?: 1 | 2 | 3 | 4 | 5;
}

/**
 * Variant 1 — "Globe Iran"
 * A circle (globe) with latitude/longitude lines, and an accurate
 * outline of Iran drawn inside. Border data sourced from Natural Earth
 * (public domain). Conveys "this specific country, on the world stage."
 */
function GlobeIran({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <clipPath id="globe-clip">
          <circle cx="16" cy="16" r="13.1" />
        </clipPath>
      </defs>
      {/* Globe outline */}
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.8" />
      {/* Globe grid — clipped to circle */}
      <g clipPath="url(#globe-clip)" opacity="0.55">
        {/* Longitude ellipses */}
        <ellipse cx="16" cy="16" rx="6" ry="14" stroke="currentColor" strokeWidth="0.9" />
        <ellipse cx="16" cy="16" rx="12" ry="14" stroke="currentColor" strokeWidth="0.7" />
        {/* Equator */}
        <path d="M2 16h28" stroke="currentColor" strokeWidth="0.7" />
        {/* Latitude lines */}
        <path d="M2 10h28" stroke="currentColor" strokeWidth="0.6" />
        <path d="M2 22h28" stroke="currentColor" strokeWidth="0.6" />
      </g>
      {/* Iran outline — Natural Earth data, Mercator-projected to 32×32 */}
      <path
        d="M16.2,11.5 L17,11.3 L17.7,10.8 L18.3,10.8 L18.7,10.6 L19.4,10.7 L20.4,11.2 L21.2,11.3 L22.2,12.1 L22.9,12.2 L23,13 L22.6,14.1 L22.4,14.8 L22.8,14.9 L22.4,15.5 L22.7,16.2 L22.8,16.8 L23.5,17 L23.6,17.6 L22.7,18.4 L23.2,18.9 L23.6,19.5 L24.4,19.9 L24.5,20.7 L24.9,20.9 L25,21.3 L23.6,21.8 L23.3,22.9 L21.5,22.6 L20.5,22.4 L19.5,22.2 L19.1,21.1 L18.6,20.9 L17.9,21.1 L16.9,21.5 L15.8,21.2 L14.8,20.5 L13.9,20.2 L13.3,19.4 L12.6,18.1 L12.1,18.3 L11.5,17.9 L11.2,18.3 L10.7,17.8 L10.7,17.3 L10.4,17.3 L10.5,16.6 L10,15.9 L8.9,15.4 L8.2,14.5 L8.4,13.8 L8.9,13.5 L8.8,12.9 L8.2,12.6 L7.6,11.5 L7.1,10.8 L7.3,10.5 L7,9.4 L7.6,9.1 L7.8,9.5 L8.3,9.9 L8.9,10.1 L9.2,10 L10.4,9.3 L10.7,9.3 L11,9.5 L10.7,10 L11.2,10.5 L11.5,10.4 L11.8,11.1 L12.7,11.3 L13.3,11.8 L14.6,12 L16.1,11.7 L16.2,11.5 Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="currentColor"
        fillOpacity="0.12"
      />
    </svg>
  );
}

/**
 * Variant 2 — "Interlocking I·I"
 * Two vertical bars (the two I's in IIRan) linked by a horizontal
 * crossbar, forming an abstract "bridge" or "gateway". Clean,
 * geometric, and distinctly typographic.
 */
function InterlockingII({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      {/* Outer rounded square — brand container */}
      <rect x="2" y="2" width="28" height="28" rx="7" stroke="currentColor" strokeWidth="1.8" />
      {/* Left I */}
      <line x1="11" y1="8" x2="11" y2="24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      {/* Right I */}
      <line x1="21" y1="8" x2="21" y2="24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      {/* Connecting arch between the two I's */}
      <path
        d="M11 12 Q16 6 21 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Base connecting line */}
      <line x1="11" y1="24" x2="21" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Variant 3 — "Sunrise Hands"
 * Two upward-curving arcs (cupped hands) cradling a rising sun.
 * Symbolises care, hope, and new beginnings — core humanitarian values.
 */
function SunriseHands({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      {/* Circle container */}
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.8" />
      {/* Rising sun — half-circle */}
      <path
        d="M10 18 A6 6 0 0 1 22 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Sun rays */}
      <line x1="16" y1="8" x2="16" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10.5" y1="10" x2="12" y2="12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="21.5" y1="10" x2="20" y2="12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {/* Cupped hands */}
      <path
        d="M6 22 Q10 16 16 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M26 22 Q22 16 16 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Variant 4 — "Dove Shield"
 * A shield shape containing an abstract dove in flight.
 * Shield = protection/safety; dove = peace. Direct, universally
 * understood humanitarian symbolism.
 */
function DoveShield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      {/* Shield outline */}
      <path
        d="M16 2 L28 8 V18 C28 24 22 29 16 30 C10 29 4 24 4 18 V8 Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Dove — stylized with two wing strokes and body */}
      <path
        d="M10 18 Q14 12 16 14 Q18 12 22 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Dove body */}
      <path
        d="M16 14 Q17 18 14 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Olive branch */}
      <path
        d="M14 21 Q11 20 10 22"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="10" cy="22.5" r="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/**
 * Variant 5 — "Star Crescent Horizon"
 * An eight-pointed star (common in Persian/Islamic geometric art)
 * rising above a horizon line, within a circle. The star references
 * Iranian cultural identity; the horizon suggests dawn/recovery.
 */
function StarHorizon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      {/* Outer circle */}
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.8" />
      {/* Horizon line */}
      <path d="M4 20 h24" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* Ground — subtle arc */}
      <path
        d="M6 20 Q16 24 26 20"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.5"
      />
      {/* 8-pointed star, hand-tuned for 32×32 legibility */}
      <polygon
        points="16,6 17.8,12.5 24,11 19.5,15.5 24,20 17.8,18.5 16,24 14.2,18.5 8,20 12.5,15.5 8,11 14.2,12.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function IIRanLogo({ variant = 1, className }: LogoProps) {
  switch (variant) {
    case 1:
      return <GlobeIran className={className} />;
    case 2:
      return <InterlockingII className={className} />;
    case 3:
      return <SunriseHands className={className} />;
    case 4:
      return <DoveShield className={className} />;
    case 5:
      return <StarHorizon className={className} />;
  }
}
