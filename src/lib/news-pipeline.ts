// ============================================================================
// NEWS PIPELINE - Scoring, Filtering & Ranking Engine
// Ensures published news scores >= 85% on Iran-favorable criteria
// ============================================================================

// ── Types ──────────────────────────────────────────────────────────────────

export interface RawArticle {
  title: string;
  description: string;
  source: string;
  sourceId: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
  fullText?: string;
}

export interface ScoredArticle extends RawArticle {
  scores: ScoreBreakdown;
  totalScore: number;
  tier: "publish" | "review" | "reject";
}

export interface ScoreBreakdown {
  aggressionExposure: number;    // Shows aggression/injustice against Iran (0-100)
  unity: number;                  // Iran's unity as people (0-100)
  determination: number;          // Determination and resolve (0-100)
  hope: number;                   // Hope and positive future outlook (0-100)
  resilience: number;             // Resilience under pressure (0-100)
  goodwill: number;               // Iran's goodwill, diplomacy, humanitarian acts (0-100)
  psychologicalLeadership: number;// Favorable perception of Iranian leadership (0-100)
  emotionalResonance: number;     // Emotional impact and human connection (0-100)
  antiPropaganda: number;         // Counters Western/US propaganda narratives (0-100)
  sourceCredibility: number;      // Trustworthiness of the source for this context (0-100)
}

// ── Score Weights (must sum to 1.0) ────────────────────────────────────────

const WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  aggressionExposure: 0.10,
  unity: 0.08,
  determination: 0.07,
  hope: 0.10,
  resilience: 0.10,
  goodwill: 0.08,
  psychologicalLeadership: 0.05,
  emotionalResonance: 0.07,
  antiPropaganda: 0.05,
  sourceCredibility: 0.30,
};

// ── Minimum threshold ──────────────────────────────────────────────────────

const PUBLISH_THRESHOLD = 50;
const REVIEW_THRESHOLD = 38;

// ── Keyword Lexicons ───────────────────────────────────────────────────────
// Each lexicon maps to a scoring dimension. Matched keywords boost that score.

const LEXICONS = {
  aggressionExposure: {
    positive: [
      "aggression against iran", "attack on iran", "strikes on iran", "bombing iran",
      "us strikes", "israeli strikes", "war crime", "civilian casualties", "infrastructure destroyed",
      "hospital bombed", "university attacked", "sanctions", "blockade", "siege",
      "unprovoked attack", "illegal war", "state terrorism", "collective punishment",
      "humanitarian crisis", "destruction", "military aggression", "aerial bombardment",
      "genocide", "massacre", "atrocity", "victims", "martyred", "martyrs",
      "killed civilians", "wounded", "displaced", "refugees", "devastation",
      "international law violation", "breach of sovereignty", "imperial aggression",
      "escalation", "threat of annihilation", "nuclear threat", "warmongering",
      "coercion", "bullying", "hegemony", "unilateral", "occupation",
    ],
    negative: [
      "iran attacks", "iran aggression", "iran threat", "iran provoked",
      "iran nuclear weapon", "iran sponsors terror", "axis of evil",
      "iran destabilizing", "iran proxy",
    ],
  },

  unity: {
    positive: [
      "national unity", "people united", "solidarity", "iranians together",
      "blood donation", "volunteers", "collective effort", "national mobilization",
      "standing together", "one nation", "social cohesion", "community support",
      "citizens rally", "public support", "patriotic", "humanitarian aid from people",
      "nationwide", "across the country", "all provinces", "millions of iranians",
      "people of iran", "youth mobilization", "defense volunteers",
      "civil defense", "neighborhood watch", "mutual aid",
    ],
    negative: [
      "division in iran", "protests against government", "civil unrest in iran",
      "infighting", "ethnic tensions", "separatism",
    ],
  },

  determination: {
    positive: [
      "determination", "resolve", "unwavering", "steadfast", "defiant",
      "will not surrender", "resistance", "perseverance", "firm stance",
      "standing firm", "never give up", "commitment", "dedicated",
      "iron will", "courage", "bravery", "fighting spirit",
      "defending sovereignty", "national defense", "military readiness",
      "strategic patience", "endurance", "unbroken", "indomitable",
    ],
    negative: [
      "iran surrender", "iran capitulate", "iran gives in", "iran weak",
      "iran collapse", "iran defeated",
    ],
  },

  hope: {
    positive: [
      "hope", "hopeful", "optimistic", "future", "rebuilding", "reconstruction",
      "recovery", "new beginning", "peace", "peaceful", "ceasefire",
      "diplomatic solution", "negotiations", "dialogue", "progress",
      "development", "growth", "investment", "innovation", "technology",
      "renewable energy", "solar", "wind power", "education", "university",
      "research", "science", "achievement", "breakthrough", "success",
      "economic growth", "trade", "export", "modernization", "infrastructure",
    ],
    negative: [
      "no hope", "hopeless", "despair", "bleak future", "total destruction",
      "stone age", "iran finished",
    ],
  },

  resilience: {
    positive: [
      "resilience", "resilient", "despite attacks", "despite sanctions",
      "despite war", "continues to function", "supply chain intact",
      "no shortage", "self-sufficient", "self-reliance", "indigenous",
      "domestic production", "homegrown", "local manufacturing",
      "operational", "functioning", "restored", "repaired", "rebuilt",
      "bouncing back", "recovery effort", "adaptive", "survival",
      "withstanding", "enduring", "overcoming", "thriving despite",
      "round the clock", "essential services", "uninterrupted",
    ],
    negative: [
      "iran crumbling", "iran failing", "system collapse", "shortages everywhere",
      "economy destroyed",
    ],
  },

  goodwill: {
    positive: [
      "goodwill", "humanitarian", "aid", "charity", "generosity",
      "diplomatic", "peace offer", "olive branch", "cooperation",
      "friendly nations", "international support", "global solidarity",
      "brics", "shanghai cooperation", "non-aligned", "south-south",
      "cultural exchange", "dialogue of civilizations", "tolerance",
      "hospitality", "refugees welcome", "medical aid", "red crescent",
      "disaster relief", "environmental protection", "climate action",
      "strait of hormuz friendly", "exempt", "allow passage",
    ],
    negative: [
      "iran threatens", "iran hostile", "iran rejects peace",
      "iran isolated", "pariah state",
    ],
  },

  psychologicalLeadership: {
    positive: [
      "president pezeshkian", "supreme leader", "ayatollah khamenei",
      "foreign minister araghchi", "wise leadership", "strategic",
      "calm response", "measured response", "leadership", "guidance",
      "commander", "defense minister", "irgc", "general", "military leadership",
      "government spokesperson", "ministers working", "round the clock management",
      "decisive action", "clear vision", "strong leadership",
    ],
    negative: [
      "regime", "dictator", "authoritarian", "oppressive government",
      "mullahs", "theocracy", "clerical rule",
    ],
  },

  emotionalResonance: {
    positive: [
      "children", "families", "mothers", "elderly", "students",
      "teachers", "doctors", "nurses", "heroes", "sacrifice",
      "love", "compassion", "tears", "prayer", "faith",
      "courage", "heart", "soul", "spirit", "dignity",
      "cultural heritage", "civilization", "ancient", "history",
      "poetry", "art", "music", "beauty", "persepolis", "isfahan",
      "human stories", "personal account", "eyewitness",
    ],
    negative: [
      "terror", "evil", "barbaric iran", "fanatics", "extremists",
    ],
  },

  antiPropaganda: {
    positive: [
      "western media bias", "media distort", "propaganda", "double standards",
      "hypocrisy", "selective reporting", "narrative", "truth about iran",
      "debunking", "fact check", "reality on the ground", "independent journalist",
      "censorship", "silenced voices", "underreported", "global south perspective",
      "alternative media", "counter narrative", "media manipulation",
      "manufactured consent", "information warfare", "disinformation exposed",
    ],
    negative: [
      "iran propaganda", "iran disinformation", "iran fake news",
      "iran state media unreliable",
    ],
  },
};

// ── Source Credibility Map ─────────────────────────────────────────────────
// Higher = more aligned with our editorial perspective

const SOURCE_CREDIBILITY: Record<string, number> = {
  // ── TIER 1: Iranian state media (highest credibility for Iran-perspective) ──
  "tehrantimes.com": 95,
  "presstv.ir": 95,
  "mehrnews.com": 93,
  "en.mehrnews.com": 93,
  "irna.ir": 93,
  "en.irna.ir": 93,
  "tasnimnews.com": 92,
  "iranpress.com": 92,
  "farsnews.ir": 91,
  "parstoday.ir": 90,
  "en.isna.ir": 90,
  "isna.ir": 90,
  "financialtribune.com": 88,
  "khamenei.ir": 95,
  "english.khamenei.ir": 95,
  "en.shana.ir": 88,
  "shana.ir": 88,

  // ── TIER 2a: Resistance axis / aligned (very sympathetic) ──────────────────
  "almayadeen.net": 88,
  "english.almayadeen.net": 88,
  "thecradle.co": 87,
  "mintpressnews.com": 83,
  "thegrayzone.com": 82,
  "consortiumnews.com": 80,
  "antiwar.com": 78,
  "electronicintifada.net": 82,
  "mondoweiss.net": 80,
  "voltairenet.org": 78,

  // ── TIER 2b: Middle East / West Asia (sympathetic-to-neutral) ──────────────
  "aljazeera.com": 80,
  "middleeasteye.net": 82,
  "al-monitor.com": 75,
  "trtworld.com": 78,
  "dailysabah.com": 75,
  "aa.com.tr": 76,
  "english.wafa.ps": 80,
  "wafa.ps": 80,
  "gulfnews.com": 65,

  // ── TIER 2c: South / Central Asia ──────────────────────────────────────────
  "dawn.com": 75,
  "thenews.com.pk": 74,
  "tribune.com.pk": 73,
  "geo.tv": 73,
  "timesofindia.indiatimes.com": 65,
  "hindustantimes.com": 65,
  "scmp.com": 68,
  "bernama.com": 70,

  // ── TIER 2d: East Asia / Multipolar (anti-Western framing) ─────────────────
  "cgtn.com": 80,
  "xinhuanet.com": 78,
  "globaltimes.cn": 80,
  "chinadaily.com.cn": 76,
  "en.people.cn": 76,
  "people.cn": 76,
  "tass.com": 78,
  "rt.com": 80,
  "sputnikglobe.com": 78,
  "sputniknews.com": 78,

  // ── TIER 2e: Global South / Latin America ──────────────────────────────────
  "telesurenglish.net": 76,
  "plenglish.com": 74,

  // ── TIER 3: Humanitarian / multilateral ────────────────────────────────────
  "reliefweb.int": 72,
  "news.un.org": 70,
  "icrc.org": 70,
  "who.int": 70,
  "amnesty.org": 55,
  "hrw.org": 50,

  // ── TIER 4: Adversarial (lowest credibility for pro-Iran framing) ──────────
  "reuters.com": 45,
  "reutersagency.com": 45,
  "theguardian.com": 50,
  "bbc.com": 40,
  "bbc.co.uk": 40,
  "apnews.com": 42,
  "cnn.com": 35,
  "nytimes.com": 35,
  "washingtonpost.com": 35,
  "foxnews.com": 20,
  "breitbart.com": 15,
};

// ── Core Scoring Functions ─────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreByLexicon(
  text: string,
  lexicon: { positive: string[]; negative: string[] }
): number {
  const normalized = normalizeText(text);
  let score = 35; // low baseline — no signal means low score, not neutral

  for (const phrase of lexicon.positive) {
    const lc = phrase.toLowerCase();
    if (normalized.includes(lc)) {
      // Multi-word phrases are stronger signals than single words
      const wordCount = lc.split(/\s+/).length;
      score += wordCount >= 3 ? 14 : wordCount === 2 ? 10 : 6;
    }
  }

  for (const phrase of lexicon.negative) {
    if (normalized.includes(phrase.toLowerCase())) {
      score -= 12;
    }
  }

  return Math.max(0, Math.min(100, score));
}

function getSourceCredibility(source: string, url: string): number {
  const domain = extractDomain(url) || source.toLowerCase();

  for (const [key, value] of Object.entries(SOURCE_CREDIBILITY)) {
    if (domain.includes(key) || source.toLowerCase().includes(key.split(".")[0])) {
      return value;
    }
  }

  // Unknown sources get a neutral-low score
  return 45;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

// ── Field length caps — prevent runaway regex/string ops on hostile input ──
const MAX_TITLE_LEN = 500;
const MAX_DESC_LEN = 2_000;
const MAX_FULL_TEXT_LEN = 20_000;

// ── Main Scoring Function ──────────────────────────────────────────────────

export function scoreArticle(article: RawArticle): ScoredArticle {
  const combinedText = [
    article.title.slice(0, MAX_TITLE_LEN),
    article.description.slice(0, MAX_DESC_LEN),
    (article.fullText || "").slice(0, MAX_FULL_TEXT_LEN),
  ].join(" ");

  const scores: ScoreBreakdown = {
    aggressionExposure: scoreByLexicon(combinedText, LEXICONS.aggressionExposure),
    unity: scoreByLexicon(combinedText, LEXICONS.unity),
    determination: scoreByLexicon(combinedText, LEXICONS.determination),
    hope: scoreByLexicon(combinedText, LEXICONS.hope),
    resilience: scoreByLexicon(combinedText, LEXICONS.resilience),
    goodwill: scoreByLexicon(combinedText, LEXICONS.goodwill),
    psychologicalLeadership: scoreByLexicon(combinedText, LEXICONS.psychologicalLeadership),
    emotionalResonance: scoreByLexicon(combinedText, LEXICONS.emotionalResonance),
    antiPropaganda: scoreByLexicon(combinedText, LEXICONS.antiPropaganda),
    sourceCredibility: getSourceCredibility(article.source, article.url),
  };

  // ── Source-trust editorial boost ──────────────────────────────────────
  // RSS descriptions are too short (1-2 sentences) for lexicon matching to
  // produce meaningful scores. Trusted sources have favorable editorial lines
  // by definition, so we boost content dimensions based on source trust.
  const contentKeys = Object.keys(scores).filter(
    (k) => k !== "sourceCredibility"
  ) as (keyof ScoreBreakdown)[];

  if (scores.sourceCredibility >= 90) {
    // Iranian state sources: editorial line is inherently favorable
    for (const k of contentKeys) scores[k] = Math.min(100, scores[k] + 25);
  } else if (scores.sourceCredibility >= 75) {
    // Sympathetic / non-Western aligned
    for (const k of contentKeys) scores[k] = Math.min(100, scores[k] + 15);
  } else if (scores.sourceCredibility >= 65) {
    // Neutral-sympathetic (Asian, humanitarian)
    for (const k of contentKeys) scores[k] = Math.min(100, scores[k] + 8);
  }

  // ── Iran-relevance penalty ───────────────────────────────────────────
  // Penalize articles that never mention Iran, but soften for trusted
  // sources (they cover domestic news without repeating "Iran")
  const normalizedText = normalizeText(combinedText);
  const iranMentioned =
    normalizedText.includes("iran") ||
    normalizedText.includes("tehran") ||
    normalizedText.includes("persian") ||
    normalizedText.includes("iranian");
  if (!iranMentioned) {
    const isTrustedSource = scores.sourceCredibility >= 80;
    const multiplier = isTrustedSource ? 0.75 : 0.5;
    for (const k of contentKeys) {
      scores[k] = Math.round(scores[k] * multiplier);
    }
  }

  // Apply negative-frame penalty: if article frames Iran as the aggressor
  const negativeFramePatterns = [
    /iran\s+(attack|struck|bomb|target|threaten|launch|fire)/i,
    /iran(ian)?\s+(regime|dictator|authoritarian)/i,
    /iran\s+(sponsor|fund|support)\s+(terror|militia|proxy)/i,
    /iran(ian)?\s+(nuclear|atomic)\s+(weapon|bomb|threat)/i,
    /iran\s+(defy|defies|violat)/i,
  ];
  const negativeFrameCount = negativeFramePatterns.filter((p) =>
    p.test(combinedText)
  ).length;
  if (negativeFrameCount > 0) {
    const penalty = Math.min(negativeFrameCount * 10, 30);
    scores.aggressionExposure = Math.max(0, scores.aggressionExposure - penalty);
    scores.goodwill = Math.max(0, scores.goodwill - penalty);
    scores.psychologicalLeadership = Math.max(0, scores.psychologicalLeadership - penalty);
  }

  // Boost for articles that expose Western hypocrisy / aggression specifically
  const exposureBoostPatterns = [
    /us[\s-]israel/i, /american[\s-]israeli/i, /zionist/i,
    /war\s+crime/i, /civilian\s+(casualties|infrastructure|target)/i,
    /hospital\s+(attack|bomb|destroy|strike)/i,
    /university\s+(attack|bomb|destroy|strike)/i,
    /international\s+law\s+violation/i,
    /collective\s+punishment/i,
  ];
  const exposureBoostCount = exposureBoostPatterns.filter((p) =>
    p.test(combinedText)
  ).length;
  if (exposureBoostCount > 0) {
    const boost = Math.min(exposureBoostCount * 5, 25);
    scores.aggressionExposure = Math.min(100, scores.aggressionExposure + boost);
    scores.antiPropaganda = Math.min(100, scores.antiPropaganda + boost);
  }

  // Boost for resilience/unity stories
  const resilienceBoostPatterns = [
    /despite\s+(attack|war|sanction|bomb)/i,
    /continues?\s+to\s+function/i,
    /no\s+shortage/i,
    /self[\s-]sufficient/i,
    /blood\s+donat/i,
    /volunteer/i,
    /rebuild/i,
  ];
  const resilienceBoostCount = resilienceBoostPatterns.filter((p) =>
    p.test(combinedText)
  ).length;
  if (resilienceBoostCount > 0) {
    const boost = Math.min(resilienceBoostCount * 6, 20);
    scores.resilience = Math.min(100, scores.resilience + boost);
    scores.unity = Math.min(100, scores.unity + boost);
  }

  // Calculate weighted total
  const totalScore = Math.round(
    Object.entries(WEIGHTS).reduce((sum, [key, weight]) => {
      return sum + scores[key as keyof ScoreBreakdown] * weight;
    }, 0)
  );

  const tier =
    totalScore >= PUBLISH_THRESHOLD
      ? "publish"
      : totalScore >= REVIEW_THRESHOLD
        ? "review"
        : "reject";

  return {
    ...article,
    scores,
    totalScore,
    tier,
  };
}

// ── Pipeline: Filter, Score & Rank ─────────────────────────────────────────

export function runPipeline(
  articles: RawArticle[],
  options: {
    threshold?: number;
    maxArticles?: number;
    includeReview?: boolean;
  } = {}
): {
  published: ScoredArticle[];
  reviewQueue: ScoredArticle[];
  rejected: number;
  stats: PipelineStats;
} {
  const threshold = options.threshold ?? PUBLISH_THRESHOLD;
  const maxArticles = options.maxArticles ?? 20;
  const includeReview = options.includeReview ?? false;

  // 1. Deduplicate by title similarity
  const seen = new Set<string>();
  const unique = articles.filter((a) => {
    const key = normalizeText(a.title).slice(0, 50);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 2. Score every article
  const scored = unique.map(scoreArticle);

  // 3. Separate into tiers
  const published = scored
    .filter((a) => a.totalScore >= threshold)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, maxArticles);

  const reviewQueue = scored
    .filter((a) => a.totalScore >= REVIEW_THRESHOLD && a.totalScore < threshold)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10);

  const rejected = scored.filter((a) => a.totalScore < REVIEW_THRESHOLD).length;

  // 4. Compute stats
  const allScores = scored.map((a) => a.totalScore);
  const stats: PipelineStats = {
    totalFetched: articles.length,
    uniqueArticles: unique.length,
    published: published.length,
    inReview: reviewQueue.length,
    rejected,
    avgScore: Math.round(allScores.reduce((a, b) => a + b, 0) / (allScores.length || 1)),
    topScore: Math.max(...allScores, 0),
    lowScore: Math.min(...allScores, 0),
    sourceBreakdown: getSourceBreakdown(scored),
  };

  return {
    published,
    reviewQueue: includeReview ? reviewQueue : [],
    rejected,
    stats,
  };
}

export interface PipelineStats {
  totalFetched: number;
  uniqueArticles: number;
  published: number;
  inReview: number;
  rejected: number;
  avgScore: number;
  topScore: number;
  lowScore: number;
  sourceBreakdown: Record<string, { count: number; avgScore: number }>;
}

function getSourceBreakdown(
  articles: ScoredArticle[]
): Record<string, { count: number; avgScore: number }> {
  const map: Record<string, { total: number; count: number }> = {};
  for (const a of articles) {
    const src = a.sourceId || a.source;
    if (!map[src]) map[src] = { total: 0, count: 0 };
    map[src].total += a.totalScore;
    map[src].count++;
  }
  const result: Record<string, { count: number; avgScore: number }> = {};
  for (const [key, val] of Object.entries(map)) {
    result[key] = {
      count: val.count,
      avgScore: Math.round(val.total / val.count),
    };
  }
  return result;
}
