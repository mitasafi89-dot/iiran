/**
 * Check which RSS feeds provide images in their items.
 * Run: node scripts/check-rss-images.mjs
 */

const feeds = {
  // TIER 1: Iranian State
  "Tehran Times": "https://www.tehrantimes.com/rss",
  "Press TV": "https://www.presstv.ir/rss.xml",
  "Mehr News": "https://en.mehrnews.com/rss",
  "IRNA": "https://en.irna.ir/rss",
  "Tasnim": "https://www.tasnimnews.com/en/rss",
  "Iran Press": "https://iranpress.com/rss",
  "Fars News": "https://www.farsnews.ir/en/rss",
  "Pars Today": "https://parstoday.ir/en/rss",
  "ISNA": "https://en.isna.ir/rss",
  "Financial Tribune": "https://financialtribune.com/rss",
  "Khamenei.ir": "https://english.khamenei.ir/rss",
  "SHANA": "https://en.shana.ir/rss",

  // TIER 2a: Resistance Axis
  "Al Mayadeen": "https://english.almayadeen.net/rss",
  "The Cradle": "https://thecradle.co/rss",
  "MintPress": "https://www.mintpressnews.com/feed",
  "The Grayzone": "https://thegrayzone.com/feed",
  "Consortium News": "https://consortiumnews.com/feed",
  "Antiwar": "https://news.antiwar.com/feed",
  "Electronic Intifada": "https://electronicintifada.net/rss.xml",
  "Mondoweiss": "https://mondoweiss.net/feed",
  "Voltaire Network": "https://www.voltairenet.org/spip.php?page=backend&lang=en",

  // TIER 2b: Middle East
  "Al Jazeera": "https://www.aljazeera.com/xml/rss/all.xml",
  "Middle East Eye": "https://www.middleeasteye.net/rss",
  "Al-Monitor": "https://www.al-monitor.com/rss",
  "TRT World": "https://www.trtworld.com/rss",
  "Daily Sabah": "https://www.dailysabah.com/rssFeed/mideast",
  "Anadolu Agency": "https://www.aa.com.tr/en/rss/default?cat=world",
  "WAFA": "https://english.wafa.ps/RSS",
  "Gulf News": "https://gulfnews.com/rss/world",

  // TIER 2c: South Asia
  "Dawn": "https://www.dawn.com/feeds/home",
  "The News Intl": "https://www.thenews.com.pk/rss/1/1",
  "Express Tribune": "https://tribune.com.pk/feed/home",
  "Geo TV": "https://www.geo.tv/rss/1/0",
  "Times of India": "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
  "Hindustan Times": "https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml",
  "SCMP": "https://www.scmp.com/rss/91/feed",
  "Bernama": "https://www.bernama.com/en/rss/index.php",

  // TIER 2d: East Asia
  "CGTN": "https://www.cgtn.com/subscribe/rss/section/world.xml",
  "Xinhua": "http://www.xinhuanet.com/english/rss/worldrss.xml",
  "Global Times": "https://www.globaltimes.cn/rss/outbrain.xml",
  "China Daily": "https://www.chinadaily.com.cn/rss/world_rss.xml",
  "People's Daily": "http://en.people.cn/rss/World.xml",
  "TASS": "https://tass.com/rss/v2.xml",
  "RT": "https://www.rt.com/rss/news",
  "Sputnik": "https://sputnikglobe.com/export/rss2/archive/index.xml",

  // TIER 2e: Global South
  "teleSUR": "https://www.telesurenglish.net/rss/all.xml",
  "Prensa Latina": "https://www.plenglish.com/rss/all",

  // TIER 3: Humanitarian
  "UN News": "https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml",
  "ICRC": "https://www.icrc.org/en/rss",
  "ReliefWeb": "https://reliefweb.int/updates/rss.xml?search=Iran",
  "Amnesty": "https://www.amnesty.org/en/latest/news/feed/",
  "HRW": "https://www.hrw.org/rss/country_publications/iran",

  // TIER 4: Adversarial
  "Reuters": "https://www.reutersagency.com/feed",
  "BBC": "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml",
  "Guardian": "https://www.theguardian.com/world/iran/rss",
  "AP News": "https://rsshub.app/apnews/topics/world-news",
};

// Image detection patterns
const IMAGE_PATTERNS = [
  /<enclosure[^>]+url="([^"]+)"/gi,
  /<media:content[^>]+url="([^"]+)"/gi,
  /<media:thumbnail[^>]+url="([^"]+)"/gi,
  /<img[^>]+src=["']([^"']+)["']/gi,
  /<image>[^]*?<url>([^<]+)<\/url>/gi,
];

async function checkFeed(name, url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; IIRan-Bot/1.0)" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { name, url, status: `HTTP ${res.status}`, items: 0, withImage: 0, methods: [] };
    }

    const xml = await res.text();
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
    let withImage = 0;
    const methodsFound = new Set();

    for (const item of items.slice(0, 10)) {
      let hasImage = false;

      // Check enclosure
      if (/<enclosure[^>]+url="[^"]+"/i.test(item)) {
        hasImage = true;
        methodsFound.add("enclosure");
      }
      // Check media:content
      if (/<media:content[^>]+url="[^"]+"/i.test(item)) {
        hasImage = true;
        methodsFound.add("media:content");
      }
      // Check media:thumbnail
      if (/<media:thumbnail[^>]+url="[^"]+"/i.test(item)) {
        hasImage = true;
        methodsFound.add("media:thumbnail");
      }
      // Check img in description/content:encoded
      if (/<img[^>]+src=["'][^"']+["']/i.test(item)) {
        hasImage = true;
        methodsFound.add("img-in-desc");
      }
      // Check content:encoded for images
      const contentEncoded = item.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/)?.[1] || "";
      if (/<img[^>]+src=["'][^"']+["']/i.test(contentEncoded)) {
        hasImage = true;
        methodsFound.add("img-in-content");
      }

      if (hasImage) withImage++;
    }

    return {
      name,
      url,
      status: "OK",
      items: items.length,
      withImage,
      checked: Math.min(items.length, 10),
      methods: [...methodsFound],
    };
  } catch (err) {
    return {
      name,
      url,
      status: err.name === "AbortError" ? "TIMEOUT" : `ERROR: ${err.message?.slice(0, 50)}`,
      items: 0,
      withImage: 0,
      methods: [],
    };
  }
}

async function main() {
  console.log("Checking RSS feeds for image support...\n");

  const entries = Object.entries(feeds);
  // Run in batches of 8 to avoid overwhelming network
  const results = [];
  for (let i = 0; i < entries.length; i += 8) {
    const batch = entries.slice(i, i + 8);
    const batchResults = await Promise.all(
      batch.map(([name, url]) => checkFeed(name, url))
    );
    results.push(...batchResults);
    process.stdout.write(`  [${results.length}/${entries.length}]\r`);
  }

  // Categorize
  const hasImages = [];
  const noImages = [];
  const failed = [];

  for (const r of results) {
    if (r.status !== "OK") {
      failed.push(r);
    } else if (r.withImage > 0) {
      hasImages.push(r);
    } else {
      noImages.push(r);
    }
  }

  console.log("\n=== FEEDS WITH IMAGES ===");
  console.log(`(${hasImages.length} sources)\n`);
  for (const r of hasImages) {
    const pct = Math.round((r.withImage / r.checked) * 100);
    console.log(`  ✓ ${r.name.padEnd(22)} ${r.withImage}/${r.checked} items (${pct}%) via [${r.methods.join(", ")}]`);
  }

  console.log(`\n=== FEEDS WITHOUT IMAGES ===`);
  console.log(`(${noImages.length} sources — need og:image scraping)\n`);
  for (const r of noImages) {
    console.log(`  ✗ ${r.name.padEnd(22)} ${r.items} items, 0 images`);
  }

  console.log(`\n=== FAILED FEEDS ===`);
  console.log(`(${failed.length} sources)\n`);
  for (const r of failed) {
    console.log(`  ! ${r.name.padEnd(22)} ${r.status}`);
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total feeds: ${results.length}`);
  console.log(`With images: ${hasImages.length}`);
  console.log(`No images:   ${noImages.length}`);
  console.log(`Failed:      ${failed.length}`);
}

main();
