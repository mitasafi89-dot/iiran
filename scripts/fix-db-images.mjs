// Directly update Supabase DB with images for all Press TV stories
// This fixes the DB NOW so production reads correct data immediately
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

function pressTVArticleId(path) {
  return path.match(/\/(\d{5,})\//)?.[1];
}

function extractPressTVImages(html, map) {
  for (const m of html.matchAll(/<a[^>]+href=["']?([^"'\s>]*\/Detail\/[^"'\s>]+)["']?[^>]*>[\s\S]*?<img[^>]+src=["']?(\/\/cdn\.presstv\.ir[^"'\s>]+)["']?/gi)) {
    const id = pressTVArticleId(m[1]);
    if (!id) continue;
    let imgUrl = m[2];
    if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;
    imgUrl = imgUrl.replace(/\.s\.jpg$/, ".m.jpg");
    if (!map.has(id)) map.set(id, imgUrl);
  }
  for (const m of html.matchAll(/<img[^>]+src=["']?(\/\/cdn\.presstv\.ir\/Photo[^"'\s>]+)["']?[\s\S]*?<a[^>]+href=["']?([^"'\s>]*\/Detail\/[^"'\s>]+)["']?/gi)) {
    const id = pressTVArticleId(m[2]);
    if (!id) continue;
    let imgUrl = m[1];
    if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;
    imgUrl = imgUrl.replace(/\.s\.jpg$/, ".m.jpg");
    if (!map.has(id)) map.set(id, imgUrl);
  }
}

async function main() {
  // Step 1: Get all Press TV stories with no image from DB
  console.log("Step 1: Fetching Press TV stories without images from DB...");
  const { data: stories, error } = await supabase
    .from("stories")
    .select("id, url, image_url, image_stored_path")
    .eq("source", "Press TV")
    .is("image_url", null)
    .limit(100);

  if (error) {
    console.error("DB query error:", error.message);
    return;
  }
  console.log(`Found ${stories.length} Press TV stories without images`);

  // Step 2: Build image map from section pages
  console.log("\nStep 2: Scraping Press TV section pages for images...");
  const imageMap = new Map();
  const results = await Promise.allSettled(
    PRESSTV_PAGES.map((url) =>
      fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": UA, Accept: "text/html" },
      }).then((r) => (r.ok ? r.text() : ""))
    )
  );
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) extractPressTVImages(r.value, imageMap);
  }
  console.log(`Image map: ${imageMap.size} entries`);

  // Step 3: Match and update
  console.log("\nStep 3: Updating DB...");
  let updated = 0;
  let notFound = 0;
  const notFoundList = [];

  for (const story of stories) {
    const artId = pressTVArticleId(story.url);
    if (!artId) continue;

    const imgUrl = imageMap.get(artId);
    if (!imgUrl) {
      notFound++;
      notFoundList.push(`  ${artId}: ${story.url.slice(0, 80)}`);
      continue;
    }

    const { error: updateError } = await supabase
      .from("stories")
      .update({ image_url: imgUrl, updated_at: new Date().toISOString() })
      .eq("id", story.id);

    if (updateError) {
      console.error(`  Failed to update ${story.id}: ${updateError.message}`);
    } else {
      updated++;
      console.log(`  Updated ${artId}: ${imgUrl.slice(0, 60)}...`);
    }
  }

  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`DONE: Updated ${updated}/${stories.length} stories`);
  console.log(`Not found in image map: ${notFound}`);
  if (notFoundList.length > 0) {
    console.log(`\nStories without matching image (too old for section pages):`);
    for (const line of notFoundList) console.log(line);
  }
}

main().catch(console.error);
