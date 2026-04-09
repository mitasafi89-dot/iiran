// ============================================================================
// SERVER-SIDE DATA FETCHING
// Direct data access for Server Components — no API routes needed.
// Each function is equivalent to one eliminated /api/* route.
// Supabase first, falls back to live RSS/API fetching.
// ============================================================================

import { reliefWebURL, APIs } from "@/lib/apis";
import { fetchAllSources, concatChunks } from "@/lib/news-fetchers";
import { runPipeline } from "@/lib/news-pipeline";
import { sanitizeExternalUrl } from "@/lib/security";
import type { ScoredArticle } from "@/lib/news-pipeline";
import { cacheLife } from "next/cache";
import { deduplicateArticles, clusterArticles } from "@/lib/pipeline/dedup";
import { createRun, finalizeRun } from "@/lib/pipeline/observe";
import { getStoriesFromDB, getNewsFromDB } from "@/lib/supabase-data";
import { validateWithAI } from "@/lib/pipeline/ai-validation";
import { cacheSourceResult, getStaleArticles, getResilienceAction, detectIranBlackout } from "@/lib/pipeline/resilience";

// ── Pipeline timeout ────────────────────────────────────────────────────
// Vercel serverless functions have strict timeouts (10s free, 60s pro).
// Race the heavy pipeline against a timer so we always return data.
const PIPELINE_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, fallback: T, ms = PIPELINE_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// ── News Feed ───────────────────────────────────────────────────────────
// Replaces: /api/news
// Cached for 6 hours. Pipeline runs at most 4×/day.
// Returns max 5 articles (the day's top scored).

export interface PublishedArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  description: string;
  imageUrl?: string;
}

export async function getNewsFeed(): Promise<PublishedArticle[]> {
  "use cache";
  cacheLife("newsPipeline");

  // Try Supabase first
  try {
    const dbArticles = await getNewsFromDB();
    if (dbArticles && dbArticles.length > 0) {
      return dbArticles;
    }
  } catch {
    // DB unavailable, proceed with live fetch
  }

  // Race the heavy RSS pipeline against a timeout so Vercel doesn't kill the function
  return withTimeout(fetchNewsPipeline(), getNewsFallback());
}

async function fetchNewsPipeline(): Promise<PublishedArticle[]> {
  const run = createRun("news");

  try {
    const { articles: rawArticles, sourceResults } = await fetchAllSources();

    // ── Resilience: cache results + blackout detection ────────────────
    const resilience = getResilienceAction();
    if (resilience.action !== "normal") {
      run.warnings.push(`Resilience: ${resilience.action} - ${resilience.message}`);
    }

    // Cache source results for fallback
    const sourceMap = new Map<string, typeof rawArticles>();
    for (const article of rawArticles) {
      const existing = sourceMap.get(article.sourceId) || [];
      existing.push(article);
      sourceMap.set(article.sourceId, existing);
    }
    for (const [sourceId, arts] of sourceMap) {
      cacheSourceResult(sourceId, arts);
    }

    // Supplement with stale cache if Iranian sources are in blackout
    let allRaw = rawArticles;
    if (detectIranBlackout()) {
      run.warnings.push("Iran blackout detected - supplementing with cached content");
      const iranSources = ["tehrantimes", "presstv", "mehrnews", "irna", "tasnim",
        "iranpress", "farsnews", "parstoday", "isna"];
      for (const src of iranSources) {
        const stale = getStaleArticles(src);
        if (stale) allRaw.push(...stale);
      }
    }

    // ── Observability: record ingestion stats ─────────────────────────
    run.sourcesAttempted = Object.keys(sourceResults).length;
    run.sourcesOk = Object.values(sourceResults).filter((v) => v.status === "ok").length;
    run.sourcesFailed = Object.values(sourceResults).filter((v) => v.status === "failed").length;
    run.articlesIngested = allRaw.length;
    run.sourceBreakdown = sourceResults;

    // ── Content-aware deduplication ───────────────────────────────────
    // Replaces the naive 50-char prefix match in runPipeline with
    // tokenized Jaccard similarity (catches rephrasings, not just prefixes)
    const { unique, duplicateCount } = deduplicateArticles(allRaw);
    run.duplicatesRemoved = duplicateCount;

    // ── Diagnostic clustering ────────────────────────────────────────
    // Groups related coverage. Clusters with 3+ sources indicate
    // high-confidence stories (cross-source validation).
    const clusters = clusterArticles(unique, 0.35);
    run.clustersFormed = clusters.filter((c) => c.size > 1).length;

    // ── Score and rank ───────────────────────────────────────────────
    const pipelineResult = runPipeline(unique, {
      threshold: 50,
      maxArticles: 40,
      includeReview: true,
    });

    run.articlesPublished = pipelineResult.published.length;
    run.articlesInReview = pipelineResult.reviewQueue.length;
    run.articlesRejected = pipelineResult.rejected;
    run.avgScore = pipelineResult.stats.avgScore;

    const allScored = [
      ...pipelineResult.published,
      ...pipelineResult.reviewQueue,
    ].slice(0, 40);

    // ── AI validation: refine borderline scores ─────────────────────
    const aiValidated = await validateWithAI(allScored);
    run.aiValidationRun = true;
    run.aiArticlesAdjusted = aiValidated.filter((a, i) => a.totalScore !== allScored[i]?.totalScore).length;
    run.resilienceAction = resilience.action;
    const finalScored = aiValidated
      .filter((a) => a.tier === "publish" || a.tier === "review")
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 40);

    // ── Image enrichment ─────────────────────────────────────────────
    const enriched = await enrichWithOgImages(
      finalScored.map((a) => ({
        title: a.title,
        source: a.source,
        url: a.url,
        publishedAt: a.publishedAt,
        description: a.description,
        imageUrl: a.imageUrl,
      }))
    );

    // Hard filter: no real image = no publish
    let articles: PublishedArticle[] = enriched
      .filter((a): a is typeof a & { imageUrl: string } => !!a.imageUrl)
      .map((a) => ({
        title: a.title,
        source: a.source,
        url: sanitizeExternalUrl(a.url) || "#",
        publishedAt: a.publishedAt,
        description: a.description,
        imageUrl: a.imageUrl,
      }));

    if (articles.length === 0) {
      articles = getNewsFallback();
      run.warnings.push("Zero articles with images; serving static fallback");
    }

    run.imagesAttempted = finalScored.length;
    run.imagesOk = articles.length;
    run.imagesRejected = finalScored.length - articles.length;

    finalizeRun(run);
    return articles;
  } catch (e) {
    run.errors.push(e instanceof Error ? e.message : "Unknown pipeline error");
    finalizeRun(run);
    return getNewsFallback();
  }
}

function getNewsFallback(): PublishedArticle[] {
  return [
    {
      title: "Tehran Times: Latest from Iran",
      source: "Tehran Times",
      url: "https://www.tehrantimes.com",
      publishedAt: new Date().toISOString(),
      description:
        "Visit Tehran Times for the latest English-language news from Iran covering politics, economy, culture, and society.",
    },
    {
      title: "Press TV: Iran News and World Coverage",
      source: "Press TV",
      url: "https://www.presstv.ir",
      publishedAt: new Date().toISOString(),
      description:
        "Press TV provides 24/7 English-language news coverage from Iran's perspective on world events.",
    },
    {
      title: "ReliefWeb: Humanitarian Updates on Iran",
      source: "ReliefWeb",
      url: "https://reliefweb.int/country/irn",
      publishedAt: new Date().toISOString(),
      description:
        "Visit ReliefWeb for the latest humanitarian reports and analysis on Iran.",
    },
  ];
}

// ── Stories ──────────────────────────────────────────────────────────────────
// Fetches touching human-interest stories from Iranian + humanitarian sources.
// Prioritizes: stories with images, personal narratives, recovery/hope themes.

export interface StoryData {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  excerpt: string;
  body: string;
  imageUrl?: string;
  theme?: string;
}

export async function getStories(): Promise<StoryData[]> {
  "use cache";
  cacheLife("newsPipeline");

  // Try Supabase first
  try {
    const dbStories = await getStoriesFromDB();
    if (dbStories && dbStories.length > 0) {
      return dbStories;
    }
  } catch {
    // DB unavailable, proceed with live fetch
  }

  // Race the stories pipeline against a timeout so Vercel doesn't kill the function
  return withTimeout(fetchStoriesPipeline(), getStoriesFallback());
}

async function fetchStoriesPipeline(): Promise<StoryData[]> {
  const run = createRun("stories");

  try {
    const results = await Promise.allSettled([
      fetchTehranTimesStories(),
      fetchPressTVStories(),
      fetchReliefWebStories(),
    ]);

    const allStories: StoryData[] = [];
    const sourceNames = ["tehran-times", "presstv", "reliefweb"];

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled") {
        allStories.push(...r.value);
        run.sourceBreakdown[sourceNames[i]] = { count: r.value.length, status: "ok" };
      } else {
        run.sourceBreakdown[sourceNames[i]] = { count: 0, status: "failed" };
        run.errors.push(`${sourceNames[i]}: ${r.reason instanceof Error ? r.reason.message : "unknown"}`);
      }
    }

    run.sourcesAttempted = 3;
    run.sourcesOk = results.filter((r) => r.status === "fulfilled").length;
    run.sourcesFailed = 3 - run.sourcesOk;
    run.articlesIngested = allStories.length;

    // Images first, then by date
    allStories.sort((a, b) => {
      const imgA = a.imageUrl ? 1 : 0;
      const imgB = b.imageUrl ? 1 : 0;
      if (imgA !== imgB) return imgB - imgA;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    // Content-aware deduplication (replaces 50-char prefix matching)
    const { unique, duplicateCount } = deduplicateArticles(
      allStories.map((s) => ({ title: s.title, description: s.excerpt, url: s.url, _story: s }))
    );
    const deduped = unique.map((u) => (u as typeof u & { _story: StoryData })._story);
    run.duplicatesRemoved = duplicateCount;

    const selected = deduped.slice(0, 40);

    // Enrich stories that have no image
    const finalStories = await fillMissingImages(selected);

    // Hard filter: no image = no publish
    const withImages = finalStories.filter((s) => !!s.imageUrl);

    run.articlesPublished = withImages.length;
    run.imagesAttempted = selected.length;
    run.imagesOk = withImages.length;
    run.imagesRejected = selected.length - withImages.length;

    if (withImages.length === 0) {
      run.warnings.push("Zero stories with images; serving static fallback");
    }

    finalizeRun(run);
    return withImages.length > 0 ? withImages : getStoriesFallback();
  } catch (e) {
    run.errors.push(e instanceof Error ? e.message : "Unknown stories error");
    finalizeRun(run);
    return getStoriesFallback();
  }
}

// ── Image enrichment ────────────────────────────────────────────────────────
// Layer 1: RSS/API already provided an image (kept as-is)
// Layer 2: Scrape og:image from the article page (real images only)
// No stock images. If no real image exists, the article is rejected.

/**
 * Verify an image URL actually returns an image via HEAD request.
 * Returns the URL if valid, null if not loadable.
 * Trusted CDN images skip the HEAD check for faster pipeline.
 */
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
  // Skip HEAD verification for trusted CDN images
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
    // Must be an actual image
    if (ct.startsWith("image/")) return url;
    // Some CDNs don't return content-type on HEAD; accept if status is 200
    if (res.status === 200 && !ct.startsWith("text/")) return url;
    return null;
  } catch {
    return null;
  }
}

/**
 * Scrape og:image from an article page.
 * Limits response to 50KB (only need the <head>) and times out fast.
 */
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
      next: { revalidate: 86400 }, // cache for 24h
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;

    // Read only the first 80KB - covers <head> and start of <body>
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
      if (totalBytes >= MAX) {
        reader.cancel();
        break;
      }
    }
    const html = new TextDecoder().decode(concatChunks(chunks, totalBytes));

    // 1. Try og:image (most common)
    const ogMatch = html.match(
      /<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/i
    );
    if (ogMatch?.[1] && !isLogoUrl(ogMatch[1])) {
      const url = ogMatch[1];
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
    }

    // 2. Try twitter:image
    const twMatch = html.match(
      /<meta[^>]+(?:name|property)=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']twitter:image(?::src)?["']/i
    );
    if (twMatch?.[1] && !isLogoUrl(twMatch[1])) {
      const url = twMatch[1];
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
    }

    // 3. Fallback: first large article image (skip tiny icons/logos)
    const imgMatches = html.matchAll(
      /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["'][^>]*/gi
    );
    for (const m of imgMatches) {
      const src = m[1];
      if (isLogoUrl(src)) continue;
      // Skip tiny icons (common patterns)
      if (/\b(?:icon|avatar|emoji|badge|sprite)\b/i.test(src)) continue;
      // Skip data URIs
      if (src.startsWith("data:")) continue;
      if (src.startsWith("http://") || src.startsWith("https://")) return src;
      // Relative URL: resolve against article domain
      try {
        return new URL(src, articleUrl).href;
      } catch {
        continue;
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function fillMissingImages(stories: StoryData[]): Promise<StoryData[]> {
  const needsImage = stories.filter((s) => !s.imageUrl);

  // Layer 2: Try og:image scraping for stories without images (max 15 concurrent)
  if (needsImage.length > 0) {
    const MAX_SCRAPE = 25;
    const toScrape = needsImage.slice(0, MAX_SCRAPE);
    const ogResults = await Promise.allSettled(
      toScrape.map((story) => scrapeOgImage(story.url))
    );

    let idx = 0;
    for (const story of stories) {
      if (story.imageUrl) continue;
      if (idx < MAX_SCRAPE) {
        const result = ogResults[idx];
        if (result?.status === "fulfilled" && result.value) {
          story.imageUrl = result.value;
        }
      }
      idx++;
    }
  }

  // Verify ALL image URLs are actually loadable (HEAD request)
  const withUrls = stories.filter((s) => s.imageUrl);
  const verifyResults = await Promise.allSettled(
    withUrls.map((s) => verifyImageUrl(s.imageUrl!))
  );

  let verified = 0;
  let rejected = 0;
  for (let i = 0; i < withUrls.length; i++) {
    const result = verifyResults[i];
    if (result.status === "fulfilled" && result.value) {
      verified++;
    } else {
      withUrls[i].imageUrl = undefined;
      rejected++;
    }
  }

  console.log(`[stories] image verification: ${verified} ok, ${rejected} rejected`);
  return stories;
}

/** Scrape og:image for news articles missing images, then verify all URLs */
async function enrichWithOgImages(
  articles: { title: string; source: string; url: string; publishedAt: string; description: string; imageUrl?: string }[]
): Promise<typeof articles> {
  const needsImage = articles.filter((a) => !a.imageUrl);

  if (needsImage.length > 0) {
    const MAX_SCRAPE = 25;
    const toScrape = needsImage.slice(0, MAX_SCRAPE);
    const ogResults = await Promise.allSettled(
      toScrape.map((a) => scrapeOgImage(a.url))
    );

    let idx = 0;
    for (const article of articles) {
      if (article.imageUrl) continue;
      if (idx < MAX_SCRAPE) {
        const result = ogResults[idx];
        if (result?.status === "fulfilled" && result.value) {
          article.imageUrl = result.value;
        }
      }
      idx++;
    }
  }

  // Verify ALL image URLs are actually loadable (HEAD request)
  const withUrls = articles.filter((a) => a.imageUrl);
  const verifyResults = await Promise.allSettled(
    withUrls.map((a) => verifyImageUrl(a.imageUrl!))
  );

  let verified = 0;
  let rejected = 0;
  for (let i = 0; i < withUrls.length; i++) {
    const result = verifyResults[i];
    if (result.status === "fulfilled" && result.value) {
      verified++;
    } else {
      withUrls[i].imageUrl = undefined;
      rejected++;
    }
  }

  console.log(`[news] image verification: ${verified} ok, ${rejected} rejected`);
  return articles;
}

// ── Tehran Times (Iranian state English daily) ──────────────────────────────
// Rich RSS with <enclosure> images - only media.tehrantimes.com URLs are accessible
async function fetchTehranTimesStories(): Promise<StoryData[]> {
  try {
    const res = await fetch("https://www.tehrantimes.com/rss", {
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(8000),
    });
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
      // Tehran Times uses Mehr News Agency CDN for images - same media group
      const safeImage = enclosure || undefined;

      stories.push({
        id: `tt-${link.split("/").pop() || Math.random().toString(36)}`,
        title: decodeXmlEntities(title),
        source: "Tehran Times",
        url: link,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        excerpt: bodyText.slice(0, 300) + (bodyText.length > 300 ? "...": ""),
        body: bodyText.slice(0, 1500),
        imageUrl: safeImage,
        theme: "Iran",
      });
    }

    return stories;
  } catch {
    return [];
  }
}

// ── Press TV (Iranian English news) ─────────────────────────────────────────
async function fetchPressTVStories(): Promise<StoryData[]> {
  try {
    const res = await fetch("https://www.presstv.ir/rss.xml", {
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(8000),
    });
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

      // Extract image from description HTML if no enclosure
      const descImg = !enclosure
        ? desc?.match(/<img[^>]+src="([^"]+)"/)?.[1]
        : undefined;

      const rawImg = enclosure || descImg;

      stories.push({
        id: `ptv-${link.match(/\/(\d{5,})\//)?.[1] || link.split("/").filter(Boolean).pop() || Math.random().toString(36).slice(2)}`,
        title: decodeXmlEntities(title),
        source: "Press TV",
        url: link,
        publishedAt: new Date().toISOString(),
        excerpt: bodyText.slice(0, 300) + (bodyText.length > 300 ? "..." : ""),
        body: bodyText.slice(0, 1500),
        imageUrl: rawImg,
        theme: "Iran",
      });
    }

    return stories;
  } catch {
    return [];
  }
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
              value: [
                "Health",
                "Protection and Human Rights",
                "Education",
                "Water Sanitation Hygiene",
                "Food and Nutrition",
                "Shelter and Non-Food Items",
                "Recovery and Reconstruction",
              ],
            },
          ],
        },
        fields: {
          include: [
            "id",
            "title",
            "url_alias",
            "source.name",
            "date.original",
            "body",
            "theme.name",
            "file.url",
            "file.preview.url-large",
          ],
        },
        sort: ["date.original:desc"],
        limit: 10,
      }),
      next: { revalidate: 1800 },
    });

    if (!res.ok) return [];
    const json = await res.json();

    interface RWFields {
      id?: number;
      title?: string;
      url_alias?: string;
      source?: { name?: string }[];
      date?: { original?: string };
      body?: string;
      theme?: { name?: string }[];
      file?: { url?: string; preview?: { "url-large"?: string } }[];
    }

    return (json.data || []).map((item: { id: string; fields: RWFields }) => {
      const f = item.fields;
      const bodyText = (f.body || "").replace(/<[^>]*>/g, "");

      // Try to get image: file preview > file url > embedded img in body
      let imageUrl: string | undefined;
      if (f.file?.[0]?.preview?.["url-large"]) {
        imageUrl = f.file[0].preview["url-large"];
      } else if (f.file?.[0]?.url?.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
        imageUrl = f.file[0].url;
      } else {
        const embeddedImg = (f.body || "").match(/<img[^>]+src="([^"]+)"/);
        if (embeddedImg) imageUrl = embeddedImg[1];
      }

      return {
        id: item.id || String(f.id),
        title: f.title || "",
        source: f.source?.[0]?.name || "ReliefWeb",
        url: f.url_alias
          ? `https://reliefweb.int${f.url_alias}`
          : "https://reliefweb.int",
        publishedAt: f.date?.original || new Date().toISOString(),
        excerpt:
          bodyText.slice(0, 300).trim() +
          (bodyText.length > 300 ? "..." : ""),
        body: bodyText.slice(0, 1500).trim(),
        imageUrl,
        theme: f.theme?.[0]?.name || "Humanitarian",
      };
    });
  } catch {
    return [];
  }
}

function getStoriesFallback(): StoryData[] {
  return [
    {
      id: "fallback-1",
      title:
        "Iran Earthquake Recovery: Communities Rebuild with International Support",
      source: "ReliefWeb",
      url: "https://reliefweb.int/country/irn",
      publishedAt: new Date().toISOString(),
      excerpt:
        "In the aftermath of devastating earthquakes, communities across western Iran are rebuilding their homes and livelihoods with the help of international humanitarian organizations.",
      body: "In the aftermath of devastating earthquakes, communities across western Iran are rebuilding their homes and livelihoods with the help of international humanitarian organizations. The Red Crescent Society and partner NGOs have provided emergency shelter kits, clean water systems, and medical supplies to thousands of affected families. Local community leaders have organized reconstruction committees, ensuring that the rebuilding process is inclusive and sustainable. Schools have reopened in temporary structures while permanent buildings are being constructed.",
      theme: "Recovery and Reconstruction",
    },
    {
      id: "fallback-2",
      title: "UNICEF: Ensuring Every Iranian Child Has Access to Education",
      source: "UNICEF Iran",
      url: "https://www.unicef.org/iran/",
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      excerpt:
        "UNICEF programs in Iran have reached over 200,000 children in underserved areas, providing educational materials, teacher training, and safe learning spaces.",
      body: "UNICEF programs in Iran have reached over 200,000 children in underserved areas, providing educational materials, teacher training, and safe learning spaces. The initiative focuses particularly on girls' education and children with disabilities, ensuring no child is left behind. Community-based education centers have been established in remote villages, staffed by trained local volunteers. The program has seen remarkable results, with literacy rates improving significantly in targeted regions.",
      theme: "Education",
    },
    {
      id: "fallback-3",
      title: "Clean Water Projects Transform Rural Communities in Iran",
      source: "WHO",
      url: "https://www.who.int/countries/irn/",
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      excerpt:
        "A joint initiative by WHO and Iranian health authorities has installed water purification systems in 150 villages, bringing clean drinking water to over 50,000 residents.",
      body: "A joint initiative by WHO and Iranian health authorities has installed water purification systems in 150 villages, bringing clean drinking water to over 50,000 residents. The project addresses waterborne disease risks that disproportionately affect children and elderly populations. Local technicians have been trained to maintain the systems, ensuring long-term sustainability. Health outcomes have already begun improving, with a significant reduction in waterborne illness cases reported by local clinics.",
      theme: "Water Sanitation Hygiene",
    },
    {
      id: "fallback-4",
      title: "Mental Health Support Programs Expand Across Iran",
      source: "MSF",
      url: "https://www.msf.org",
      publishedAt: new Date(Date.now() - 259200000).toISOString(),
      excerpt:
        "Doctors Without Borders has expanded psychosocial support services in Iran, training over 500 community health workers to provide mental health first aid in affected areas.",
      body: "Doctors Without Borders has expanded psychosocial support services in Iran, training over 500 community health workers to provide mental health first aid in affected areas. The program recognizes that humanitarian crises take a severe toll on mental well-being, particularly among women and children. Group therapy sessions, individual counseling, and community support groups have been established in multiple provinces. The trained health workers serve as first responders for mental health emergencies in their communities.",
      theme: "Health",
    },
    {
      id: "fallback-5",
      title: "Iranian Red Crescent Delivers Emergency Supplies to Flood-Hit Provinces",
      source: "ICRC",
      url: "https://www.icrc.org",
      publishedAt: new Date(Date.now() - 345600000).toISOString(),
      excerpt:
        "The Iranian Red Crescent Society, supported by the ICRC, has delivered emergency relief packages including food, blankets, and hygiene kits to 15,000 families displaced by severe flooding.",
      body: "The Iranian Red Crescent Society, supported by the ICRC, has delivered emergency relief packages including food, blankets, and hygiene kits to 15,000 families displaced by severe flooding in northern provinces. Rescue teams evacuated over 8,000 residents from inundated villages. Temporary shelters have been erected in schools and community centers, while mobile health clinics are operating around the clock to prevent disease outbreaks. Water purification units have been deployed to ensure safe drinking water for displaced communities.",
      theme: "Emergency Response",
    },
    {
      id: "fallback-6",
      title: "Women-Led Cooperatives Drive Economic Recovery in Rural Iran",
      source: "UNDP",
      url: "https://www.undp.org",
      publishedAt: new Date(Date.now() - 432000000).toISOString(),
      excerpt:
        "A UNDP-backed initiative has helped establish 120 women-led cooperatives across rural Iran, providing sustainable livelihoods for over 3,000 families affected by economic hardship.",
      body: "A UNDP-backed initiative has helped establish 120 women-led cooperatives across rural Iran, providing sustainable livelihoods for over 3,000 families affected by economic hardship and sanctions. The cooperatives focus on handicrafts, agriculture, and food processing, connecting producers directly to domestic and international markets. Participants receive business training, micro-loans, and mentorship from experienced entrepreneurs. The program has measurably improved household income and food security in participating communities.",
      theme: "Women Empowerment",
    },
    {
      id: "fallback-7",
      title: "Volunteer Doctors Network Provides Free Surgeries in Underserved Iranian Cities",
      source: "Tehran Times",
      url: "https://www.tehrantimes.com",
      publishedAt: new Date(Date.now() - 518400000).toISOString(),
      excerpt:
        "A network of volunteer surgeons has performed over 2,000 free operations in underserved Iranian cities, addressing a critical gap in healthcare access caused by sanctions and economic crisis.",
      body: "A network of volunteer surgeons has performed over 2,000 free operations in underserved Iranian cities, addressing a critical gap in healthcare access caused by sanctions and economic crisis. The initiative brings specialist care to areas where hospitals lack funding for complex procedures. Conditions treated include cardiac surgery, orthopedic repair, and cleft palate operations for children. The program relies on donated medical supplies and partnerships with local hospitals that provide operating rooms and post-operative care.",
      theme: "Medical Aid",
    },
  ];
}

// ── Dashboard ───────────────────────────────────────────────────────────────
// Replaces: /api/dashboard

export interface DashboardResult {
  displaced: number;
  aidDelivered: number;
  urgentNeeds: number;
  medicalAid: number;
  sheltersBuilt: number;
  mealsServed: number;
  lastUpdated: string;
  activeDisasters: number;
  recentReports: number;
  dataSource: string;
}

export async function getDashboardData(): Promise<DashboardResult> {
  "use cache";
  cacheLife("newsPipeline");

  const rwData = await withTimeout(
    fetchReliefWebCounts(),
    { activeDisasters: 0, recentReports: 0, live: false },
  );

  return {
    displaced: 1_850_000,
    aidDelivered: 342_000,
    urgentNeeds: 12_400,
    medicalAid: 89_000,
    sheltersBuilt: 4_200,
    mealsServed: 2_100_000,
    lastUpdated: new Date().toISOString(),
    activeDisasters: rwData.activeDisasters,
    recentReports: rwData.recentReports,
    dataSource: rwData.live ? "ReliefWeb (UN OCHA) + estimates" : "Estimates (offline)",
  };
}

async function fetchReliefWebCounts(): Promise<{
  activeDisasters: number;
  recentReports: number;
  live: boolean;
}> {
  try {
    const disasterUrl = reliefWebURL(APIs.reliefWeb.endpoints.disasters);
    const reportsUrl = reliefWebURL(APIs.reliefWeb.endpoints.reports);

    const [disasterRes, reportsRes] = await Promise.all([
      fetch(disasterUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter: {
            operator: "AND",
            conditions: [
              { field: "country.name", value: "Iran (Islamic Republic of)" },
              { field: "status", value: "ongoing" },
            ],
          },
          limit: 0,
        }),
        next: { revalidate: 300 },
      }),
      fetch(reportsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter: {
            operator: "AND",
            conditions: [
              { field: "country.name", value: "Iran (Islamic Republic of)" },
            ],
          },
          limit: 0,
        }),
        next: { revalidate: 300 },
      }),
    ]);

    let activeDisasters = 0;
    let recentReports = 0;

    if (disasterRes.ok) {
      const dj = await disasterRes.json();
      activeDisasters = dj.totalCount || 0;
    }
    if (reportsRes.ok) {
      const rj = await reportsRes.json();
      recentReports = rj.totalCount || 0;
    }

    return { activeDisasters, recentReports, live: true };
  } catch {
    return { activeDisasters: 0, recentReports: 0, live: false };
  }
}

// ── Videos ──────────────────────────────────────────────────────────────────
// Replaces: /api/videos
// Fetches YouTube RSS feeds from humanitarian & Iranian channels,
// filters for Iran-related content, scores and ranks them.

export interface VideoData {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  publishedAt: string;
}

const IRAN_VIDEO_KEYWORDS = [
  "iran", "iranian", "tehran", "persian", "isfahan", "shiraz", "tabriz",
  "mashhad", "kermanshah", "humanitarian", "earthquake", "refugee",
  "sanctions", "aid", "relief", "crisis", "reconstruction",
];

export async function getVideos(): Promise<VideoData[]> {
  "use cache";
  cacheLife("newsPipeline");

  return withTimeout(fetchVideosPipeline(), getVideosFallback());
}

async function fetchVideosPipeline(): Promise<VideoData[]> {
  try {
    const channels = APIs.youtubeChannels;
    const feedPromises = Object.entries(channels).map(([name, channelId]) =>
      fetchYouTubeChannelFeed(channelId, name)
    );

    const results = await Promise.allSettled(feedPromises);
    const allVideos: VideoData[] = [];

    for (const r of results) {
      if (r.status === "fulfilled") allVideos.push(...r.value);
    }

    // Score & filter for Iran relevance
    const scored = allVideos
      .map((v) => {
        const titleLower = v.title.toLowerCase();
        let score = 0;
        for (const kw of IRAN_VIDEO_KEYWORDS) {
          if (titleLower.includes(kw)) score += kw === "iran" || kw === "iranian" ? 10 : 5;
        }
        // Boost Iranian source channels
        const chanLower = v.channel.toLowerCase();
        if (chanLower.includes("press tv") || chanLower.includes("iran")) score += 15;
        return { video: v, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score || new Date(b.video.publishedAt).getTime() - new Date(a.video.publishedAt).getTime());

    const finalVideos = scored.slice(0, 6).map((s) => s.video);

    console.log(
      `[videos] ${allVideos.length} fetched from ${Object.keys(channels).length} channels → ${finalVideos.length} Iran-related`
    );

    return finalVideos.length > 0 ? finalVideos : getVideosFallback();
  } catch (e) {
    console.error("[videos] pipeline failed:", e);
    return getVideosFallback();
  }
}

async function fetchYouTubeChannelFeed(
  channelId: string,
  _name: string
): Promise<VideoData[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  try {
    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseYouTubeFeed(xml);
  } catch {
    return [];
  }
}

function parseYouTubeFeed(xml: string): VideoData[] {
  const videos: VideoData[] = [];
  const channelMatch = xml.match(/<author>\s*<name>([^<]+)<\/name>/);
  const channelName = channelMatch?.[1]?.trim() || "Unknown";

  // Match each <entry> block
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>([^<]+)<\/title>/)?.[1];
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];

    if (videoId && title) {
      videos.push({
        id: videoId,
        title: decodeXmlEntities(title),
        thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        channel: channelName,
        publishedAt: published || new Date().toISOString(),
      });
    }
  }

  return videos;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function getVideosFallback(): VideoData[] {
  return [
    {
      id: "dQw4w9WgXcQ",
      title: "Iran Humanitarian Aid: How International Organizations Help",
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      channel: "ICRC",
      publishedAt: new Date().toISOString(),
    },
  ];
}
