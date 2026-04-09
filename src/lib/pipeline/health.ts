// ============================================================================
// SOURCE HEALTH TRACKING + CIRCUIT BREAKER
// Process-level state. Resets on cold start (acceptable for serverless).
// Prevents a single instance from hammering dead sources repeatedly.
// ============================================================================

interface SourceRecord {
  consecutiveFailures: number;
  lastSuccessAt: number;
  lastFailureAt: number;
  circuitOpenUntil: number;
  totalRequests: number;
  totalFailures: number;
  latencySamples: number[];
}

const registry = new Map<string, SourceRecord>();

// After 3 consecutive failures, stop attempting for 30 minutes
const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 30 * 60 * 1000;
const MAX_LATENCY_SAMPLES = 20;

function ensure(id: string): SourceRecord {
  let r = registry.get(id);
  if (!r) {
    r = {
      consecutiveFailures: 0,
      lastSuccessAt: 0,
      lastFailureAt: 0,
      circuitOpenUntil: 0,
      totalRequests: 0,
      totalFailures: 0,
      latencySamples: [],
    };
    registry.set(id, r);
  }
  return r;
}

/**
 * Check if a source's circuit breaker is open (should not be attempted).
 * After cooldown expires, allows one "half-open" probe request.
 */
export function isCircuitOpen(sourceId: string): boolean {
  const r = ensure(sourceId);
  if (r.circuitOpenUntil <= 0) return false;
  if (Date.now() >= r.circuitOpenUntil) {
    // Cooldown expired, allow one probe
    r.circuitOpenUntil = 0;
    return false;
  }
  return true;
}

export function recordSuccess(sourceId: string, latencyMs: number): void {
  const r = ensure(sourceId);
  r.consecutiveFailures = 0;
  r.lastSuccessAt = Date.now();
  r.totalRequests++;
  r.circuitOpenUntil = 0;
  r.latencySamples.push(latencyMs);
  if (r.latencySamples.length > MAX_LATENCY_SAMPLES) r.latencySamples.shift();
}

export function recordFailure(sourceId: string): void {
  const r = ensure(sourceId);
  r.consecutiveFailures++;
  r.lastFailureAt = Date.now();
  r.totalRequests++;
  r.totalFailures++;
  if (r.consecutiveFailures >= CIRCUIT_THRESHOLD) {
    r.circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
  }
}

export type SourceStatus = "healthy" | "degraded" | "circuit-open";

export interface SourceHealthSnapshot {
  status: SourceStatus;
  consecutiveFailures: number;
  failureRate: number;
  avgLatencyMs: number;
}

export function getHealthSnapshot(): Record<string, SourceHealthSnapshot> {
  const snap: Record<string, SourceHealthSnapshot> = {};
  for (const [id, r] of registry) {
    const failureRate =
      r.totalRequests > 0 ? r.totalFailures / r.totalRequests : 0;
    const avgLatency =
      r.latencySamples.length > 0
        ? r.latencySamples.reduce((a, b) => a + b, 0) /
          r.latencySamples.length
        : 0;
    snap[id] = {
      status:
        r.circuitOpenUntil > Date.now()
          ? "circuit-open"
          : r.consecutiveFailures > 0
            ? "degraded"
            : "healthy",
      consecutiveFailures: r.consecutiveFailures,
      failureRate: Math.round(failureRate * 1000) / 1000,
      avgLatencyMs: Math.round(avgLatency),
    };
  }
  return snap;
}
