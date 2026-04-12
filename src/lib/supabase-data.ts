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
