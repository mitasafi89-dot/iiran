/**
 * One-time script: fix all existing news_articles and stories without images.
 * Scrapes og:image for each, updates DB, and caches to Supabase Storage.
 *
 * Usage: node scripts/fix-news-images.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36";

const LOGO_PATTERNS = [
  /tass_logo/i, /site.*logo/i, /\blogo[_-]/i, /[_-]logo\b/i, /\/logo\./i,
  /default.*share/i, /meta[_-]photo/i, /placeholder/i, /favicon/i,
];

function isLogo(url) {
  return LOGO_PATTERNS.some((p) => p.test(url));
}

async function scrapeOgImage(articleUrl) {
  try {
    const res = await fetch(articleUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    const html = text.slice(0, 80000);

    // og:image
    const og =
      html.match(/<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/i);
    if (og?.[1] && !isLogo(og[1]) && og[1].startsWith("http")) return og[1];

    // twitter:image
    const tw =
      html.match(/<meta[^>]+(?:name|property)=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']twitter:image(?::src)?["']/i);
    if (tw?.[1] && !isLogo(tw[1]) && tw[1].startsWith("http")) return tw[1];

    return null;
  } catch {
    return null;
  }
}

// ── Press TV section page scraping ──────────────────────────────────────────

const PRESSTV_PAGES = [
  "https://www.presstv.ir",
  "https://www.presstv.ir/Section/10101",
  "https://www.presstv.ir/Section/10102",
  "https://www.presstv.ir/Section/10104",
  "https://www.presstv.ir/Section/10105",
  "https://www.presstv.ir/Section/10106",
  "https://www.presstv.ir/Section/13006",
  "https://www.presstv.ir/Section/10101/2",
  "https://www.presstv.ir/Section/10106/2",
  "https://www.presstv.ir/Section/10104/2",
  "https://www.presstv.ir/Section/13006/2",
  "https://www.presstv.ir/Section/13006/3",
  "https://www.presstv.ir/Section/10106/3",
];

async function scrapePressTVImageMap() {
  const map = new Map();
  const results = await Promise.allSettled(
    PRESSTV_PAGES.map((url) =>
      fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": UA, Accept: "text/html" },
      }).then((r) => (r.ok ? r.text() : ""))
    )
  );
  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value) continue;
    const html = r.value;
    for (const m of html.matchAll(/<a[^>]+href=["']?([^"'\s>]*\/Detail\/[^"'\s>]+)["']?[^>]*>[\s\S]{0,800}?<img[^>]+src=["']?(\/\/cdn\.presstv\.ir[^"'\s>]+)["']?/gi)) {
      const id = m[1].match(/\/(\d{5,})\//)?.[1];
      if (!id || map.has(id)) continue;
      let img = m[2];
      if (img.startsWith("//")) img = "https:" + img;
      img = img.replace(/\.s\.jpg$/, ".m.jpg");
      map.set(id, img);
    }
  }
  return map;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Fix Missing News Images ===\n");

  // 1. Get all articles missing images
  const { data: newsRows, error: newsErr } = await sb
    .from("news_articles")
    .select("url, source")
    .is("image_url", null)
    .is("image_stored_path", null)
    .order("published_at", { ascending: false });

  if (newsErr) { console.error("DB error:", newsErr.message); return; }
  console.log(`Found ${newsRows.length} news articles without images`);

  // 2. Get all stories missing images
  const { data: storyRows, error: storyErr } = await sb
    .from("stories")
    .select("url, source")
    .is("image_url", null)
    .is("image_stored_path", null)
    .order("published_at", { ascending: false });

  if (storyErr) { console.error("DB error:", storyErr.message); return; }
  console.log(`Found ${storyRows.length} stories without images\n`);

  // 3. Scrape Press TV section pages for image map
  console.log("Scraping Press TV section pages for image map...");
  const ptvMap = await scrapePressTVImageMap();
  console.log(`Press TV image map: ${ptvMap.size} article-image pairs\n`);

  // 4. Fix Press TV articles using section page map
  const ptvNews = newsRows.filter((r) => r.url.includes("presstv.ir"));
  const ptvStories = storyRows.filter((r) => r.url.includes("presstv.ir"));
  let ptvFixed = 0;

  for (const row of [...ptvNews, ...ptvStories]) {
    const id = row.url.match(/\/(\d{5,})\//)?.[1];
    if (!id) continue;
    const img = ptvMap.get(id);
    if (!img) continue;

    const table = ptvNews.includes(row) ? "news_articles" : "stories";
    const { error } = await sb
      .from(table)
      .update({ image_url: img })
      .eq("url", row.url);

    if (!error) {
      ptvFixed++;
      console.log(`  [PTV] ${table}: ${id} → ${img.slice(0, 60)}...`);
    }
  }
  console.log(`\nPress TV: fixed ${ptvFixed} articles\n`);

  // 5. Fix non-Press TV articles via og:image scraping
  const nonPtv = [
    ...newsRows.filter((r) => !r.url.includes("presstv.ir")).map((r) => ({ ...r, table: "news_articles" })),
    ...storyRows.filter((r) => !r.url.includes("presstv.ir")).map((r) => ({ ...r, table: "stories" })),
  ];

  console.log(`Scraping og:image for ${nonPtv.length} non-Press TV articles...`);

  // Process in batches of 10 to avoid overwhelming servers
  let ogFixed = 0;
  for (let i = 0; i < nonPtv.length; i += 10) {
    const batch = nonPtv.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map((r) => scrapeOgImage(r.url))
    );

    for (let j = 0; j < batch.length; j++) {
      const result = results[j];
      if (result?.status !== "fulfilled" || !result.value) {
        console.log(`  [MISS] ${batch[j].source}: ${batch[j].url.slice(0, 60)}`);
        continue;
      }

      const { error } = await sb
        .from(batch[j].table)
        .update({ image_url: result.value })
        .eq("url", batch[j].url);

      if (!error) {
        ogFixed++;
        console.log(`  [OK] ${batch[j].source}: ${result.value.slice(0, 60)}...`);
      }
    }
  }

  console.log(`\nog:image scraping: fixed ${ogFixed} articles`);
  console.log(`\n=== TOTAL: ${ptvFixed + ogFixed} articles fixed ===`);
}

main().catch(console.error);
