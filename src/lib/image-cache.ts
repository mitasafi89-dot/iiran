// ============================================================================
// IMAGE CACHING — Downloads external images to Supabase Storage
// Solves: hotlink protection, CDN blocks, broken external URLs
// ============================================================================

import { getServiceClient } from "@/lib/supabase";
import crypto from "crypto";

const BUCKET = "images";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Download an external image to Supabase Storage and return the public URL.
 * If the image is already cached, returns the cached URL immediately.
 */
export async function cacheImage(originalUrl: string): Promise<string | null> {
  const sb = getServiceClient();

  // Check if already cached
  const { data: existing } = await sb
    .from("cached_images")
    .select("stored_path")
    .eq("original_url", originalUrl)
    .maybeSingle();

  if (existing?.stored_path) {
    const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(existing.stored_path);
    return urlData.publicUrl;
  }

  // Download the image server-side
  let res: Response;
  try {
    res = await fetch(originalUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IIRanBot/1.0; +https://iiran.org)",
        Accept: "image/*",
      },
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const ct = res.headers.get("content-type") || "";
  if (!ct.startsWith("image/")) return null;

  const cl = res.headers.get("content-length");
  if (cl && parseInt(cl) > MAX_SIZE) return null;

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > MAX_SIZE || buffer.byteLength === 0) return null;

  // Determine extension from content-type
  const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : ct.includes("gif") ? "gif" : "jpg";
  const hash = crypto.createHash("sha256").update(new Uint8Array(buffer)).digest("hex").slice(0, 16);
  const storedPath = `${hash}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await sb.storage
    .from(BUCKET)
    .upload(storedPath, buffer, {
      contentType: ct,
      upsert: true,
    });

  if (uploadError) {
    console.error(`[image-cache] upload failed for ${originalUrl}:`, uploadError.message);
    return null;
  }

  // Record in cached_images table
  await sb.from("cached_images").upsert(
    {
      original_url: originalUrl,
      stored_path: storedPath,
      content_type: ct,
      size_bytes: buffer.byteLength,
      verified_at: new Date().toISOString(),
    },
    { onConflict: "original_url" }
  );

  const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(storedPath);
  return urlData.publicUrl;
}

/**
 * Cache multiple images in parallel (up to concurrency limit).
 * Returns a Map from original URL to cached public URL.
 */
export async function cacheImages(
  urls: string[],
  concurrency = 10
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const unique = [...new Set(urls.filter(Boolean))];

  for (let i = 0; i < unique.length; i += concurrency) {
    const batch = unique.slice(i, i + concurrency);
    const settled = await Promise.allSettled(batch.map((url) => cacheImage(url)));

    for (let j = 0; j < batch.length; j++) {
      const r = settled[j];
      if (r.status === "fulfilled" && r.value) {
        results.set(batch[j], r.value);
      }
    }
  }

  return results;
}

/**
 * Look up an already-cached image by original URL.
 * Returns the Supabase Storage public URL or null.
 */
export async function getCachedImageUrl(originalUrl: string): Promise<string | null> {
  const sb = getServiceClient();

  const { data } = await sb
    .from("cached_images")
    .select("stored_path")
    .eq("original_url", originalUrl)
    .maybeSingle();

  if (!data?.stored_path) return null;

  const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(data.stored_path);
  return urlData.publicUrl;
}
