// ============================================================================
// SUPABASE DATA ACCESS — Read/write stories & news to the database
// Falls back gracefully to live RSS fetching when DB is unavailable.
// ============================================================================

import { getServiceClient, supabase } from "@/lib/supabase";
import { cacheImages } from "@/lib/image-cache";
import type { StoryData, PublishedArticle } from "@/lib/data";

// ── Read (public, uses anon key) ────────────────────────────────────────────

export async function getStoriesFromDB(): Promise<StoryData[] | null> {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(40);

  if (error || !data || data.length === 0) return null;

  // Sort: newest first, with image tiebreaker for same-day articles
  const mapped = data.map((row) => ({
    id: row.id,
    title: row.title,
    source: row.source,
    url: row.url,
    publishedAt: row.published_at,
    excerpt: row.excerpt,
    body: row.body,
    imageUrl: row.image_stored_path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${row.image_stored_path}`
      : row.image_url,
    theme: row.theme,
  }));
  return mapped.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    // Primary: newest first
    if (Math.abs(dateA - dateB) > 3600_000) return dateB - dateA;
    // Tiebreaker within 1h: prefer items with images
    return (a.imageUrl ? 0 : 1) - (b.imageUrl ? 0 : 1);
  });
}

export async function getNewsFromDB(): Promise<PublishedArticle[] | null> {
  const { data, error } = await supabase
    .from("news_articles")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(40);

  if (error || !data || data.length === 0) return null;

  // Sort: newest first, with image tiebreaker for same-day articles
  const mapped = data.map((row) => ({
    title: row.title,
    source: row.source,
    url: row.url,
    publishedAt: row.published_at,
    description: row.description,
    imageUrl: row.image_stored_path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${row.image_stored_path}`
      : row.image_url,
  }));
  return mapped.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    // Primary: newest first
    if (Math.abs(dateA - dateB) > 3600_000) return dateB - dateA;
    // Tiebreaker within 1h: prefer items with images
    return (a.imageUrl ? 0 : 1) - (b.imageUrl ? 0 : 1);
  });
}

// ── Write (server-only, uses service role key) ──────────────────────────────

export async function syncStoriesToDB(stories: StoryData[]): Promise<number> {
  const sb = getServiceClient();

  // Cache all images to Supabase Storage
  const imageUrls = stories.map((s) => s.imageUrl).filter(Boolean) as string[];
  const cachedMap = await cacheImages(imageUrls);

  const rows = stories.map((s) => {
    const hasImage = !!s.imageUrl;
    const base: Record<string, unknown> = {
      id: s.id,
      title: s.title,
      source: s.source,
      url: s.url,
      published_at: s.publishedAt,
      excerpt: s.excerpt,
      body: s.body,
      theme: s.theme || null,
      updated_at: new Date().toISOString(),
    };
    // Only overwrite image fields when we have a new image
    if (hasImage) {
      base.image_url = s.imageUrl;
      base.image_stored_path = extractPath(cachedMap.get(s.imageUrl!)) ?? null;
    }
    return base;
  });

  const { error, count } = await sb
    .from("stories")
    .upsert(rows, { onConflict: "url", count: "exact", ignoreDuplicates: false });

  if (error) {
    console.error("[sync] stories upsert failed:", error.message);
    return 0;
  }

  return count ?? rows.length;
}

export async function syncNewsToDB(articles: PublishedArticle[]): Promise<number> {
  const sb = getServiceClient();

  // Cache all images to Supabase Storage
  const imageUrls = articles.map((a) => a.imageUrl).filter(Boolean) as string[];
  const cachedMap = await cacheImages(imageUrls);

  const rows = articles.map((a) => {
    const hasImage = !!a.imageUrl;
    const base: Record<string, unknown> = {
      title: a.title,
      source: a.source,
      url: a.url,
      published_at: a.publishedAt,
      description: a.description,
    };
    // Only overwrite image fields when we have a new image
    if (hasImage) {
      base.image_url = a.imageUrl;
      base.image_stored_path = extractPath(cachedMap.get(a.imageUrl!)) ?? null;
    }
    return base;
  });

  const { error, count } = await sb
    .from("news_articles")
    .upsert(rows, { onConflict: "url", count: "exact", ignoreDuplicates: false });

  if (error) {
    console.error("[sync] news upsert failed:", error.message);
    return 0;
  }

  return count ?? rows.length;
}

/** Extract the storage path from a full Supabase Storage URL */
function extractPath(url: string | undefined): string | null {
  if (!url) return null;
  const marker = "/object/public/images/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

// ── Re-enrich existing articles missing images ──────────────────────────────

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Known site-wide logos that are NOT article-specific images */
const LOGO_PATTERNS = [
  /tass_logo/i, /site.*logo/i, /\blogo[_-]/i, /[_-]logo\b/i, /\/logo\./i,
  /default.*share/i, /meta[_-]photo/i, /placeholder/i, /favicon/i,
];

function isLogoUrl(url: string): boolean {
  return LOGO_PATTERNS.some((p) => p.test(url));
}

async function scrapeOgImageForEnrich(articleUrl: string): Promise<string | null> {
  try {
    const res = await fetch(articleUrl, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html,application/xhtml+xml" },
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
    const buf = new Uint8Array(totalBytes);
    let offset = 0;
    for (const c of chunks) { buf.set(c, offset); offset += c.byteLength; }
    const html = new TextDecoder().decode(buf);

    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/i);
    if (ogMatch?.[1] && !isLogoUrl(ogMatch[1])) {
      const url = ogMatch[1];
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
    }

    const twMatch =
      html.match(/<meta[^>]+(?:name|property)=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']twitter:image(?::src)?["']/i);
    if (twMatch?.[1] && !isLogoUrl(twMatch[1])) {
      const url = twMatch[1];
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Re-enrich existing DB articles/stories that have no image.
 * Called during sync to backfill images for articles that were first synced
 * without images (og:image scraping failed or article fell out of RSS before
 * enrichment succeeded). Processes up to `limit` articles per run.
 */
export async function reEnrichNewsImages(limit = 10): Promise<number> {
  const sb = getServiceClient();

  // Find articles without images, excluding Press TV (known timeout)
  const { data, error } = await sb
    .from("news_articles")
    .select("url")
    .is("image_url", null)
    .is("image_stored_path", null)
    .not("url", "like", "%presstv.ir%")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) return 0;

  const results = await Promise.allSettled(
    data.map((row) => scrapeOgImageForEnrich(row.url))
  );

  let enriched = 0;
  const imageUrls: string[] = [];
  const urlToImage = new Map<string, string>();

  for (let i = 0; i < data.length; i++) {
    const result = results[i];
    if (result?.status === "fulfilled" && result.value) {
      urlToImage.set(data[i].url, result.value);
      imageUrls.push(result.value);
    }
  }

  if (imageUrls.length === 0) return 0;

  // Cache images to Supabase Storage
  const cachedMap = await cacheImages(imageUrls);

  // Update each article with its found image
  for (const [articleUrl, imageUrl] of urlToImage) {
    const storedPath = extractPath(cachedMap.get(imageUrl)) ?? null;
    const { error: updateError } = await sb
      .from("news_articles")
      .update({ image_url: imageUrl, image_stored_path: storedPath })
      .eq("url", articleUrl);

    if (!updateError) enriched++;
  }

  if (enriched > 0) {
    console.log(`[re-enrich] Updated ${enriched} news articles with images`);
  }
  return enriched;
}

export async function reEnrichStoryImages(limit = 10): Promise<number> {
  const sb = getServiceClient();

  const { data, error } = await sb
    .from("stories")
    .select("url")
    .is("image_url", null)
    .is("image_stored_path", null)
    .not("url", "like", "%presstv.ir%")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) return 0;

  const results = await Promise.allSettled(
    data.map((row) => scrapeOgImageForEnrich(row.url))
  );

  let enriched = 0;
  const imageUrls: string[] = [];
  const urlToImage = new Map<string, string>();

  for (let i = 0; i < data.length; i++) {
    const result = results[i];
    if (result?.status === "fulfilled" && result.value) {
      urlToImage.set(data[i].url, result.value);
      imageUrls.push(result.value);
    }
  }

  if (imageUrls.length === 0) return 0;

  const cachedMap = await cacheImages(imageUrls);

  for (const [storyUrl, imageUrl] of urlToImage) {
    const storedPath = extractPath(cachedMap.get(imageUrl)) ?? null;
    const { error: updateError } = await sb
      .from("stories")
      .update({ image_url: imageUrl, image_stored_path: storedPath })
      .eq("url", storyUrl);

    if (!updateError) enriched++;
  }

  if (enriched > 0) {
    console.log(`[re-enrich] Updated ${enriched} stories with images`);
  }
  return enriched;
}
