// ============================================================================
// SOURCE RESILIENCE & FALLBACK SYSTEM
//
// Handles real-world failure scenarios:
// - Internet blackouts in Iran (common during conflict)
// - Source censorship or shutdown
// - API rate limits / failures
// - DNS-level blocking
//
// Strategies:
// 1. Redundant source groups (same story from multiple outlets)
// 2. Fallback RSS URL variants (mirrors, alternate domains)
// 3. Offline article cache (serve stale if fresh fails)
// 4. Source health degradation scoring
// ============================================================================

import { isCircuitOpen } from "./health";

// ── Redundant Source Groups ────────────────────────────────────────────
// If one source in a group fails, others in the same group cover the same
// stories. Used by the pipeline to assess coverage completeness.

export const REDUNDANCY_GROUPS: Record<string, string[]> = {
  // Iranian state media: highly redundant. Any 2 of 5 = full coverage.
  iranState: [
    "tehrantimes", "presstv", "mehrnews", "irna", "tasnim",
    "iranpress", "farsnews", "parstoday", "isna",
  ],
  // Resistance axis: overlapping coverage of Iran defense narrative
  resistanceAxis: [
    "almayadeen", "thecradle", "mintpressnews", "thegrayzone",
    "antiwar", "voltairenet",
  ],
  // Middle East regional: Iran-adjacent conflict coverage
  middleEast: [
    "aljazeera", "middleeasteye", "trtworld", "dailysabah",
    "almonitor", "anadoluagency",
  ],
  // East Asia multipolar: anti-Western perspective on Iran
  eastAsia: [
    "cgtn", "xinhua", "globaltimes", "chinadaily",
    "peoplesdaily", "tass", "rt", "sputnik",
  ],
  // South Asia: regional perspective
  southAsia: [
    "dawn", "thenewsintl", "expresstribune", "geotv",
    "timesofindia", "hindustantimes",
  ],
  // Humanitarian: factual crisis reporting
  humanitarian: [
    "unnews", "icrc", "reliefweb", "amnesty", "hrw",
  ],
  // Meta/aggregators: catch-all coverage
  aggregators: [
    "googlenews", "gnews-api", "newsdata-api", "currents-api",
  ],
};

// ── Fallback URLs ──────────────────────────────────────────────────────
// Alternative RSS/feed URLs for sources that have mirrors or alternate
// domains. Tried in order when primary URL fails.

export const FALLBACK_URLS: Record<string, string[]> = {
  presstv: [
    "https://www.presstv.ir/rss.xml",
    "https://www.presstv.co.uk/rss.xml",
  ],
  irna: [
    "https://en.irna.ir/rss",
    "https://irna.ir/en/rss",
  ],
  almayadeen: [
    "https://english.almayadeen.net/rss",
    "https://www.almayadeen.net/en/rss",
  ],
  rt: [
    "https://www.rt.com/rss/news",
    "https://de.rt.com/rss/news",
  ],
  xinhua: [
    "http://www.xinhuanet.com/english/rss/worldrss.xml",
    "https://english.news.cn/rss/worldrss.xml",
  ],
};

// ── Coverage Assessment ────────────────────────────────────────────────

export interface CoverageReport {
  totalGroups: number;
  healthyGroups: number;
  degradedGroups: string[];
  offlineGroups: string[];
  overallHealth: "excellent" | "good" | "degraded" | "critical";
}

/**
 * Assess how many redundancy groups have sufficient live sources.
 * A group is "healthy" if >= 2 sources are not circuit-broken.
 * A group is "degraded" if only 1 source is live.
 * A group is "offline" if all sources are circuit-broken.
 */
export function assessCoverage(): CoverageReport {
  const totalGroups = Object.keys(REDUNDANCY_GROUPS).length;
  let healthyGroups = 0;
  const degradedGroups: string[] = [];
  const offlineGroups: string[] = [];

  for (const [group, sources] of Object.entries(REDUNDANCY_GROUPS)) {
    const liveSources = sources.filter((s) => !isCircuitOpen(s));
    if (liveSources.length >= 2) {
      healthyGroups++;
    } else if (liveSources.length === 1) {
      degradedGroups.push(group);
    } else {
      offlineGroups.push(group);
    }
  }

  const healthRatio = healthyGroups / totalGroups;
  const overallHealth =
    healthRatio >= 0.85 ? "excellent" :
    healthRatio >= 0.65 ? "good" :
    healthRatio >= 0.4 ? "degraded" :
    "critical";

  return {
    totalGroups,
    healthyGroups,
    degradedGroups,
    offlineGroups,
    overallHealth,
  };
}

// ── Stale Content Cache ────────────────────────────────────────────────
// In-memory cache of last successful fetch results per source.
// If a source goes down, we serve the last known articles (marked stale).

interface CachedResult {
  articles: Array<{
    title: string;
    description: string;
    source: string;
    sourceId: string;
    url: string;
    publishedAt: string;
    imageUrl?: string;
  }>;
  cachedAt: number;
  stale: boolean;
}

const articleCache = new Map<string, CachedResult>();
const MAX_STALE_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

export function cacheSourceResult(
  sourceId: string,
  articles: CachedResult["articles"]
): void {
  articleCache.set(sourceId, {
    articles,
    cachedAt: Date.now(),
    stale: false,
  });
}

export function getStaleArticles(
  sourceId: string
): CachedResult["articles"] | null {
  const cached = articleCache.get(sourceId);
  if (!cached) return null;
  if (Date.now() - cached.cachedAt > MAX_STALE_AGE_MS) {
    articleCache.delete(sourceId);
    return null;
  }
  return cached.articles;
}

// ── Internet Blackout Detection ────────────────────────────────────────
// If ALL Iranian sources fail simultaneously, it's likely an internet
// blackout rather than individual source issues. Switch to fallback mode.

export function detectIranBlackout(): boolean {
  const iranSources = REDUNDANCY_GROUPS.iranState;
  const allDown = iranSources.every((s) => isCircuitOpen(s));
  return allDown;
}

/**
 * Get recommended action based on current system health.
 */
export function getResilienceAction(): {
  action: "normal" | "degraded" | "blackout-mode" | "emergency";
  message: string;
} {
  const coverage = assessCoverage();
  const blackout = detectIranBlackout();

  if (blackout) {
    return {
      action: "blackout-mode",
      message: "All Iranian sources unreachable. Possible internet blackout. Using cached content + international sources only.",
    };
  }

  if (coverage.overallHealth === "critical") {
    return {
      action: "emergency",
      message: `Only ${coverage.healthyGroups}/${coverage.totalGroups} source groups healthy. ${coverage.offlineGroups.join(", ")} offline.`,
    };
  }

  if (coverage.overallHealth === "degraded") {
    return {
      action: "degraded",
      message: `Degraded groups: ${coverage.degradedGroups.join(", ")}. Using fallbacks.`,
    };
  }

  return {
    action: "normal",
    message: `${coverage.healthyGroups}/${coverage.totalGroups} groups healthy.`,
  };
}
