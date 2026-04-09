// ============================================================================
// PIPELINE OBSERVABILITY - Structured metrics + alerting
//
// Every pipeline run produces a PipelineRun record that is logged as
// structured JSON in production and human-readable in development.
// Alerts fire on anomalous conditions (majority source failure, zero output).
// ============================================================================

export interface PipelineRun {
  id: string;
  startedAt: number;
  completedAt: number;
  pipeline: "news" | "stories" | "videos" | "dashboard";

  // Ingestion
  sourcesAttempted: number;
  sourcesOk: number;
  sourcesFailed: number;
  sourcesCircuitOpen: number;

  // Processing
  articlesIngested: number;
  duplicatesRemoved: number;
  clustersFormed: number;
  articlesPublished: number;
  articlesInReview: number;
  articlesRejected: number;
  avgScore: number;

  // Image enrichment
  imagesAttempted: number;
  imagesOk: number;
  imagesRejected: number;

  // AI validation & resilience
  aiValidationRun: boolean;
  aiArticlesAdjusted: number;
  resilienceAction: string;

  // Diagnostics
  errors: string[];
  warnings: string[];
  sourceBreakdown: Record<
    string,
    { count: number; status: string }
  >;
}

let runCounter = 0;

export function createRun(pipeline: PipelineRun["pipeline"]): PipelineRun {
  runCounter++;
  return {
    id: `${pipeline}-${Date.now()}-${runCounter}`,
    startedAt: Date.now(),
    completedAt: 0,
    pipeline,
    sourcesAttempted: 0,
    sourcesOk: 0,
    sourcesFailed: 0,
    sourcesCircuitOpen: 0,
    articlesIngested: 0,
    duplicatesRemoved: 0,
    clustersFormed: 0,
    articlesPublished: 0,
    articlesInReview: 0,
    articlesRejected: 0,
    avgScore: 0,
    imagesAttempted: 0,
    imagesOk: 0,
    imagesRejected: 0,
    aiValidationRun: false,
    aiArticlesAdjusted: 0,
    resilienceAction: "normal",
    errors: [],
    warnings: [],
    sourceBreakdown: {},
  };
}

export function finalizeRun(run: PipelineRun): void {
  run.completedAt = Date.now();
  const durationMs = run.completedAt - run.startedAt;

  if (process.env.NODE_ENV === "production") {
    // Machine-parseable structured log for SIEM/Datadog/Sentry ingestion
    console.log(JSON.stringify({ event: "pipeline_complete", durationMs, ...run }));
  } else {
    // Human-readable summary for development
    const parts = [
      `[${run.pipeline}]`,
      `${durationMs}ms`,
      `sources: ${run.sourcesOk}/${run.sourcesAttempted}`,
      run.sourcesCircuitOpen > 0 ? `(${run.sourcesCircuitOpen} circuit-open)` : "",
      `ingested: ${run.articlesIngested}`,
      run.duplicatesRemoved > 0 ? `deduped: -${run.duplicatesRemoved}` : "",
      `published: ${run.articlesPublished}`,
      run.articlesInReview > 0 ? `review: ${run.articlesInReview}` : "",
      `rejected: ${run.articlesRejected}`,
      `avg: ${run.avgScore}`,
      run.clustersFormed > 0 ? `clusters: ${run.clustersFormed}` : "",
      run.imagesAttempted > 0
        ? `images: ${run.imagesOk}/${run.imagesAttempted}`
        : "",
      run.aiValidationRun ? `ai-adjusted: ${run.aiArticlesAdjusted}` : "",
      run.resilienceAction !== "normal" ? `resilience: ${run.resilienceAction}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
    console.log(parts);
  }

  if (run.errors.length > 0) {
    console.error(`[${run.pipeline}] ${run.errors.length} error(s):`, run.errors);
  }

  // ── Anomaly alerts ───────────────────────────────────────────────────
  if (run.sourcesFailed > run.sourcesOk && run.sourcesAttempted > 0) {
    console.warn(
      `[${run.pipeline}] ALERT: majority source failure ` +
        `(${run.sourcesFailed} failed vs ${run.sourcesOk} ok)`
    );
  }
  if (run.articlesPublished === 0 && run.articlesIngested > 0) {
    console.warn(
      `[${run.pipeline}] ALERT: zero articles published from ${run.articlesIngested} ingested`
    );
  }
  if (run.imagesRejected > run.imagesOk && run.imagesAttempted > 5) {
    console.warn(
      `[${run.pipeline}] ALERT: majority image verification failures ` +
        `(${run.imagesRejected} rejected vs ${run.imagesOk} ok)`
    );
  }
}
