import { geoNaturalEarth1, geoPath, geoGraticule10, geoInterpolate } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

// ─── Data ───────────────────────────────────────────────────────────────────
// Real city coordinates [longitude, latitude] with supporter counts

interface SupportCity {
  name: string;
  coords: [number, number]; // [lon, lat]
  supporters: string;
  region: string;
}

const TEHRAN: [number, number] = [51.39, 35.69];

const cities: SupportCity[] = [
  // North America
  { name: "New York", coords: [-74.0, 40.71], supporters: "89K", region: "North America" },
  { name: "Los Angeles", coords: [-118.24, 34.05], supporters: "62K", region: "North America" },
  { name: "Toronto", coords: [-79.38, 43.65], supporters: "54K", region: "North America" },
  { name: "Washington DC", coords: [-77.04, 38.91], supporters: "41K", region: "North America" },
  { name: "Vancouver", coords: [-123.12, 49.28], supporters: "28K", region: "North America" },
  // South America
  { name: "São Paulo", coords: [-46.63, -23.55], supporters: "65K", region: "South America" },
  { name: "Buenos Aires", coords: [-58.38, -34.6], supporters: "18K", region: "South America" },
  // Europe (large Iranian diaspora)
  { name: "London", coords: [-0.12, 51.51], supporters: "105K", region: "Europe" },
  { name: "Berlin", coords: [13.4, 52.52], supporters: "78K", region: "Europe" },
  { name: "Paris", coords: [2.35, 48.86], supporters: "72K", region: "Europe" },
  { name: "Stockholm", coords: [18.07, 59.33], supporters: "45K", region: "Europe" },
  { name: "Hamburg", coords: [9.99, 53.55], supporters: "36K", region: "Europe" },
  { name: "Amsterdam", coords: [4.9, 52.37], supporters: "33K", region: "Europe" },
  { name: "Vienna", coords: [16.37, 48.21], supporters: "29K", region: "Europe" },
  { name: "Oslo", coords: [10.75, 59.91], supporters: "22K", region: "Europe" },
  { name: "Madrid", coords: [-3.7, 40.42], supporters: "19K", region: "Europe" },
  { name: "Rome", coords: [12.5, 41.9], supporters: "17K", region: "Europe" },
  // Middle East & Central Asia (Iran's neighbors)
  { name: "Istanbul", coords: [28.98, 41.01], supporters: "38K", region: "Middle East" },
  { name: "Dubai", coords: [55.27, 25.2], supporters: "35K", region: "Middle East" },
  { name: "Ankara", coords: [32.87, 39.93], supporters: "26K", region: "Middle East" },
  { name: "Baghdad", coords: [44.37, 33.31], supporters: "22K", region: "Middle East" },
  { name: "Baku", coords: [49.87, 40.41], supporters: "19K", region: "Middle East" },
  { name: "Kabul", coords: [69.17, 34.53], supporters: "16K", region: "Middle East" },
  { name: "Beirut", coords: [35.5, 33.89], supporters: "14K", region: "Middle East" },
  { name: "Cairo", coords: [31.24, 30.04], supporters: "24K", region: "Africa" },
  // South & East Asia
  { name: "Mumbai", coords: [72.88, 19.08], supporters: "52K", region: "South Asia" },
  { name: "Delhi", coords: [77.21, 28.61], supporters: "43K", region: "South Asia" },
  { name: "Kuala Lumpur", coords: [101.69, 3.14], supporters: "21K", region: "South Asia" },
  { name: "Tokyo", coords: [139.69, 35.69], supporters: "48K", region: "East Asia" },
  { name: "Beijing", coords: [116.41, 39.9], supporters: "31K", region: "East Asia" },
  { name: "Seoul", coords: [126.98, 37.57], supporters: "25K", region: "East Asia" },
  // Africa
  { name: "Nairobi", coords: [36.82, -1.29], supporters: "32K", region: "Africa" },
  { name: "Cape Town", coords: [18.42, -33.93], supporters: "15K", region: "Africa" },
  // Oceania
  { name: "Sydney", coords: [151.21, -33.87], supporters: "42K", region: "Oceania" },
  { name: "Melbourne", coords: [144.96, -37.81], supporters: "27K", region: "Oceania" },
];

export interface MapDict {
  sectionLabel: string;
  title: string;
  description: string;
  mapAlt: string;
  supporters: string;
  northAmerica: string;
  europe: string;
  middleEast: string;
  southAsia: string;
  tehran: string;
}

const regions = [
  { key: "northAmerica" as const, supporters: "245K" },
  { key: "europe" as const, supporters: "380K" },
  { key: "middleEast" as const, supporters: "120K" },
  { key: "southAsia" as const, supporters: "95K" },
];

const TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ─── Projection ─────────────────────────────────────────────────────────────
const WIDTH = 960;
const HEIGHT = 500;

const projection = geoNaturalEarth1()
  .translate([WIDTH / 2, HEIGHT / 2])
  .scale(160);

const pathGenerator = geoPath(projection);

// ─── Component ──────────────────────────────────────────────────────────────
export async function GlobalSupportMap({ dict }: { dict: MapDict }) {
  // Fetch world topology at build time (cached by Next.js)
  let countryPaths: string[] = [];
  try {
    const res = await fetch(TOPO_URL, { next: { revalidate: 86400 * 30 } });
    const topology = (await res.json()) as Topology<{ countries: GeometryCollection }>;
    const geo = feature(topology, topology.objects.countries);
    countryPaths = geo.features
      .map((f) => pathGenerator(f))
      .filter((p): p is string => !!p);
  } catch {
    // Fallback: render without country outlines
  }

  // Graticule (grid lines)
  const graticule = pathGenerator(geoGraticule10()) || "";

  // Sphere outline
  const spherePath = pathGenerator({ type: "Sphere" }) || "";

  // Project city markers
  const projectedCities = cities.map((city) => {
    const [x, y] = projection(city.coords) || [0, 0];
    return { ...city, x, y };
  });

  // Project Tehran
  const [tehranX, tehranY] = projection(TEHRAN) || [0, 0];

  // Great circle arcs from each city to Tehran
  const arcs = cities.map((city) => {
    const interpolate = geoInterpolate(city.coords, TEHRAN);
    const points: [number, number][] = [];
    for (let t = 0; t <= 1; t += 0.02) {
      const [lon, lat] = interpolate(t);
      const p = projection([lon, lat]);
      if (p) points.push(p);
    }
    return points.map((p) => `${p[0]},${p[1]}`).join(" ");
  });

  return (
    <section id="map" className="py-24 bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in-up">
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

        {/* SVG World Map */}
        <div className="relative w-full max-w-5xl mx-auto animate-fade-in">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full h-auto"
            aria-label={dict.mapAlt}
            role="img"
          >
            {/* Sphere background */}
            <path
              d={spherePath}
              className="fill-card stroke-border"
              strokeWidth={0.5}
            />

            {/* Graticule grid */}
            <path
              d={graticule}
              fill="none"
              className="stroke-border/40"
              strokeWidth={0.3}
            />

            {/* Country outlines */}
            {countryPaths.map((d, i) => (
              <path
                key={i}
                d={d}
                className="fill-muted-foreground/10 stroke-muted-foreground/25 hover:fill-primary/15 transition-colors duration-300"
                strokeWidth={0.4}
              />
            ))}

            {/* Connection arcs to Tehran */}
            {arcs.map((points, i) => (
              <polyline
                key={`arc-${i}`}
                points={points}
                fill="none"
                className="stroke-primary/25"
                strokeWidth={0.8}
                strokeDasharray="4 3"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="7"
                  to="0"
                  dur={`${2 + (i % 3)}s`}
                  repeatCount="indefinite"
                />
              </polyline>
            ))}

            {/* City markers */}
            {projectedCities.map((city, i) => (
              <g key={city.name} className="group">
                {/* Outer pulse ring */}
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={8}
                  className="fill-primary/0 stroke-primary/40"
                  strokeWidth={1}
                >
                  <animate
                    attributeName="r"
                    values="4;10;4"
                    dur={`${2.5 + (i % 4) * 0.3}s`}
                    begin={`${i * 0.2}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.6;0;0.6"
                    dur={`${2.5 + (i % 4) * 0.3}s`}
                    begin={`${i * 0.2}s`}
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Inner dot */}
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={3}
                  className="fill-primary stroke-background"
                  strokeWidth={1}
                />

                {/* Hover tooltip */}
                <g
                  className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                >
                  <rect
                    x={city.x - 40}
                    y={city.y - 36}
                    width={80}
                    height={28}
                    rx={6}
                    className="fill-popover stroke-border"
                    strokeWidth={0.5}
                  />
                  <text
                    x={city.x}
                    y={city.y - 24}
                    textAnchor="middle"
                    className="fill-foreground text-[9px] font-semibold"
                  >
                    {city.name}
                  </text>
                  <text
                    x={city.x}
                    y={city.y - 14}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[8px]"
                  >
                    {city.supporters} {dict.supporters}
                  </text>
                </g>
              </g>
            ))}

            {/* Tehran - center of solidarity (larger marker) */}
            <g>
              <circle cx={tehranX} cy={tehranY} r={14} className="fill-primary/10">
                <animate
                  attributeName="r"
                  values="8;16;8"
                  dur="3s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.3;0;0.3"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                cx={tehranX}
                cy={tehranY}
                r={5}
                className="fill-primary stroke-background"
                strokeWidth={1.5}
              />
              <text
                x={tehranX}
                y={tehranY - 12}
                textAnchor="middle"
                className="fill-primary text-[10px] font-bold"
              >
                {dict.tehran}
              </text>
            </g>
          </svg>
        </div>

        {/* Region stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-10 max-w-4xl mx-auto">
          {regions.map((region) => (
            <div
              key={region.key}
              className="text-center rounded-lg border border-border bg-card p-4"
            >
              <div className="text-lg font-bold">{region.supporters}</div>
              <div className="text-xs text-muted-foreground">{dict[region.key]}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
