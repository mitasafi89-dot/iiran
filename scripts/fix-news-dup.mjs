import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

async function main() {
  const res = await fetch("https://www.presstv.ir", {
    signal: AbortSignal.timeout(10000),
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  const html = await res.text();

  const map = new Map();
  // Forward (bounded to 800 chars)
  for (const m of html.matchAll(/<a[^>]+href=["']?([^"'\s>]*\/Detail\/[^"'\s>]+)["']?[^>]*>[\s\S]{0,800}?<img[^>]+src=["']?(\/\/cdn\.presstv\.ir[^"'\s>]+)["']?/gi)) {
    const id = m[1].match(/\/(\d{5,})\//)?.[1];
    if (id && !map.has(id)) {
      let img = m[2];
      if (img.startsWith("//")) img = "https:" + img;
      img = img.replace(/\.s\.jpg$/, ".m.jpg");
      map.set(id, img);
    }
  }
  // Reverse (bounded to 800 chars)
  for (const m of html.matchAll(/<img[^>]+src=["']?(\/\/cdn\.presstv\.ir\/Photo[^"'\s>]+)["']?[\s\S]{0,800}?<a[^>]+href=["']?([^"'\s>]*\/Detail\/[^"'\s>]+)["']?/gi)) {
    const id = m[2].match(/\/(\d{5,})\//)?.[1];
    if (id && !map.has(id)) {
      let img = m[1];
      if (img.startsWith("//")) img = "https:" + img;
      img = img.replace(/\.s\.jpg$/, ".m.jpg");
      map.set(id, img);
    }
  }

  console.log("Image map entries:", map.size);
  console.log("764587 image:", map.get("764587"));
  console.log("764562 image:", map.get("764562"));

  // 764562 is a text-only link with no image on Press TV - clear wrong image
  const { error } = await sb
    .from("news_articles")
    .update({ image_url: null, image_stored_path: null })
    .ilike("url", "%764562%");
  if (error) console.log("DB update error:", error.message);
  else console.log("Cleared wrong image for article 764562");
}

main().catch(console.error);
