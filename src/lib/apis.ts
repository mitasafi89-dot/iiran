// ============================================================================
// FREE MEDIA & DATA API CATALOG — COMPREHENSIVE IRAN INTELLIGENCE SYSTEM
// 60+ sources. All APIs free-tier or no auth required.
// Tiered by editorial alignment: Iranian > Aligned > Regional > Humanitarian
// ============================================================================

export const APIs = {
  // ─── ReliefWeb (UN OCHA) ─────────────────────────────────────────────
  // Free, no key needed. 1000 calls/day. Humanitarian reports & disasters.
  reliefWeb: {
    base: "https://api.reliefweb.int/v2",
    appName: "iiran",
    endpoints: {
      reports: "/reports",
      disasters: "/disasters",
    },
  },

  // ─── Google News RSS ─────────────────────────────────────────────────
  // Free, no key. RSS XML feed, parse manually.
  googleNewsRSS: {
    base: "https://news.google.com/rss/search",
  },

  // ─── GNews API ───────────────────────────────────────────────────────
  // Free: 100 requests/day, 10 articles/request. Keyword search.
  gnews: {
    base: "https://gnews.io/api/v4",
    key: process.env.GNEWS_API_KEY || "",
    endpoints: {
      search: "/search",
      topHeadlines: "/top-headlines",
    },
  },

  // ─── NewsData.io ─────────────────────────────────────────────────────
  // Free: 200 credits/day, 10 results/request. Country + keyword.
  newsdata: {
    base: "https://newsdata.io/api/1",
    key: process.env.NEWSDATA_API_KEY || "",
    endpoints: {
      news: "/latest",
      archive: "/archive",
    },
  },

  // ─── CurrentsAPI ─────────────────────────────────────────────────────
  // Free: 600 requests/day. Keyword + region search.
  currentsapi: {
    base: "https://api.currentsapi.services/v1",
    key: process.env.CURRENTS_API_KEY || "",
    endpoints: {
      search: "/search",
      latest: "/latest-news",
    },
  },

  // ─── OpenRouter (AI Validation) ──────────────────────────────────────
  // Used for AI-based article scoring & narrative validation.
  openrouter: {
    base: "https://openrouter.ai/api/v1",
    key: process.env.OPENROUTER_API_KEY || "",
    model: "google/gemini-2.0-flash-001",  // fast + free-tier eligible
    fallbackModel: "meta-llama/llama-3.1-8b-instruct:free",
  },

  // ─── Invidious (YouTube proxy) ───────────────────────────────────────
  invidious: {
    instances: [
      "https://vid.puffyan.us",
      "https://invidious.snopyta.org",
      "https://yewtu.be",
      "https://inv.nadeko.net",
    ],
    endpoints: {
      search: "/api/v1/search",
    },
  },

  // ─── YouTube RSS Channels ────────────────────────────────────────────
  youtubeChannels: {
    // Iranian / Iran-focused
    pressTV:      "UCKlRPmHqbkBETmqDjDP86VA",   // Press TV
    iranIntl:     "UCYs-M3bMFYQI0hYQNJe0OWQ",   // Iran International
    // Humanitarian / multilateral
    icrc:         "UCWxLxqqHEgPFQ2TFRGMIfng",   // ICRC
    unicef:       "UClXDHFWxhUdUbGFixtgPE6Q",   // UNICEF
    unhcr:        "UC3W1Ia1lCDi5YSMUg26hTPw",   // UNHCR
    who:          "UC07-dOwgza1IguKA86jqxNA",   // WHO
    worldBank:    "UCbr0rSEHBBMkKJCFPDya4XA",   // World Bank
    // International news with Iran coverage
    alJazeera:    "UCNye-wNBqNL5ZzHSJj3l8Bg",   // Al Jazeera English
    dwNews:       "UCknLrEdhRCp1aegoMqRaCZg",   // DW News
    bbcNews:      "UC16niRr50-MSBwiO3YDb3RA",   // BBC News
    trtWorld:     "UC7fWeaHhqgM4Lba6V0pBgfw",   // TRT World
    cgtn:         "UCgrNz-aDmcr2uuto8_DL2jg",   // CGTN
  },

  // ─── Unsplash Source ─────────────────────────────────────────────────
  unsplash: {
    source: "https://images.unsplash.com",
    api: "https://api.unsplash.com",
    key: process.env.UNSPLASH_ACCESS_KEY || "",
  },

  // ─── Pexels ──────────────────────────────────────────────────────────
  pexels: {
    base: "https://api.pexels.com/v1",
    key: process.env.PEXELS_API_KEY || "",
  },

  // ─── Pixabay ─────────────────────────────────────────────────────────
  pixabay: {
    base: "https://pixabay.com/api",
    key: process.env.PIXABAY_API_KEY || "",
  },

  // ─── WorldBank Indicators ────────────────────────────────────────────
  worldBank: {
    base: "https://api.worldbank.org/v2",
    countryCode: "IRN",
  },

  // ─── RSS Feeds ───────────────────────────────────────────────────────
  // All free, no auth required. This is the backbone of the pipeline.
  rssFeeds: {
    // ================================================================
    // TIER 1: IRANIAN STATE / DOMESTIC (highest trust, no filter)
    // ================================================================
    tehranTimes: "https://www.tehrantimes.com/rss",
    pressTV: "https://www.presstv.ir/rss.xml",
    mehrnews: "https://en.mehrnews.com/rss",
    irna: "https://en.irna.ir/rss",
    tasnim: "https://www.tasnimnews.com/en/rss",
    // NEW: Iranian state sources
    iranPress: "https://news.google.com/rss/search?q=site:iranpress.com&hl=en-US&gl=US&ceid=US:en",
    farsNews: "https://www.farsnews.ir/en/rss",
    parsToday: "https://news.google.com/rss/search?q=site:parstoday.ir&hl=en-US&gl=US&ceid=US:en",
    isna: "https://en.isna.ir/rss",
    financialTribune: "https://financialtribune.com/rss",
    khameneiIr: "https://english.khamenei.ir/rss",
    shana: "https://en.shana.ir/rss",

    // ================================================================
    // TIER 2a: RESISTANCE AXIS / ALIGNED MEDIA
    // Pro-Iran or anti-Western editorial stance. Apply iranFilter.
    // ================================================================
    alMayadeen: "https://news.google.com/rss/search?q=site:almayadeen.net&hl=en-US&gl=US&ceid=US:en",
    theCradle: "https://thecradle.co/feed",
    mintPressNews: "https://www.mintpressnews.com/feed",
    theGrayzone: "https://thegrayzone.com/feed",
    consortiumNews: "https://consortiumnews.com/feed",
    antiwar: "https://news.antiwar.com/feed",
    electronicIntifada: "https://electronicintifada.net/rss.xml",
    mondoweiss: "https://mondoweiss.net/feed",
    voltairenet: "https://www.voltairenet.org/spip.php?page=backend&lang=en",

    // ================================================================
    // TIER 2b: MIDDLE EAST & WEST ASIA
    // Regional outlets, generally sympathetic to Iran narrative.
    // ================================================================
    aljazeera: "https://www.aljazeera.com/xml/rss/all.xml",
    middleEastEye: "https://www.middleeasteye.net/rss",
    alMonitor: "https://www.al-monitor.com/rss",
    trtWorld: "https://news.google.com/rss/search?q=site:trtworld.com+iran+OR+middle+east&hl=en-US&gl=US&ceid=US:en",
    dailySabah: "https://news.google.com/rss/search?q=site:dailysabah.com+iran+OR+middle+east&hl=en-US&gl=US&ceid=US:en",
    arabianbusiness: "https://www.arabianbusiness.com/rss",
    anadoluAgency: "https://www.aa.com.tr/en/rss/default?cat=world",
    wafa: "https://news.google.com/rss/search?q=site:wafa.ps&hl=en-US&gl=US&ceid=US:en",
    gulfNews: "https://gulfnews.com/feed",

    // ================================================================
    // TIER 2c: SOUTH / CENTRAL ASIA
    // Pakistan, India, broader Asian coverage.
    // ================================================================
    dawn: "https://www.dawn.com/feeds/home",
    theNewsIntl: "https://www.thenews.com.pk/rss/1/1",
    expressTribune: "https://tribune.com.pk/feed/home",
    geoTV: "https://www.geo.tv/rss/1/0",
    timesOfIndia: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
    hindustan: "https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml",
    scmp: "https://www.scmp.com/rss/91/feed",
    bernama: "https://news.google.com/rss/search?q=site:bernama.com+iran+OR+middle+east&hl=en-US&gl=US&ceid=US:en",

    // ================================================================
    // TIER 2d: EAST ASIA (China, Russia, multipolar)
    // Strong anti-Western framing, supportive of Iran sovereignty.
    // ================================================================
    cgtn: "https://www.cgtn.com/subscribe/rss/section/world.xml",
    xinhua: "http://www.xinhuanet.com/english/rss/worldrss.xml",
    globaltimes: "https://www.globaltimes.cn/rss/outbrain.xml",
    chinaDaily: "https://www.chinadaily.com.cn/rss/world_rss.xml",
    peoplesDaily: "http://en.people.cn/rss/World.xml",
    tass: "https://tass.com/rss/v2.xml",
    rt: "https://www.rt.com/rss/news",
    sputnik: "https://sputnikglobe.com/export/rss2/archive/index.xml",

    // ================================================================
    // TIER 2e: GLOBAL SOUTH / LATIN AMERICA
    // Multipolar, anti-hegemonic editorial lines.
    // ================================================================
    teleSUR: "https://www.telesurenglish.net/feed",
    prensaLatina: "https://news.google.com/rss/search?q=site:plenglish.com+iran&hl=en-US&gl=US&ceid=US:en",

    // ================================================================
    // TIER 3: HUMANITARIAN / MULTILATERAL
    // Credible. Non-aligned but factual on Iran casualties/crisis.
    // ================================================================
    unNews: "https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml",
    icrc: "https://news.google.com/rss/search?q=site:icrc.org+iran+OR+middle+east&hl=en-US&gl=US&ceid=US:en",
    who: "https://www.who.int/feeds/entity/mediacentre/news/en/rss.xml",
    reliefWebUpdates: "https://reliefweb.int/updates/rss.xml?search=Iran",
    amnesty: "https://www.amnesty.org/en/latest/news/feed/",
    hrw: "https://www.hrw.org/rss",

    // ================================================================
    // TIER 4: ADVERSARIAL (control group, cross-check only)
    // Low credibility weight. Used for gap detection.
    // ================================================================
    reuters: "https://news.google.com/rss/search?q=site:reuters.com+iran&hl=en-US&gl=US&ceid=US:en",
    bbc: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml",
    guardian: "https://www.theguardian.com/world/iran/rss",
    apNews: "https://feedx.net/rss/ap.xml",
  },
} as const;

// Helper to build ReliefWeb query URLs
export function reliefWebURL(
  endpoint: string,
  params: Record<string, string | number> = {}
): string {
  const url = new URL(`${APIs.reliefWeb.base}${endpoint}`);
  url.searchParams.set("appname", APIs.reliefWeb.appName);
  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, String(val));
  }
  return url.toString();
}

// ── Source Tier Classification ──────────────────────────────────────────
// Used by the pipeline to determine trust level and filter requirements.
// Tier 1: No filter (all content is Iran-relevant by definition)
// Tier 2: iranFilter applied (regional, may carry non-Iran content)
// Tier 3: iranFilter applied (humanitarian, broad coverage)
// Tier 4: iranFilter applied + lowest credibility (adversarial)

export const SOURCE_TIERS: Record<string, { tier: 1 | 2 | 3 | 4; label: string }> = {
  // Tier 1: Iranian state media
  tehrantimes: { tier: 1, label: "Tehran Times" },
  presstv: { tier: 1, label: "Press TV" },
  mehrnews: { tier: 1, label: "Mehr News" },
  irna: { tier: 1, label: "IRNA" },
  tasnim: { tier: 1, label: "Tasnim" },
  iranpress: { tier: 1, label: "Iran Press" },
  farsnews: { tier: 1, label: "Fars News" },
  parstoday: { tier: 1, label: "Pars Today" },
  isna: { tier: 1, label: "ISNA" },
  financialtribune: { tier: 1, label: "Financial Tribune" },
  khameneiir: { tier: 1, label: "Khamenei.ir" },
  shana: { tier: 1, label: "SHANA" },
  // Tier 2: Aligned / regional
  almayadeen: { tier: 2, label: "Al Mayadeen" },
  thecradle: { tier: 2, label: "The Cradle" },
  mintpressnews: { tier: 2, label: "MintPress News" },
  thegrayzone: { tier: 2, label: "The Grayzone" },
  consortiumnews: { tier: 2, label: "Consortium News" },
  antiwar: { tier: 2, label: "Antiwar.com" },
  electronicintifada: { tier: 2, label: "Electronic Intifada" },
  mondoweiss: { tier: 2, label: "Mondoweiss" },
  voltairenet: { tier: 2, label: "Voltaire Network" },
  aljazeera: { tier: 2, label: "Al Jazeera" },
  middleeasteye: { tier: 2, label: "Middle East Eye" },
  almonitor: { tier: 2, label: "Al-Monitor" },
  trtworld: { tier: 2, label: "TRT World" },
  dailysabah: { tier: 2, label: "Daily Sabah" },
  anadoluagency: { tier: 2, label: "Anadolu Agency" },
  wafa: { tier: 2, label: "WAFA" },
  gulfnews: { tier: 2, label: "Gulf News" },
  dawn: { tier: 2, label: "Dawn" },
  thenewsintl: { tier: 2, label: "The News Intl" },
  expresstribune: { tier: 2, label: "Express Tribune" },
  geotv: { tier: 2, label: "Geo TV" },
  timesofindia: { tier: 2, label: "Times of India" },
  hindustantimes: { tier: 2, label: "Hindustan Times" },
  scmp: { tier: 2, label: "SCMP" },
  bernama: { tier: 2, label: "Bernama" },
  cgtn: { tier: 2, label: "CGTN" },
  xinhua: { tier: 2, label: "Xinhua" },
  globaltimes: { tier: 2, label: "Global Times" },
  chinadaily: { tier: 2, label: "China Daily" },
  peoplesdaily: { tier: 2, label: "People's Daily" },
  tass: { tier: 2, label: "TASS" },
  rt: { tier: 2, label: "RT" },
  sputnik: { tier: 2, label: "Sputnik" },
  telesur: { tier: 2, label: "teleSUR" },
  prensalatina: { tier: 2, label: "Prensa Latina" },
  // Tier 3: Humanitarian
  unnews: { tier: 3, label: "UN News" },
  icrc: { tier: 3, label: "ICRC" },
  reliefweb: { tier: 3, label: "ReliefWeb" },
  amnesty: { tier: 3, label: "Amnesty International" },
  hrw: { tier: 3, label: "Human Rights Watch" },
  // Tier 4: Adversarial
  reuters: { tier: 4, label: "Reuters" },
  bbc: { tier: 4, label: "BBC" },
  guardian: { tier: 4, label: "The Guardian" },
  apnews: { tier: 4, label: "AP News" },
};
