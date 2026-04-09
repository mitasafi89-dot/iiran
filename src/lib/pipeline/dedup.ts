// ============================================================================
// DEDUPLICATION + CONTENT FINGERPRINTING + STORY CLUSTERING
//
// Replaces the naive 50-char prefix dedup with tokenized Jaccard similarity.
// Also provides story clustering for diagnostic grouping of related coverage.
// ============================================================================

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "was", "are", "were", "be", "been",
  "have", "has", "had", "do", "does", "did", "will", "would", "can",
  "could", "not", "no", "this", "that", "it", "its", "as", "if", "so",
  "up", "out", "about", "into", "over", "after", "says", "said", "new",
  "also", "may", "more", "than", "who", "what", "when", "where", "how",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// ── Deduplication ──────────────────────────────────────────────────────────

export interface DedupResult<T> {
  unique: T[];
  duplicateCount: number;
}

/**
 * Content-aware deduplication using tokenized Jaccard similarity.
 *
 * Why this replaces 50-char prefix matching:
 * - "Iran condemns US strikes on..." and "Iran condemns American strikes on..."
 *   have different prefixes but are the same story.
 * - Two different stories starting with "Tehran Times: Latest..." would be
 *   falsely deduplicated by prefix matching.
 *
 * Also catches exact URL duplicates (fastest path).
 */
export function deduplicateArticles<
  T extends { title: string; description: string; url: string },
>(articles: T[], threshold = 0.55): DedupResult<T> {
  const seen: { tokens: Set<string>; url: string }[] = [];
  const unique: T[] = [];
  let duplicateCount = 0;

  for (const article of articles) {
    const tokens = new Set(
      tokenize(`${article.title} ${article.description.slice(0, 200)}`)
    );

    let isDupe = false;
    for (const existing of seen) {
      if (article.url === existing.url) {
        isDupe = true;
        break;
      }
      if (jaccardSimilarity(tokens, existing.tokens) >= threshold) {
        isDupe = true;
        break;
      }
    }

    if (isDupe) {
      duplicateCount++;
    } else {
      seen.push({ tokens, url: article.url });
      unique.push(article);
    }
  }

  return { unique, duplicateCount };
}

// ── Story Clustering ───────────────────────────────────────────────────────

export interface ArticleCluster<T> {
  id: string;
  representative: T;
  members: T[];
  size: number;
  commonTopics: string[];
}

/**
 * Group related articles by content similarity.
 *
 * Used for:
 * - Diagnostic logging: "5 sources covering the same earthquake story"
 * - Cross-source validation: articles covered by 3+ sources are more credible
 * - Future: merge related stories into a single enriched view
 *
 * Algorithm: greedy single-pass clustering, O(n^2).
 * Acceptable because n < 200 articles per pipeline run.
 */
export function clusterArticles<
  T extends { title: string; description: string },
>(articles: T[], threshold = 0.35): ArticleCluster<T>[] {
  if (articles.length === 0) return [];

  const tokenSets = articles.map(
    (a) =>
      new Set(tokenize(`${a.title} ${a.description.slice(0, 200)}`))
  );

  const assigned = new Set<number>();
  const clusters: ArticleCluster<T>[] = [];

  for (let i = 0; i < articles.length; i++) {
    if (assigned.has(i)) continue;

    const memberIndices = [i];
    assigned.add(i);

    for (let j = i + 1; j < articles.length; j++) {
      if (assigned.has(j)) continue;
      if (jaccardSimilarity(tokenSets[i], tokenSets[j]) >= threshold) {
        memberIndices.push(j);
        assigned.add(j);
      }
    }

    // Common tokens across cluster (shared topic words)
    let common = new Set(tokenSets[memberIndices[0]]);
    for (let k = 1; k < memberIndices.length; k++) {
      const other = tokenSets[memberIndices[k]];
      for (const t of common) {
        if (!other.has(t)) common.delete(t);
      }
    }

    clusters.push({
      id: `c${i}`,
      representative: articles[memberIndices[0]],
      members: memberIndices.map((idx) => articles[idx]),
      size: memberIndices.length,
      commonTopics: [...common].slice(0, 8),
    });
  }

  return clusters.sort((a, b) => b.size - a.size);
}
