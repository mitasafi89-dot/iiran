// ============================================================================
// LIVE DATA FETCHING — Used exclusively by the sync process.
// Same logic as data.ts but without "use cache" so results are fresh.
// ============================================================================

import { reliefWebURL, APIs } from "@/lib/apis";
import { fetchAllSources, concatChunks } from "@/lib/news-fetchers";
import { runPipeline } from "@/lib/news-pipeline";
import { sanitizeExternalUrl } from "@/lib/security";
import { deduplicateArticles } from "@/lib/pipeline/dedup";
import { validateWithAI } from "@/lib/pipeline/ai-validation";
import { cacheSourceResult, getStaleArticles, getResilienceAction, detectIranBlackout } from "@/lib/pipeline/resilience";
import type { StoryData, PublishedArticle } from "@/lib/data";

// ── Reusable helpers (same as data.ts) ──────────────────────────────────────

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** CDN domains with structured URLs that reliably serve images */
const TRUSTED_IMAGE_CDNS = [
  "cdn.presstv.ir",
  "cdn-media.tass.ru",
  "media.tehrantimes.com",
  "static.presstv.ir",
  "cdnph.upi.com",
  "i.ytimg.com",
  "images.unsplash.com",
  "images.pexels.com",
];

function isTrustedImageCdn(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return TRUSTED_IMAGE_CDNS.some(
      (cdn) => hostname === cdn || hostname.endsWith(`.${cdn}`)
    );
  } catch {
    return false;
  }
}

async function verifyImageUrl(url: string): Promise<string | null> {
  if (isTrustedImageCdn(url)) return url;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
      headers: {
        "User-Agent": BROWSER_UA,
      },
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (ct.startsWith("image/")) return url;
    if (res.status === 200 && !ct.startsWith("text/")) return url;
    return null;
  } catch {
    return null;
  }
}

/** Known site-wide logos that are NOT article-specific images */
const LOGO_PATTERNS = [
  /tass_logo/i,
  /site.*logo/i,
  /\blogo[_-]/i,
  /[_-]logo\b/i,
  /\/logo\./i,
  /default.*share/i,
  /meta[_-]photo/i,
  /placeholder/i,
  /favicon/i,
  /apple-touch-icon/i,
];

function isLogoUrl(url: string): boolean {
  return LOGO_PATTERNS.some((p) => p.test(url));
}

async function scrapeOgImage(articleUrl: string): Promise<string | null> {
  try {
    const res = await fetch(articleUrl, {
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    const MAX = 80 * 1024;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      chunks.push(value);
      if (totalBytes >= MAX) { reader.cancel(); break; }
    }
    const html = new TextDecoder().decode(concatChunks(chunks, totalBytes));

    // 1. Try og:image
    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/i);
    if (ogMatch?.[1] && !isLogoUrl(ogMatch[1])) {
      const url = ogMatch[1];
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
    }

    // 2. Try twitter:image
    const twMatch =
      html.match(/<meta[^>]+(?:name|property)=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']twitter:image(?::src)?["']/i);
    if (twMatch?.[1] && !isLogoUrl(twMatch[1])) {
      const url = twMatch[1];
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
    }

    // 3. Fallback: first large article image
    const imgMatches = html.matchAll(
      /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["'][^>]*/gi
    );
    for (const m of imgMatches) {
      const src = m[1];
      if (isLogoUrl(src)) continue;
      if (/\b(?:icon|avatar|emoji|badge|sprite)\b/i.test(src)) continue;
      if (src.startsWith("data:")) continue;
      if (src.startsWith("http://") || src.startsWith("https://")) return src;
      try { return new URL(src, articleUrl).href; } catch { continue; }
    }

    return null;
  } catch {
    return null;
  }
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'");
}

async function enrichImages<T extends { imageUrl?: string; url: string }>(items: T[]): Promise<T[]> {
  const needsImage = items.filter((a) => !a.imageUrl);
  if (needsImage.length > 0) {
    const MAX_SCRAPE = 25;
    const toScrape = needsImage.slice(0, MAX_SCRAPE);
    const ogResults = await Promise.allSettled(toScrape.map((a) => scrapeOgImage(a.url)));
    let idx = 0;
    for (const item of items) {
      if (item.imageUrl) continue;
      if (idx < MAX_SCRAPE) {
        const result = ogResults[idx];
        if (result?.status === "fulfilled" && result.value) {
          item.imageUrl = result.value;
        }
      }
      idx++;
    }
  }
  const withUrls = items.filter((a) => a.imageUrl);
  const verifyResults = await Promise.allSettled(withUrls.map((a) => verifyImageUrl(a.imageUrl!)));
  for (let i = 0; i < withUrls.length; i++) {
    const result = verifyResults[i];
    if (!(result.status === "fulfilled" && result.value)) {
      withUrls[i].imageUrl = undefined;
    }
  }
  return items;
}

// ── Live story fetching ─────────────────────────────────────────────────────

export async function getStoriesLive(): Promise<StoryData[]> {
  const results = await Promise.allSettled([
    fetchTehranTimesStories(),
    fetchPressTVStories(),
    fetchReliefWebStories(),
  ]);

  const allStories: StoryData[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") allStories.push(...r.value);
  }

  allStories.sort((a, b) => {
    const imgA = a.imageUrl ? 1 : 0;
    const imgB = b.imageUrl ? 1 : 0;
    if (imgA !== imgB) return imgB - imgA;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const { unique } = deduplicateArticles(
    allStories.map((s) => ({ title: s.title, description: s.excerpt, url: s.url, _story: s }))
  );
  const deduped = unique.map((u) => (u as typeof u & { _story: StoryData })._story);
  const selected = deduped.slice(0, 40);
  const enriched = await enrichImages(selected);
  return enriched.filter((s) => !!s.imageUrl);
}

// ── Live news fetching ──────────────────────────────────────────────────────

export async function getNewsFeedLive(): Promise<PublishedArticle[]> {
  // Check system resilience
  const resilience = getResilienceAction();
  if (resilience.action !== "normal") {
    console.log(`[pipeline] Resilience: ${resilience.action} - ${resilience.message}`);
  }

  const { articles: rawArticles } = await fetchAllSources();

  // Cache successful source results for fallback (keyed by sourceId)
  const sourceMap = new Map<string, typeof rawArticles>();
  for (const article of rawArticles) {
    const existing = sourceMap.get(article.sourceId) || [];
    existing.push(article);
    sourceMap.set(article.sourceId, existing);
  }
  for (const [sourceId, arts] of sourceMap) {
    cacheSourceResult(sourceId, arts);
  }

  // If in blackout mode, supplement with cached Iranian source content
  let allRaw = rawArticles;
  if (detectIranBlackout()) {
    const iranSources = ["tehrantimes", "presstv", "mehrnews", "irna", "tasnim",
      "iranpress", "farsnews", "parstoday", "isna"];
    for (const src of iranSources) {
      const stale = getStaleArticles(src);
      if (stale) allRaw.push(...stale);
    }
  }

  const { unique } = deduplicateArticles(allRaw);
  const pipelineResult = runPipeline(unique, { threshold: 50, maxArticles: 40, includeReview: true });
  const allScored = [...pipelineResult.published, ...pipelineResult.reviewQueue].slice(0, 40);

  // AI validation layer (refines borderline scores, non-blocking)
  const aiValidated = await validateWithAI(allScored);
  const finalScored = aiValidated
    .filter((a) => a.tier === "publish" || a.tier === "review")
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 40);

  const mapped = finalScored.map((a) => ({
    title: a.title,
    source: a.source,
    url: sanitizeExternalUrl(a.url) || "#",
    publishedAt: a.publishedAt,
    description: a.description,
    imageUrl: a.imageUrl,
  }));

  const enriched = await enrichImages(mapped);
  return enriched.filter((a): a is typeof a & { imageUrl: string } => !!a.imageUrl);
}

// ── RSS Source Parsers ──────────────────────────────────────────────────────

async function fetchTehranTimesStories(): Promise<StoryData[]> {
  try {
    const res = await fetch("https://www.tehrantimes.com/rss", { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const xml = await res.text();
    const stories: StoryData[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(xml)) !== null) {
      const entry = match[1];
      const title = entry.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
      const link = entry.match(/<link>([^<]*)<\/link>/)?.[1]?.trim();
      const desc = entry.match(/<description>([^<]*)<\/description>/)?.[1]?.trim();
      const pubDate = entry.match(/<pubDate>([^<]*)<\/pubDate>/)?.[1]?.trim();
      const enclosure = entry.match(/<enclosure\s+url="([^"]+)"/)?.[1];
      if (!title || !link) continue;
      const bodyText = decodeXmlEntities(desc || "");
      stories.push({
        id: `tt-${link.split("/").pop() || Math.random().toString(36)}`,
        title: decodeXmlEntities(title),
        source: "Tehran Times",
        url: link,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        excerpt: bodyText.slice(0, 300) + (bodyText.length > 300 ? "..." : ""),
        body: bodyText.slice(0, 1500),
        imageUrl: enclosure || undefined,
        theme: "Iran",
      });
    }
    return stories;
  } catch { return []; }
}

async function fetchPressTVStories(): Promise<StoryData[]> {
  try {
    const res = await fetch("https://www.presstv.ir/rss.xml", { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const xml = await res.text();
    const stories: StoryData[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(xml)) !== null) {
      const entry = match[1];
      const title = entry.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
      const link = entry.match(/<link>([^<]*)<\/link>/)?.[1]?.trim();
      const desc = entry.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.trim();
      const enclosure = entry.match(/<enclosure\s+url="([^"]+)"/)?.[1];
      if (!title || !link) continue;
      const bodyText = decodeXmlEntities((desc || "").replace(/<[^>]*>/g, ""));
      const descImg = !enclosure ? desc?.match(/<img[^>]+src="([^"]+)"/)?.[1] : undefined;
      stories.push({
        id: `ptv-${link.match(/\/(\d{5,})\//)?.[1] || link.split("/").filter(Boolean).pop() || Math.random().toString(36).slice(2)}`,
        title: decodeXmlEntities(title),
        source: "Press TV",
        url: link,
        publishedAt: new Date().toISOString(),
        excerpt: bodyText.slice(0, 300) + (bodyText.length > 300 ? "..." : ""),
        body: bodyText.slice(0, 1500),
        imageUrl: enclosure || descImg,
        theme: "Iran",
      });
    }
    return stories;
  } catch { return []; }
}

async function fetchReliefWebStories(): Promise<StoryData[]> {
  try {
    const url = reliefWebURL(APIs.reliefWeb.endpoints.reports);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filter: {
          operator: "AND",
          conditions: [
            { field: "country.name", value: "Iran (Islamic Republic of)" },
            {
              field: "theme.name",
              operator: "OR",
              value: ["Health", "Protection and Human Rights", "Education", "Water Sanitation Hygiene", "Food and Nutrition", "Shelter and Non-Food Items", "Recovery and Reconstruction"],
            },
          ],
        },
        fields: {
          include: ["id", "title", "url_alias", "source.name", "date.original", "body", "theme.name", "file.url", "file.preview.url-large"],
        },
        sort: ["date.original:desc"],
        limit: 10,
      }),
    });
    if (!res.ok) return [];
    const json = await res.json();

    interface RWFields {
      id?: number; title?: string; url_alias?: string;
      source?: { name?: string }[]; date?: { original?: string };
      body?: string; theme?: { name?: string }[];
      file?: { url?: string; preview?: { "url-large"?: string } }[];
    }

    return (json.data || []).map((item: { id: string; fields: RWFields }) => {
      const f = item.fields;
      const bodyText = (f.body || "").replace(/<[^>]*>/g, "");
      let imageUrl: string | undefined;
      if (f.file?.[0]?.preview?.["url-large"]) imageUrl = f.file[0].preview["url-large"];
      else if (f.file?.[0]?.url?.match(/\.(jpg|jpeg|png|webp|gif)/i)) imageUrl = f.file[0].url;
      else {
        const embeddedImg = (f.body || "").match(/<img[^>]+src="([^"]+)"/);
        if (embeddedImg) imageUrl = embeddedImg[1];
      }
      return {
        id: item.id || String(f.id),
        title: f.title || "",
        source: f.source?.[0]?.name || "ReliefWeb",
        url: f.url_alias ? `https://reliefweb.int${f.url_alias}` : "https://reliefweb.int",
        publishedAt: f.date?.original || new Date().toISOString(),
        excerpt: bodyText.slice(0, 300).trim() + (bodyText.length > 300 ? "..." : ""),
        body: bodyText.slice(0, 1500).trim(),
        imageUrl,
        theme: f.theme?.[0]?.name || "Humanitarian",
      };
    });
  } catch { return []; }
}
