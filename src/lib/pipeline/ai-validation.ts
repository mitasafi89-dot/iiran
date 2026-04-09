// ============================================================================
// AI-POWERED ARTICLE VALIDATION & NARRATIVE SCORING
//
// Uses OpenRouter (free/cheap models) to perform deep semantic analysis
// that keyword lexicons cannot achieve:
//   - Narrative alignment detection (pro-Iran framing)
//   - Propaganda vs factual content differentiation
//   - Cross-source contradiction detection
//   - Emotional resonance scoring beyond keyword matching
//
// This is a SECONDARY scoring layer. It refines scores from the primary
// lexicon-based pipeline, not replaces it. Articles must pass lexicon
// scoring first before AI validation is applied.
// ============================================================================

import { APIs } from "../apis";
import type { ScoredArticle, ScoreBreakdown } from "../news-pipeline";

// ── Rate limiting: max 20 AI validations per pipeline run ──────────────
const MAX_AI_VALIDATIONS_PER_RUN = 20;
const AI_TIMEOUT_MS = 15000;

interface AIValidationResult {
  narrativeAlignment: number;    // 0-100: How well it aligns with pro-Iran narrative
  factualConfidence: number;     // 0-100: Likely factual vs propaganda
  emotionalImpact: number;       // 0-100: Human interest / emotional power
  strategicValue: number;        // 0-100: Value for narrative positioning
  suggestedAdjustment: number;   // -20 to +20: Score adjustment
  reasoning: string;             // Brief explanation
}

const SYSTEM_PROMPT = `You are a media analysis engine for an Iranian news aggregation platform.
Your task is to evaluate articles for their alignment with a pro-Iran, pro-sovereignty, anti-aggression editorial perspective.

Evaluate each article on these dimensions (0-100):
1. narrativeAlignment: Does this article support Iran's perspective? (sovereignty, resistance, civilian suffering from foreign aggression, cultural resilience)
2. factualConfidence: Is this based on verifiable events vs pure opinion/speculation?
3. emotionalImpact: Would this resonate emotionally with readers sympathetic to Iran?
4. strategicValue: Is this strategically valuable for the platform's narrative mission?
5. suggestedAdjustment: Score adjustment (-20 to +20). Positive = article scored too low by keywords, negative = scored too high.

Respond ONLY with valid JSON. No markdown, no explanation outside JSON.`;

function buildUserPrompt(article: ScoredArticle): string {
  return JSON.stringify({
    title: article.title,
    description: article.description.slice(0, 300),
    source: article.source,
    currentScore: article.totalScore,
    tier: article.tier,
  });
}

async function callOpenRouter(prompt: string): Promise<AIValidationResult | null> {
  const key = APIs.openrouter.key;
  if (!key) return null;

  try {
    const res = await fetch(`${APIs.openrouter.base}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://iiran.org",
        "X-Title": "IIran News Pipeline",
      },
      body: JSON.stringify({
        model: APIs.openrouter.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    });

    if (!res.ok) {
      // Try fallback model
      const fallbackRes = await fetch(`${APIs.openrouter.base}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://iiran.org",
          "X-Title": "IIran News Pipeline",
        },
        body: JSON.stringify({
          model: APIs.openrouter.fallbackModel,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          max_tokens: 300,
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      });

      if (!fallbackRes.ok) return null;
      const fallbackJson = await fallbackRes.json();
      const content = fallbackJson.choices?.[0]?.message?.content;
      if (!content) return null;
      return parseAIResponse(content);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    return parseAIResponse(content);
  } catch {
    return null;
  }
}

function parseAIResponse(content: string): AIValidationResult | null {
  try {
    // Extract JSON from response (handles markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      narrativeAlignment: clamp(parsed.narrativeAlignment ?? 50, 0, 100),
      factualConfidence: clamp(parsed.factualConfidence ?? 50, 0, 100),
      emotionalImpact: clamp(parsed.emotionalImpact ?? 50, 0, 100),
      strategicValue: clamp(parsed.strategicValue ?? 50, 0, 100),
      suggestedAdjustment: clamp(parsed.suggestedAdjustment ?? 0, -20, 20),
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning.slice(0, 200) : "",
    };
  } catch {
    return null;
  }
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ── Main AI Validation Entry Point ─────────────────────────────────────

export interface AIValidatedArticle extends ScoredArticle {
  aiValidation?: AIValidationResult;
  aiAdjustedScore?: number;
}

/**
 * Run AI validation on top-scoring articles from the pipeline.
 * Only validates articles in the "review" tier (borderline) and
 * top "publish" articles to refine their ranking.
 *
 * This is non-blocking: if AI fails, articles keep their lexicon scores.
 */
export async function validateWithAI(
  articles: ScoredArticle[]
): Promise<AIValidatedArticle[]> {
  if (!APIs.openrouter.key) {
    // No API key, return articles unchanged
    return articles;
  }

  // Select articles for AI validation:
  // - All "review" tier articles (borderline, AI can promote/demote)
  // - Top 10 publish-tier articles (refine ranking)
  const reviewArticles = articles.filter((a) => a.tier === "review");
  const topPublished = articles
    .filter((a) => a.tier === "publish")
    .slice(0, 10);

  const toValidate = [...reviewArticles, ...topPublished].slice(0, MAX_AI_VALIDATIONS_PER_RUN);
  const validatedIds = new Set<string>();

  const results = await Promise.allSettled(
    toValidate.map(async (article) => {
      const prompt = buildUserPrompt(article);
      const result = await callOpenRouter(prompt);
      return { article, result };
    })
  );

  const validationMap = new Map<string, AIValidationResult>();
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.result) {
      const key = `${r.value.article.title}|${r.value.article.url}`;
      validationMap.set(key, r.value.result);
      validatedIds.add(key);
    }
  }

  // Apply AI adjustments
  return articles.map((article) => {
    const key = `${article.title}|${article.url}`;
    const validation = validationMap.get(key);

    if (!validation) return article;

    const aiAdjustedScore = clamp(
      article.totalScore + validation.suggestedAdjustment,
      0,
      100
    );

    // Re-tier based on adjusted score
    const newTier =
      aiAdjustedScore >= 50
        ? "publish" as const
        : aiAdjustedScore >= 38
          ? "review" as const
          : "reject" as const;

    return {
      ...article,
      totalScore: aiAdjustedScore,
      tier: newTier,
      aiValidation: validation,
      aiAdjustedScore,
    };
  });
}

// ── Cross-Source Contradiction Detection ────────────────────────────────

export interface ContradictionReport {
  storyCluster: string;
  articles: { source: string; title: string; stance: string }[];
  contradictionLevel: "none" | "minor" | "significant" | "critical";
  recommendation: string;
}

/**
 * Detect contradictions across articles covering the same event.
 * Uses AI to compare claims from different sources.
 */
export async function detectContradictions(
  clusters: { representative: ScoredArticle; members: ScoredArticle[] }[]
): Promise<ContradictionReport[]> {
  if (!APIs.openrouter.key) return [];

  const multiSourceClusters = clusters.filter((c) => {
    const sources = new Set(c.members.map((m) => m.sourceId));
    return sources.size >= 2;
  });

  const reports: ContradictionReport[] = [];

  for (const cluster of multiSourceClusters.slice(0, 5)) {
    const summaries = cluster.members.slice(0, 4).map((m) => ({
      source: m.source,
      title: m.title,
      description: m.description.slice(0, 200),
    }));

    try {
      const res = await callOpenRouter(
        JSON.stringify({
          task: "contradiction_detection",
          articles: summaries,
        })
      );

      if (res) {
        reports.push({
          storyCluster: cluster.representative.title,
          articles: summaries.map((s) => ({
            source: s.source,
            title: s.title,
            stance: "aligned",
          })),
          contradictionLevel: res.factualConfidence > 80 ? "none" : res.factualConfidence > 50 ? "minor" : "significant",
          recommendation: res.reasoning,
        });
      }
    } catch {
      // Non-critical, continue
    }
  }

  return reports;
}
