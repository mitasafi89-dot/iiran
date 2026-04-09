// ============================================================================
// ADAPTIVE DEFENSE SYSTEM
// Self-healing, dynamic defense layer that adjusts in real-time.
// Rate limits, validation, and responses shift based on threat landscape.
// ============================================================================

import {
  getThreatScore,
  recordSignal,
  logThreatIntel,
  type ThreatSignal,
} from "./threat-intel";

// ── Adaptive Rate Limiting ──────────────────────────────────────────────
// Rate limits tighten for suspicious actors and relax for trusted ones.

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

interface AdaptiveConfig {
  base: RateLimitConfig;
  /** Multiplier for trusted users (score 0) */
  trustedMultiplier: number;
  /** Divisor for hostile users per threat point */
  hostileReductionPerPoint: number;
  /** Absolute minimum limit even for hostiles */
  floor: number;
}

const DEFAULT_ADAPTIVE: AdaptiveConfig = {
  base: { limit: 30, windowMs: 60_000 },
  trustedMultiplier: 1.5,
  hostileReductionPerPoint: 0.08,
  floor: 2,
};

export function getAdaptiveRateLimit(
  ip: string,
  config: AdaptiveConfig = DEFAULT_ADAPTIVE
): RateLimitConfig {
  const score = getThreatScore(ip);

  if (score === 0) {
    return {
      limit: Math.ceil(config.base.limit * config.trustedMultiplier),
      windowMs: config.base.windowMs,
    };
  }

  // Progressive reduction
  const reduction = 1 - score * config.hostileReductionPerPoint;
  const adjustedLimit = Math.max(
    config.floor,
    Math.ceil(config.base.limit * Math.max(0.1, reduction))
  );

  // Also shrink the window (faster reset = more granular blocking)
  const adjustedWindow = Math.max(
    10_000,
    config.base.windowMs * Math.max(0.3, reduction)
  );

  return {
    limit: adjustedLimit,
    windowMs: Math.round(adjustedWindow),
  };
}

// ── Session Tagging ─────────────────────────────────────────────────────
// Tag sessions as hostile/suspicious for downstream handling.

export type SessionTag = "trusted" | "neutral" | "suspicious" | "hostile" | "confirmed_bot";

export function classifySession(ip: string): SessionTag {
  const score = getThreatScore(ip);
  if (score >= 15) return "hostile";
  if (score >= 8) return "confirmed_bot";
  if (score >= 3) return "suspicious";
  if (score === 0) return "trusted";
  return "neutral";
}

// ── Payload Probe Detection ─────────────────────────────────────────────
// Detect common attack payloads in request bodies and parameters.

const PROBE_PATTERNS = [
  // SQL injection
  /(\bunion\b.*\bselect\b|\bor\b\s+1\s*=\s*1|'\s*--|\bdrop\b\s+\btable\b)/i,
  // XSS
  /(<script|javascript:|on\w+\s*=|<img[^>]+onerror)/i,
  // Path traversal
  /(\.\.\/|\.\.\\|%2e%2e)/i,
  // Command injection
  /(;\s*(ls|cat|wget|curl|bash|sh|nc|ncat)\b|\|\||\$\(|`)/i,
  // SSTI
  /(\{\{.*\}\}|\$\{.*\}|<%.*%>)/,
  // Log4Shell
  /\$\{jndi:/i,
  // XXE
  /(<!ENTITY|<!DOCTYPE.*\[)/i,
];

export function detectPayloadProbe(
  input: string,
  ip: string
): boolean {
  for (const pattern of PROBE_PATTERNS) {
    if (pattern.test(input)) {
      const signal: ThreatSignal = {
        type: "payload_probe",
        severity: "high",
        ip,
        timestamp: Date.now(),
        details: {
          pattern: pattern.source.slice(0, 60),
          sample: input.slice(0, 200),
        },
      };
      recordSignal(signal);
      logThreatIntel(signal);
      return true;
    }
  }
  return false;
}

/**
 * Deep-scan a request body for probe patterns.
 * Recursively checks all string values in nested objects.
 */
export function scanBodyForProbes(
  body: unknown,
  ip: string,
  depth = 0
): boolean {
  if (depth > 5) return false; // Prevent stack overflow

  if (typeof body === "string") {
    return detectPayloadProbe(body, ip);
  }

  if (Array.isArray(body)) {
    return body.some((item) => scanBodyForProbes(item, ip, depth + 1));
  }

  if (body && typeof body === "object") {
    for (const key of Object.keys(body)) {
      // Check keys too (attackers sometimes put payloads in keys)
      if (detectPayloadProbe(key, ip)) return true;
      if (
        scanBodyForProbes(
          (body as Record<string, unknown>)[key],
          ip,
          depth + 1
        )
      )
        return true;
    }
  }

  return false;
}

// ── Navigation Flow Analysis ────────────────────────────────────────────
// Legitimate users follow predictable navigation patterns.
// Scanners jump directly to deep endpoints.

const navigationHistory = new Map<string, string[]>();
let lastNavCleanup = Date.now();

function cleanupNavHistory() {
  const now = Date.now();
  if (now - lastNavCleanup < 60_000) return;
  lastNavCleanup = now;
  // Simple eviction: clear if too large
  if (navigationHistory.size > 10_000) {
    navigationHistory.clear();
  }
}

export function recordNavigation(ip: string, pathname: string): void {
  cleanupNavHistory();
  const history = navigationHistory.get(ip) ?? [];
  history.push(pathname);
  // Keep last 20 paths
  if (history.length > 20) history.shift();
  navigationHistory.set(ip, history);
}

export function detectSuspiciousNavigation(ip: string): boolean {
  const history = navigationHistory.get(ip);
  if (!history || history.length < 3) return false;

  // Check for signs of scanning:
  // 1. Rapid deep-path access without visiting shallow pages
  const hasHomepage = history.some(
    (p) => p === "/" || p === "/index" || p === ""
  );
  const deepPaths = history.filter((p) => (p.match(/\//g) ?? []).length >= 3);

  if (!hasHomepage && deepPaths.length > 3) {
    return true;
  }

  // 2. Accessing many different top-level paths (enumeration)
  const uniqueTopPaths = new Set(
    history.map((p) => "/" + (p.split("/")[1] ?? ""))
  );
  if (uniqueTopPaths.size > 8) {
    return true;
  }

  return false;
}

// ── Self-Healing Triggers ───────────────────────────────────────────────
// Automatic response to detected threats.

export interface DefenseAction {
  type: "rate_limit_tighten" | "session_invalidate" | "block" | "tarpit" | "deceive";
  target: string;
  duration: number;
  reason: string;
}

const activeDefenses = new Map<string, DefenseAction[]>();

export function triggerDefense(ip: string, action: DefenseAction): void {
  const existing = activeDefenses.get(ip) ?? [];
  existing.push(action);
  activeDefenses.set(ip, existing);

  // Auto-expire defenses
  setTimeout(() => {
    const actions = activeDefenses.get(ip);
    if (actions) {
      const idx = actions.indexOf(action);
      if (idx >= 0) actions.splice(idx, 1);
      if (actions.length === 0) activeDefenses.delete(ip);
    }
  }, action.duration);
}

export function getActiveDefenses(ip: string): DefenseAction[] {
  return activeDefenses.get(ip) ?? [];
}

export function isBlocked(ip: string): boolean {
  return (activeDefenses.get(ip) ?? []).some((a) => a.type === "block");
}

export function isTarpitted(ip: string): boolean {
  return (activeDefenses.get(ip) ?? []).some((a) => a.type === "tarpit");
}

/**
 * Auto-trigger defenses based on threat score thresholds.
 * Called after each signal recording.
 */
export function evaluateAutoDefense(ip: string): void {
  const score = getThreatScore(ip);
  const existing = activeDefenses.get(ip) ?? [];
  const existingTypes = new Set(existing.map((a) => a.type));

  // Score 3+: tighten rate limits
  if (score >= 3 && !existingTypes.has("rate_limit_tighten")) {
    triggerDefense(ip, {
      type: "rate_limit_tighten",
      target: ip,
      duration: 600_000, // 10 min
      reason: `threat_score_${score}`,
    });
  }

  // Score 10+: tarpit (add delays)
  if (score >= 10 && !existingTypes.has("tarpit")) {
    triggerDefense(ip, {
      type: "tarpit",
      target: ip,
      duration: 900_000, // 15 min
      reason: `threat_score_${score}`,
    });
  }

  // Score 20+: serve deception responses only
  if (score >= 20 && !existingTypes.has("deceive")) {
    triggerDefense(ip, {
      type: "deceive",
      target: ip,
      duration: 1_800_000, // 30 min
      reason: `threat_score_${score}`,
    });
  }

  // Score 30+: block entirely
  if (score >= 30 && !existingTypes.has("block")) {
    triggerDefense(ip, {
      type: "block",
      target: ip,
      duration: 3_600_000, // 1 hour
      reason: `threat_score_${score}`,
    });
  }
}
