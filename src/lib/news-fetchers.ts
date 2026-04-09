// ============================================================================
// NEWS SOURCE FETCHERS
// Fetches articles from 20+ sources (APIs + RSS feeds)
// ============================================================================

import { APIs } from "./apis";
import { sanitizeExternalUrl } from "./security";
import type { RawArticle } from "./news-pipeline";
import { isCircuitOpen, recordSuccess, recordFailure } from "./pipeline/health";

// ── Memory-safe byte concatenation ─────────────────────────────────────────
// Replaces the O(n) spread-based approach that created enormous intermediate
// number[] arrays for multi-MB RSS payloads, risking OOM on large feeds.

export function concatChunks(chunks: Uint8Array[], totalLength: number): Uint8Array {
  if (chunks.length === 1) return chunks[0];
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

// ── RSS Parser Utility ─────────────────────────────────────────────────────

function parseRSSItems(xml: string, maxItems = 15): RSSItem[] {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  return items.slice(0, maxItems).map((item) => {
    const getTag = (tag: string) => {
      const cdataMatch = item.match(
        new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`)
      );
      if (cdataMatch) return cdataMatch[1].trim();
      const plainMatch = item.match(
        new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)
      );
      return plainMatch ? plainMatch[1].trim() : "";
    };
    const getAttr = (tag: string, attr: string) => {
      const match = item.match(new RegExp(`<${tag}[^>]+${attr}="([^"]+)"`));
      return match ? match[1] : "";
    };
    return {
      title: stripHTML(getTag("title")),
      link: getTag("link") || getTag("guid"),
      description: stripHTML(getTag("description")),
      pubDate: getTag("pubDate"),
      imageUrl:
        getAttr("enclosure", "url") ||
        getAttr("media:content", "url") ||
        getAttr("media:thumbnail", "url") ||
        extractImgSrc(item),
    };
  });
}

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  imageUrl: string;
}

function stripHTML(html: string): string {
  // First decode entities so we catch all tags
  let text = html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Strip all tags (handles attributes with > inside quoted values)
  text = text.replace(/<[^>]*?("[^"]*"|'[^']*')*[^>]*?>/g, "");
  // Fallback: remove anything that still looks like a tag
  text = text.replace(/<\/?[a-z][^]*?>/gi, "");
  return text.replace(/\s+/g, " ").trim();
}

/** Extract the first <img src="..."> from an RSS item's description or content:encoded */
function extractImgSrc(itemXml: string): string {
  const match = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || "";
}

// ── Generic RSS Fetcher ────────────────────────────────────────────────────

// Maximum RSS response body size (2MB) — prevents OOM from hostile feeds
const MAX_RSS_BODY_BYTES = 2 * 1024 * 1024;

async function fetchRSS(
  feedUrl: string,
  sourceId: string,
  sourceName: string,
  filterFn?: (item: RSSItem) => boolean
): Promise<RawArticle[]> {
  if (isCircuitOpen(sourceId)) return [];
  const t0 = Date.now();
  try {
    const res = await fetch(feedUrl, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) { recordFailure(sourceId); return []; }

    // Enforce body size limit before reading into memory
    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_RSS_BODY_BYTES) return [];

    const reader = res.body?.getReader();
    if (!reader) return [];
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_RSS_BODY_BYTES) {
        reader.cancel();
        return [];
      }
      chunks.push(value);
    }
    const text = new TextDecoder().decode(concatChunks(chunks, totalBytes));
    let items = parseRSSItems(text);

    if (filterFn) {
      items = items.filter(filterFn);
    }

    const articles = items
      .filter((item) => item.title.length > 10)
      .map((item) => ({
        title: item.title,
        description: item.description.slice(0, 500),
        source: sourceName,
        sourceId,
        url: sanitizeExternalUrl(item.link) || feedUrl,
        publishedAt: item.pubDate || new Date().toISOString(),
        imageUrl: sanitizeExternalUrl(item.imageUrl || "") || undefined,
      }));
    recordSuccess(sourceId, Date.now() - t0);
    return articles;
  } catch {
    recordFailure(sourceId);
    return [];
  }
}

// ── Google News RSS Proxy Fetcher ──────────────────────────────────────────
// Google News RSS wraps articles in redirect URLs. This fetcher extracts
// the real article URL from <source url="..."> and cleans the title.
async function fetchGoogleNewsRSS(
  feedUrl: string,
  sourceId: string,
  sourceName: string,
  filterFn?: (item: RSSItem) => boolean
): Promise<RawArticle[]> {
  if (isCircuitOpen(sourceId)) return [];
  const t0 = Date.now();
  try {
    const res = await fetch(feedUrl, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) { recordFailure(sourceId); return []; }
    const text = await res.text();
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];

    const parsed: RSSItem[] = items.slice(0, 20).map((item) => {
      const getTag = (tag: string) => {
        const cdataMatch = item.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
        if (cdataMatch) return cdataMatch[1].trim();
        const plainMatch = item.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
        return plainMatch ? plainMatch[1].trim() : "";
      };
      // Google News puts the real URL in <source url="...">
      const sourceUrlMatch = item.match(/<source[^>]+url="([^"]+)"/);
      const realUrl = sourceUrlMatch?.[1] || getTag("link") || getTag("guid");
      // Google News titles often end with " - Source Name"
      let title = stripHTML(getTag("title"));
      const dashIdx = title.lastIndexOf(" - ");
      if (dashIdx > 20) title = title.substring(0, dashIdx).trim();
      return {
        title,
        link: realUrl,
        description: stripHTML(getTag("description")),
        pubDate: getTag("pubDate"),
        imageUrl: "",
      };
    });

    let filtered = filterFn ? parsed.filter(filterFn) : parsed;

    const articles = filtered
      .filter((item) => item.title.length > 10)
      .map((item) => ({
        title: item.title,
        description: item.description.slice(0, 500),
        source: sourceName,
        sourceId,
        url: sanitizeExternalUrl(item.link) || feedUrl,
        publishedAt: item.pubDate || new Date().toISOString(),
        imageUrl: undefined as string | undefined,
      }));
    recordSuccess(sourceId, Date.now() - t0);
    return articles;
  } catch {
    recordFailure(sourceId);
    return [];
  }
}

// Iran-relevance filter for general feeds
const iranFilter = (item: RSSItem) => {
  const text = `${item.title} ${item.description}`.toLowerCase();
  return (
    text.includes("iran") ||
    text.includes("tehran") ||
    text.includes("persian") ||
    text.includes("hormuz") ||
    text.includes("pezeshkian") ||
    text.includes("khamenei") ||
    text.includes("araghchi") ||
    text.includes("irgc") ||
    text.includes("isfahan") ||
    text.includes("shiraz") ||
    text.includes("tabriz") ||
    text.includes("mashhad") ||
    text.includes("iranian") ||
    text.includes("strait of hormuz") ||
    text.includes("true promise") ||
    text.includes("resistance axis") ||
    text.includes("hezbollah") ||
    text.includes("axis of resistance")
  );
};

// Broader Middle East conflict filter (includes Iran-adjacent)
const meConflictFilter = (item: RSSItem) => {
  const text = `${item.title} ${item.description}`.toLowerCase();
  return (
    iranFilter(item) ||
    text.includes("middle east") ||
    text.includes("west asia") ||
    text.includes("us aggression") ||
    text.includes("zionist") ||
    text.includes("palestine") ||
    text.includes("lebanon") ||
    text.includes("sanctions") ||
    text.includes("multipolar") ||
    text.includes("brics")
  );
};

// ── Source Fetchers ────────────────────────────────────────────────────────

// === 1. Tehran Times (Iranian, English) ===
export function fetchTehranTimes(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.tehranTimes, "tehrantimes", "Tehran Times");
}

// === 2. Press TV (Iranian, English) ===
// Press TV RSS has 100+ items but ZERO images. Article pages time out (anti-bot).
// However, the homepage HTML is accessible and contains articles with CDN image URLs
// (cdn.presstv.ir/Photo/...). We scrape the homepage + RSS: homepage for images,
// RSS for the full article list, then merge by matching URL slugs.
export async function fetchPressTV(): Promise<RawArticle[]> {
  if (isCircuitOpen("presstv")) return [];
  const t0 = Date.now();
  try {
    // Fetch homepage HTML for image extraction
    const [homepageRes, rssArticles] = await Promise.allSettled([
      fetch("https://www.presstv.ir", {
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html",
        },
      }),
      fetchRSS(APIs.rssFeeds.pressTV, "presstv_rss", "Press TV"),
    ]);

    // Extract image map from homepage: article URL slug -> CDN image URL
    const imageMap = new Map<string, string>();
    if (homepageRes.status === "fulfilled" && homepageRes.value.ok) {
      const html = await homepageRes.value.text();
      // Press TV HTML uses unquoted attributes (href=/Detail/... src=//cdn...)
      // Match anchor+image pairs: <a ... href=/Detail/...> ... <img src=//cdn.presstv.ir/...>
      const linkImgRegex =
        /<a[^>]+href=["']?([^"'\s>]*\/Detail\/[^"'\s>]+)["']?[^>]*>[\s\S]*?<img[^>]+src=["']?(\/\/cdn\.presstv\.ir[^"'\s>]+)["']?/gi;
      let match: RegExpExecArray | null;
      while ((match = linkImgRegex.exec(html)) !== null) {
        const articlePath = match[1].replace(/^https?:\/\/[^/]+/, "");
        const imgUrl = `https:${match[2]}`;
        imageMap.set(articlePath, imgUrl);
      }

      // Second pass: also find CDN images that appear before their <a> tag
      // (some layout blocks put <img> then <a> for the same article)
      const imgLinkRegex =
        /<img[^>]+src=["']?(\/\/cdn\.presstv\.ir\/Photo[^"'\s>]+)["']?[\s\S]*?<a[^>]+href=["']?([^"'\s>]*\/Detail\/[^"'\s>]+)["']?/gi;
      while ((match = imgLinkRegex.exec(html)) !== null) {
        const articlePath = match[2].replace(/^https?:\/\/[^/]+/, "");
        if (!imageMap.has(articlePath)) {
          imageMap.set(articlePath, `https:${match[1]}`);
        }
      }

      // Also extract standalone articles from homepage as direct items
      // Press TV uses unquoted classes: class=topnews-title, class=news-title, etc.
      const titleRegex =
        /<div[^>]+class=["']?(?:topnews-title|news-title|normal-news-title)["']?[^>]*>([\s\S]*?)<\/div>/gi;
      let artMatch: RegExpExecArray | null;
      while ((artMatch = titleRegex.exec(html)) !== null) {
        const title = artMatch[1]
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (!title || title.length < 10) continue;
        // Title extracted but already covered by imageMap linkage above
      }
    }

    // Get RSS articles (has titles/descriptions but no images)
    const rssItems =
      rssArticles.status === "fulfilled" ? rssArticles.value : [];

    // Merge: attach homepage images to RSS articles by matching URL paths
    const articles: RawArticle[] = rssItems.map((article) => {
      const urlPath = new URL(article.url).pathname;
      const cdnImage = imageMap.get(urlPath);
      return {
        ...article,
        sourceId: "presstv", // override the _rss suffix
        imageUrl: cdnImage || article.imageUrl,
      };
    });

    // Add homepage-only articles not in RSS (e.g. featured/top stories)
    if (homepageRes.status === "fulfilled" && homepageRes.value.ok) {
      const rssUrls = new Set(articles.map((a) => new URL(a.url).pathname));
      for (const [path, imgUrl] of imageMap) {
        if (path.startsWith("_added_") || !path.startsWith("/Detail/")) continue;
        if (rssUrls.has(path)) continue;
        // We have image but need to construct a minimal article
        const slug = path.split("/").pop() || "";
        const title = slug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        if (title.length < 10) continue;
        articles.push({
          title,
          description: "",
          source: "Press TV",
          sourceId: "presstv",
          url: sanitizeExternalUrl(`https://www.presstv.ir${path}`) || `https://www.presstv.ir${path}`,
          publishedAt: new Date().toISOString(),
          imageUrl: imgUrl,
        });
      }
    }

    if (articles.length > 0) {
      recordSuccess("presstv", Date.now() - t0);
    } else {
      recordFailure("presstv");
    }
    return articles;
  } catch {
    recordFailure("presstv");
    return [];
  }
}

// === 3. Mehr News Agency (Iranian) ===
// Direct feed may timeout outside Iran. Falls back to Google News proxy.
export async function fetchMehrNews(): Promise<RawArticle[]> {
  const direct = await fetchRSS(APIs.rssFeeds.mehrnews, "mehrnews", "Mehr News Agency");
  if (direct.length > 0) return direct;
  return fetchGoogleNewsRSS(
    "https://news.google.com/rss/search?q=site:mehrnews.com&hl=en-US&gl=US&ceid=US:en",
    "mehrnews", "Mehr News Agency"
  );
}

// === 4. IRNA (Islamic Republic News Agency) ===
// Direct feed may timeout outside Iran. Falls back to Google News proxy.
export async function fetchIRNA(): Promise<RawArticle[]> {
  const direct = await fetchRSS(APIs.rssFeeds.irna, "irna", "IRNA");
  if (direct.length > 0) return direct;
  return fetchGoogleNewsRSS(
    "https://news.google.com/rss/search?q=site:irna.ir&hl=en-US&gl=US&ceid=US:en",
    "irna", "IRNA"
  );
}

// === 5. Tasnim News Agency (Iranian) ===
// Direct feed may be blocked. Falls back to Google News proxy.
export async function fetchTasnim(): Promise<RawArticle[]> {
  const direct = await fetchRSS(APIs.rssFeeds.tasnim, "tasnim", "Tasnim News");
  if (direct.length > 0) return direct;
  return fetchGoogleNewsRSS(
    "https://news.google.com/rss/search?q=site:tasnimnews.com&hl=en-US&gl=US&ceid=US:en",
    "tasnim", "Tasnim News"
  );
}

// === 6. Al Jazeera (Qatar) ===
export function fetchAlJazeera(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.aljazeera, "aljazeera", "Al Jazeera", iranFilter);
}

// === 7. Al Mayadeen (Lebanon) ===
export function fetchAlMayadeen(): Promise<RawArticle[]> {
  return fetchGoogleNewsRSS(APIs.rssFeeds.alMayadeen, "almayadeen", "Al Mayadeen");
}

// === 8. Middle East Eye (UK-based, ME-focused) ===
export function fetchMiddleEastEye(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.middleEastEye, "middleeasteye", "Middle East Eye", iranFilter);
}

// === 9. TRT World (Turkey) ===
export function fetchTRTWorld(): Promise<RawArticle[]> {
  return fetchGoogleNewsRSS(APIs.rssFeeds.trtWorld, "trtworld", "TRT World");
}

// === 10. Daily Sabah (Turkey) ===
export function fetchDailySabah(): Promise<RawArticle[]> {
  return fetchGoogleNewsRSS(APIs.rssFeeds.dailySabah, "dailysabah", "Daily Sabah");
}

// === 11. Dawn (Pakistan) ===
export function fetchDawn(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.dawn, "dawn", "Dawn", iranFilter);
}

// === 12. The News International (Pakistan) ===
export function fetchTheNewsIntl(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.theNewsIntl, "thenewsintl", "The News International", iranFilter);
}

// === 13. Times of India ===
export function fetchTimesOfIndia(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.timesOfIndia, "timesofindia", "Times of India", iranFilter);
}

// === 14. Hindustan Times ===
export function fetchHindustanTimes(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.hindustan, "hindustantimes", "Hindustan Times", iranFilter);
}

// === 15. SCMP (South China Morning Post) ===
export function fetchSCMP(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.scmp, "scmp", "South China Morning Post", iranFilter);
}

// === 16. CGTN (China) ===
export function fetchCGTN(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.cgtn, "cgtn", "CGTN", iranFilter);
}

// === 17. Xinhua (China) ===
export function fetchXinhua(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.xinhua, "xinhua", "Xinhua", iranFilter);
}

// === 18. Global Times (China) ===
export function fetchGlobalTimes(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.globaltimes, "globaltimes", "Global Times", iranFilter);
}

// === 19. TASS (Russia) ===
// TASS RSS og:image returns the site logo, not article images. The homepage
// uses background-image: url(//cdn-media.tass.ru/...) in style attributes.
// We scrape the homepage for CDN image URLs and merge with RSS by path.
export async function fetchTASS(): Promise<RawArticle[]> {
  if (isCircuitOpen("tass")) return [];
  const t0 = Date.now();
  try {
    const [homepageRes, rssArticles] = await Promise.allSettled([
      fetch("https://tass.com", {
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html",
        },
      }),
      fetchRSS(APIs.rssFeeds.tass, "tass_rss", "TASS", iranFilter),
    ]);

    // Extract image map from homepage: article path -> CDN image URL
    const imageMap = new Map<string, string>();
    if (homepageRes.status === "fulfilled" && homepageRes.value.ok) {
      const html = await homepageRes.value.text();
      // TASS pattern: <a ... href="/world/2114135"> ... background-image: url(//cdn-media.tass.ru/...)
      // Forward: <a href="..."> ... background-image: url(//cdn...)
      const fwdRegex =
        /<a[^>]+href="([^"]*\/(?:world|politics|economy|society|science|defense|sports|pressreview|interviews)\/\d+)"[^>]*>[\s\S]*?background-image:\s*url\(["']?(\/\/cdn-media\.tass\.ru[^)"'\s]+)["']?\)/gi;
      let m: RegExpExecArray | null;
      while ((m = fwdRegex.exec(html)) !== null) {
        imageMap.set(m[1], `https:${m[2]}`);
      }
      // Reverse: background-image: url(//cdn...) ... <a href="...">
      const revRegex =
        /background-image:\s*url\(["']?(\/\/cdn-media\.tass\.ru[^)"'\s]+)["']?\)[\s\S]*?<a[^>]+href="([^"]*\/(?:world|politics|economy|society|defense|sports|pressreview|interviews)\/\d+)"/gi;
      while ((m = revRegex.exec(html)) !== null) {
        if (!imageMap.has(m[2])) {
          imageMap.set(m[2], `https:${m[1]}`);
        }
      }
    }

    // Get RSS articles (may have logo as image, need to replace)
    const rssItems =
      rssArticles.status === "fulfilled" ? rssArticles.value : [];

    // Merge: attach homepage images to RSS articles by matching URL paths
    const articles: RawArticle[] = rssItems.map((article) => {
      try {
        const urlPath = new URL(article.url).pathname;
        const cdnImage = imageMap.get(urlPath);
        // Replace RSS image if we found a CDN image (RSS image is usually the site logo)
        return {
          ...article,
          sourceId: "tass",
          imageUrl: cdnImage || article.imageUrl,
        };
      } catch {
        return { ...article, sourceId: "tass" };
      }
    });

    // Add homepage-only articles not in RSS
    if (imageMap.size > 0) {
      const rssUrls = new Set(articles.map((a) => { try { return new URL(a.url).pathname; } catch { return ""; } }));
      for (const [path, imgUrl] of imageMap) {
        if (rssUrls.has(path)) continue;
        const slug = path.split("/").pop() || "";
        if (!slug) continue;
        articles.push({
          title: `TASS #${slug}`,
          description: "",
          source: "TASS",
          sourceId: "tass",
          url: sanitizeExternalUrl(`https://tass.com${path}`) || `https://tass.com${path}`,
          publishedAt: new Date().toISOString(),
          imageUrl: imgUrl,
        });
      }
    }

    if (articles.length > 0) {
      recordSuccess("tass", Date.now() - t0);
    } else {
      recordFailure("tass");
    }
    return articles;
  } catch {
    recordFailure("tass");
    return [];
  }
}

// === 20. UN News ===
export function fetchUNNews(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.unNews, "unnews", "UN News", iranFilter);
}

// === 21. ICRC ===
export function fetchICRC(): Promise<RawArticle[]> {
  return fetchGoogleNewsRSS(APIs.rssFeeds.icrc, "icrc", "ICRC");
}

// === 22. ReliefWeb Updates RSS ===
export function fetchReliefWebRSS(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.reliefWebUpdates, "reliefweb", "ReliefWeb");
}

// ════════════════════════════════════════════════════════════════════════
// NEW TIER 1: ADDITIONAL IRANIAN STATE SOURCES
// ════════════════════════════════════════════════════════════════════════

// === 25. Iran Press ===
export function fetchIranPress(): Promise<RawArticle[]> {
  return fetchGoogleNewsRSS(APIs.rssFeeds.iranPress, "iranpress", "Iran Press");
}

// === 26. Fars News Agency ===
export function fetchFarsNews(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.farsNews, "farsnews", "Fars News Agency");
}

// === 27. Pars Today (IRIB international) ===
export function fetchParsToday(): Promise<RawArticle[]> {
  return fetchGoogleNewsRSS(APIs.rssFeeds.parsToday, "parstoday", "Pars Today");
}

// === 28. ISNA (Iranian Students News Agency) ===
export function fetchISNA(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.isna, "isna", "ISNA");
}

// === 29. Financial Tribune (Iranian economy) ===
// Direct feed may timeout outside Iran. Falls back to Google News proxy.
export async function fetchFinancialTribune(): Promise<RawArticle[]> {
  const direct = await fetchRSS(APIs.rssFeeds.financialTribune, "financialtribune", "Financial Tribune");
  if (direct.length > 0) return direct;
  return fetchGoogleNewsRSS(
    "https://news.google.com/rss/search?q=site:financialtribune.com&hl=en-US&gl=US&ceid=US:en",
    "financialtribune", "Financial Tribune"
  );
}

// === 30. Khamenei.ir (Supreme Leader's office) ===
// Direct feed may be blocked. Falls back to Google News proxy.
export async function fetchKhameneiIr(): Promise<RawArticle[]> {
  const direct = await fetchRSS(APIs.rssFeeds.khameneiIr, "khameneiir", "Khamenei.ir");
  if (direct.length > 0) return direct;
  return fetchGoogleNewsRSS(
    "https://news.google.com/rss/search?q=site:khamenei.ir&hl=en-US&gl=US&ceid=US:en",
    "khameneiir", "Khamenei.ir"
  );
}

// === 31. SHANA (Oil Ministry news) ===
// Direct feed may timeout outside Iran. Falls back to Google News proxy.
export async function fetchShana(): Promise<RawArticle[]> {
  const direct = await fetchRSS(APIs.rssFeeds.shana, "shana", "SHANA");
  if (direct.length > 0) return direct;
  return fetchGoogleNewsRSS(
    "https://news.google.com/rss/search?q=site:shana.ir&hl=en-US&gl=US&ceid=US:en",
    "shana", "SHANA"
  );
}

// ════════════════════════════════════════════════════════════════════════
// NEW TIER 2a: RESISTANCE AXIS / ALIGNED MEDIA
// ════════════════════════════════════════════════════════════════════════

// === 32. The Cradle (pro-resistance analysis) ===
export function fetchTheCradle(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.theCradle, "thecradle", "The Cradle", iranFilter);
}

// === 33. MintPress News ===
export function fetchMintPressNews(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.mintPressNews, "mintpressnews", "MintPress News", iranFilter);
}

// === 34. The Grayzone ===
export function fetchTheGrayzone(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.theGrayzone, "thegrayzone", "The Grayzone", iranFilter);
}

// === 35. Consortium News ===
export function fetchConsortiumNews(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.consortiumNews, "consortiumnews", "Consortium News", iranFilter);
}

// === 36. Antiwar.com ===
export function fetchAntiwar(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.antiwar, "antiwar", "Antiwar.com", iranFilter);
}

// === 37. Electronic Intifada ===
export function fetchElectronicIntifada(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.electronicIntifada, "electronicintifada", "Electronic Intifada", meConflictFilter);
}

// === 38. Mondoweiss ===
export function fetchMondoweiss(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.mondoweiss, "mondoweiss", "Mondoweiss", meConflictFilter);
}

// === 39. Voltaire Network ===
export function fetchVoltairenet(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.voltairenet, "voltairenet", "Voltaire Network", iranFilter);
}

// ════════════════════════════════════════════════════════════════════════
// NEW TIER 2b: MIDDLE EAST EXPANSION
// ════════════════════════════════════════════════════════════════════════

// === 40. Al-Monitor ===
export function fetchAlMonitor(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.alMonitor, "almonitor", "Al-Monitor", iranFilter);
}

// === 41. Anadolu Agency (Turkey) ===
export function fetchAnadoluAgency(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.anadoluAgency, "anadoluagency", "Anadolu Agency", iranFilter);
}

// === 42. WAFA (Palestinian news) ===
export function fetchWAFA(): Promise<RawArticle[]> {
  return fetchGoogleNewsRSS(APIs.rssFeeds.wafa, "wafa", "WAFA");
}

// === 43. Gulf News ===
export function fetchGulfNews(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.gulfNews, "gulfnews", "Gulf News", iranFilter);
}

// ════════════════════════════════════════════════════════════════════════
// NEW TIER 2c: SOUTH ASIA EXPANSION
// ════════════════════════════════════════════════════════════════════════

// === 44. Express Tribune (Pakistan) ===
export function fetchExpressTribune(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.expressTribune, "expresstribune", "Express Tribune", iranFilter);
}

// === 45. Geo TV (Pakistan) ===
export function fetchGeoTV(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.geoTV, "geotv", "Geo TV", iranFilter);
}

// === 46. Bernama (Malaysia) ===
export function fetchBernama(): Promise<RawArticle[]> {
  return fetchGoogleNewsRSS(APIs.rssFeeds.bernama, "bernama", "Bernama");
}

// ════════════════════════════════════════════════════════════════════════
// NEW TIER 2d: EAST ASIA / MULTIPOLAR EXPANSION
// ════════════════════════════════════════════════════════════════════════

// === 47. China Daily ===
export function fetchChinaDaily(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.chinaDaily, "chinadaily", "China Daily", iranFilter);
}

// === 48. People's Daily ===
export function fetchPeoplesDaily(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.peoplesDaily, "peoplesdaily", "People's Daily", iranFilter);
}

// === 49. RT (Russia Today) ===
export function fetchRT(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.rt, "rt", "RT", iranFilter);
}

// === 50. Sputnik ===
export function fetchSputnik(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.sputnik, "sputnik", "Sputnik", iranFilter);
}

// ════════════════════════════════════════════════════════════════════════
// NEW TIER 2e: GLOBAL SOUTH / LATIN AMERICA
// ════════════════════════════════════════════════════════════════════════

// === 51. teleSUR (Venezuela/Latin America) ===
export function fetchTeleSUR(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.teleSUR, "telesur", "teleSUR", iranFilter);
}

// === 52. Prensa Latina (Cuba) ===
export function fetchPrensaLatina(): Promise<RawArticle[]> {
  return fetchGoogleNewsRSS(APIs.rssFeeds.prensaLatina, "prensalatina", "Prensa Latina");
}

// ════════════════════════════════════════════════════════════════════════
// NEW TIER 3: HUMANITARIAN EXPANSION
// ════════════════════════════════════════════════════════════════════════

// === 53. Amnesty International (Iran) ===
export function fetchAmnesty(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.amnesty, "amnesty", "Amnesty International", iranFilter);
}

// === 54. Human Rights Watch (Iran) ===
export function fetchHRW(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.hrw, "hrw", "Human Rights Watch");
}

// ════════════════════════════════════════════════════════════════════════
// NEW TIER 4: ADVERSARIAL (for cross-checking)
// ════════════════════════════════════════════════════════════════════════

// === 55. Reuters ===
export function fetchReuters(): Promise<RawArticle[]> {
  return fetchGoogleNewsRSS(APIs.rssFeeds.reuters, "reuters", "Reuters");
}

// === 56. BBC Middle East ===
export function fetchBBC(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.bbc, "bbc", "BBC", iranFilter);
}

// === 57. The Guardian (Iran) ===
export function fetchGuardian(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.guardian, "guardian", "The Guardian");
}

// === 58. AP News ===
export function fetchAPNews(): Promise<RawArticle[]> {
  return fetchRSS(APIs.rssFeeds.apNews, "apnews", "AP News", iranFilter);
}

// ════════════════════════════════════════════════════════════════════════
// API-BASED FETCHERS (NOT RSS)
// Free tier APIs with structured JSON responses.
// ════════════════════════════════════════════════════════════════════════

// === GNews API (100 req/day free) ===
export async function fetchGNewsAPI(): Promise<RawArticle[]> {
  const key = APIs.gnews.key;
  if (!key) return [];
  if (isCircuitOpen("gnews-api")) return [];
  const t0 = Date.now();

  const queries = ["Iran war", "Iran conflict", "Iran resistance"];
  const allArticles: RawArticle[] = [];

  try {
    for (const q of queries) {
      const url = new URL(`${APIs.gnews.base}/search`);
      url.searchParams.set("q", q);
      url.searchParams.set("lang", "en");
      url.searchParams.set("max", "10");
      url.searchParams.set("apikey", key);

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const json = await res.json();

      interface GNewsArticle {
        title?: string;
        description?: string;
        url?: string;
        publishedAt?: string;
        image?: string;
        source?: { name?: string };
      }

      for (const item of (json.articles || []) as GNewsArticle[]) {
        allArticles.push({
          title: item.title || "",
          description: (item.description || "").slice(0, 500),
          source: item.source?.name || "GNews",
          sourceId: "gnews-api",
          url: sanitizeExternalUrl(item.url || "") || "",
          publishedAt: item.publishedAt || new Date().toISOString(),
          imageUrl: sanitizeExternalUrl(item.image || "") || undefined,
        });
      }
    }
    recordSuccess("gnews-api", Date.now() - t0);
    return allArticles;
  } catch {
    recordFailure("gnews-api");
    return [];
  }
}

// === NewsData.io API (200 credits/day free) ===
export async function fetchNewsDataAPI(): Promise<RawArticle[]> {
  const key = APIs.newsdata.key;
  if (!key) return [];
  if (isCircuitOpen("newsdata-api")) return [];
  const t0 = Date.now();

  try {
    const url = new URL(`${APIs.newsdata.base}/latest`);
    url.searchParams.set("apikey", key);
    url.searchParams.set("q", "Iran");
    url.searchParams.set("language", "en");

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) { recordFailure("newsdata-api"); return []; }
    const json = await res.json();

    interface NDArticle {
      title?: string;
      description?: string;
      link?: string;
      pubDate?: string;
      image_url?: string;
      source_id?: string;
    }

    const articles = (json.results || []).map((item: NDArticle) => ({
      title: item.title || "",
      description: (item.description || "").slice(0, 500),
      source: item.source_id || "NewsData",
      sourceId: "newsdata-api",
      url: sanitizeExternalUrl(item.link || "") || "",
      publishedAt: item.pubDate || new Date().toISOString(),
      imageUrl: sanitizeExternalUrl(item.image_url || "") || undefined,
    }));

    recordSuccess("newsdata-api", Date.now() - t0);
    return articles;
  } catch {
    recordFailure("newsdata-api");
    return [];
  }
}

// === CurrentsAPI (600 req/day free) ===
export async function fetchCurrentsAPI(): Promise<RawArticle[]> {
  const key = APIs.currentsapi.key;
  if (!key) return [];
  if (isCircuitOpen("currents-api")) return [];
  const t0 = Date.now();

  try {
    const url = new URL(`${APIs.currentsapi.base}/search`);
    url.searchParams.set("apiKey", key);
    url.searchParams.set("keywords", "Iran");
    url.searchParams.set("language", "en");

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) { recordFailure("currents-api"); return []; }
    const json = await res.json();

    interface CurrArticle {
      title?: string;
      description?: string;
      url?: string;
      published?: string;
      image?: string;
      author?: string;
    }

    const articles = (json.news || []).map((item: CurrArticle) => ({
      title: item.title || "",
      description: (item.description || "").slice(0, 500),
      source: item.author || "CurrentsAPI",
      sourceId: "currents-api",
      url: sanitizeExternalUrl(item.url || "") || "",
      publishedAt: item.published || new Date().toISOString(),
      imageUrl: sanitizeExternalUrl(item.image || "") || undefined,
    }));

    recordSuccess("currents-api", Date.now() - t0);
    return articles;
  } catch {
    recordFailure("currents-api");
    return [];
  }
}

// === 23. ReliefWeb API (structured) ===
export async function fetchReliefWebAPI(): Promise<RawArticle[]> {
  try {
    const url = new URL(`${APIs.reliefWeb.base}/reports`);
    url.searchParams.set("appname", APIs.reliefWeb.appName);
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filter: {
          operator: "AND",
          conditions: [
            { field: "country.name", value: "Iran (Islamic Republic of)" },
          ],
        },
        fields: {
          include: ["title", "url_alias", "source.name", "date.original", "body"],
        },
        sort: ["date.original:desc"],
        limit: 10,
      }),
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    interface RWFields {
      title?: string;
      url_alias?: string;
      source?: { name?: string }[];
      date?: { original?: string };
      body?: string;
    }
    return (json.data || []).map((item: { fields: RWFields }) => {
      const f = item.fields;
      const bodyText = (f.body || "").replace(/<[^>]*>/g, "");
      return {
        title: f.title || "",
        description: bodyText.slice(0, 500),
        source: f.source?.[0]?.name || "ReliefWeb",
        sourceId: "reliefweb-api",
        url: f.url_alias ? `https://reliefweb.int${f.url_alias}` : "https://reliefweb.int",
        publishedAt: f.date?.original || new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

// === 24. Google News RSS (Iran topic queries) ===
export async function fetchGoogleNewsTopics(): Promise<RawArticle[]> {
  const queries = [
    "Iran+war+aggression",
    "Iran+resilience+unity",
    "Iran+humanitarian+crisis",
    "Iran+sanctions+resistance",
    "Iran+ceasefire+negotiations",
    "Iran+US+conflict",
    "Iran+Israel+strikes",
    "Strait+of+Hormuz",
    "Iran+BRICS+multipolar",
    "Iran+civilian+casualties",
  ];
  const allArticles: RawArticle[] = [];

  for (const q of queries) {
    const articles = await fetchRSS(
      `${APIs.googleNewsRSS.base}?q=${q}&hl=en&gl=US&ceid=US:en`,
      "googlenews",
      "Google News"
    );
    allArticles.push(...articles);
  }
  return allArticles;
}

// ── Master Fetch: All Sources in Parallel ──────────────────────────────────

export async function fetchAllSources(): Promise<{
  articles: RawArticle[];
  sourceResults: Record<string, { count: number; status: "ok" | "failed" }>;
}> {
  const fetchers: { name: string; fn: () => Promise<RawArticle[]> }[] = [
    // ── TIER 1: Iranian state (highest priority, no filter) ──────────
    { name: "Tehran Times", fn: fetchTehranTimes },
    { name: "Press TV", fn: fetchPressTV },
    { name: "Mehr News", fn: fetchMehrNews },
    { name: "IRNA", fn: fetchIRNA },
    { name: "Tasnim", fn: fetchTasnim },
    { name: "Iran Press", fn: fetchIranPress },
    { name: "Fars News", fn: fetchFarsNews },
    { name: "Pars Today", fn: fetchParsToday },
    { name: "ISNA", fn: fetchISNA },
    { name: "Financial Tribune", fn: fetchFinancialTribune },
    { name: "Khamenei.ir", fn: fetchKhameneiIr },
    { name: "SHANA", fn: fetchShana },

    // ── TIER 2a: Resistance axis / aligned media ─────────────────────
    { name: "Al Mayadeen", fn: fetchAlMayadeen },
    { name: "The Cradle", fn: fetchTheCradle },
    { name: "MintPress News", fn: fetchMintPressNews },
    { name: "The Grayzone", fn: fetchTheGrayzone },
    { name: "Consortium News", fn: fetchConsortiumNews },
    { name: "Antiwar.com", fn: fetchAntiwar },
    { name: "Electronic Intifada", fn: fetchElectronicIntifada },
    { name: "Mondoweiss", fn: fetchMondoweiss },
    { name: "Voltaire Network", fn: fetchVoltairenet },

    // ── TIER 2b: Middle East / West Asia ─────────────────────────────
    { name: "Al Jazeera", fn: fetchAlJazeera },
    { name: "Middle East Eye", fn: fetchMiddleEastEye },
    { name: "Al-Monitor", fn: fetchAlMonitor },
    { name: "TRT World", fn: fetchTRTWorld },
    { name: "Daily Sabah", fn: fetchDailySabah },
    { name: "Anadolu Agency", fn: fetchAnadoluAgency },
    { name: "WAFA", fn: fetchWAFA },
    { name: "Gulf News", fn: fetchGulfNews },

    // ── TIER 2c: South / Central Asia ────────────────────────────────
    { name: "Dawn", fn: fetchDawn },
    { name: "The News Intl", fn: fetchTheNewsIntl },
    { name: "Express Tribune", fn: fetchExpressTribune },
    { name: "Geo TV", fn: fetchGeoTV },
    { name: "Times of India", fn: fetchTimesOfIndia },
    { name: "Hindustan Times", fn: fetchHindustanTimes },
    { name: "SCMP", fn: fetchSCMP },
    { name: "Bernama", fn: fetchBernama },

    // ── TIER 2d: East Asia / Multipolar ──────────────────────────────
    { name: "CGTN", fn: fetchCGTN },
    { name: "Xinhua", fn: fetchXinhua },
    { name: "Global Times", fn: fetchGlobalTimes },
    { name: "China Daily", fn: fetchChinaDaily },
    { name: "People's Daily", fn: fetchPeoplesDaily },
    { name: "TASS", fn: fetchTASS },
    { name: "RT", fn: fetchRT },
    { name: "Sputnik", fn: fetchSputnik },

    // ── TIER 2e: Global South / Latin America ────────────────────────
    { name: "teleSUR", fn: fetchTeleSUR },
    { name: "Prensa Latina", fn: fetchPrensaLatina },

    // ── TIER 3: Humanitarian / Multilateral ──────────────────────────
    { name: "UN News", fn: fetchUNNews },
    { name: "ICRC", fn: fetchICRC },
    { name: "ReliefWeb RSS", fn: fetchReliefWebRSS },
    { name: "ReliefWeb API", fn: fetchReliefWebAPI },
    { name: "Amnesty", fn: fetchAmnesty },
    { name: "HRW", fn: fetchHRW },

    // ── TIER 4: Adversarial (cross-check) ────────────────────────────
    { name: "Reuters", fn: fetchReuters },
    { name: "BBC", fn: fetchBBC },
    { name: "Guardian", fn: fetchGuardian },
    { name: "AP News", fn: fetchAPNews },

    // ── API-based aggregators ────────────────────────────────────────
    { name: "Google News", fn: fetchGoogleNewsTopics },
    { name: "GNews API", fn: fetchGNewsAPI },
    { name: "NewsData API", fn: fetchNewsDataAPI },
    { name: "CurrentsAPI", fn: fetchCurrentsAPI },
  ];

  const results = await Promise.allSettled(fetchers.map((f) => f.fn()));

  const articles: RawArticle[] = [];
  const sourceResults: Record<string, { count: number; status: "ok" | "failed" }> = {};

  results.forEach((result, i) => {
    const name = fetchers[i].name;
    if (result.status === "fulfilled" && result.value.length > 0) {
      articles.push(...result.value);
      sourceResults[name] = { count: result.value.length, status: "ok" };
    } else {
      sourceResults[name] = { count: 0, status: "failed" };
    }
  });

  return { articles, sourceResults };
}
