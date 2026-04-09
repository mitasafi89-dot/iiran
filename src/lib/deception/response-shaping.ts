// ============================================================================
// RESPONSE SHAPING & TECHNOLOGY OBFUSCATION
// Make fingerprinting unreliable. Vary everything attackers try to measure.
// ============================================================================

import { getThreatScore } from "./threat-intel";

/**
 * Headers that leak technology stack information.
 * Remove or randomize these.
 */
const HEADERS_TO_STRIP = [
  "x-powered-by",
  "server",
  "x-aspnet-version",
  "x-runtime",
  "x-generator",
];

/**
 * Misleading server headers to rotate through.
 * Different on each request to frustrate fingerprinting.
 */
const DECOY_SERVERS = [
  "nginx/1.24.0",
  "Apache/2.4.57",
  "Microsoft-IIS/10.0",
  "cloudflare",
  "gws",
  "AmazonS3",
  "openresty/1.21.4.1",
  "LiteSpeed",
  "Kestrel",
  "Caddy",
];

// Rotate deterministically based on time window (changes every 5 min)
function getRotatingIndex(pool: unknown[], windowMs = 300_000): number {
  return Math.floor(Date.now() / windowMs) % pool.length;
}

/**
 * Apply response shaping to an outgoing response.
 * - Strips technology signatures
 * - Adds misleading headers
 * - Introduces timing variance for suspicious actors
 */
export function shapeResponseHeaders(
  headers: Headers,
  ip: string
): void {
  // Strip leaky headers
  for (const h of HEADERS_TO_STRIP) {
    headers.delete(h);
  }

  // Rotate fake server identity
  headers.set("server", DECOY_SERVERS[getRotatingIndex(DECOY_SERVERS)]);

  // Add misleading technology hints (changes periodically)
  const techHints = [
    ["x-asp-net-version", "4.0.30319"],
    ["x-runtime", "0.042"],
    ["x-request-id", crypto.randomUUID()],
  ];
  const hint = techHints[getRotatingIndex(techHints, 600_000)];
  headers.set(hint[0], hint[1]);

  // Never expose exact cache state to suspicious actors
  const score = getThreatScore(ip);
  if (score > 0) {
    headers.delete("x-cache");
    headers.delete("x-cache-hit");
    headers.delete("age");
  }
}

/**
 * Compute an artificial delay (ms) based on threat score.
 * Legitimate users: 0ms. Suspicious actors: progressive delay.
 * Includes jitter to prevent timing-based detection of the system.
 */
export function computeDelay(ip: string): number {
  const score = getThreatScore(ip);
  if (score <= 0) return 0;

  // Exponential backoff with jitter
  // Score 1-5: 50-200ms, Score 5-15: 200-1000ms, Score 15+: 1000-5000ms
  let baseDelay: number;
  if (score <= 5) {
    baseDelay = 50 + score * 30;
  } else if (score <= 15) {
    baseDelay = 200 + (score - 5) * 80;
  } else {
    baseDelay = Math.min(1000 + (score - 15) * 200, 5000);
  }

  // Add 10-30% jitter
  const jitter = baseDelay * (0.1 + Math.random() * 0.2);
  return Math.round(baseDelay + jitter);
}

/**
 * Vary JSON response field ordering to prevent structural fingerprinting.
 * Only applied to threat actors; legitimate users get consistent responses.
 */
export function shuffleResponseFields(
  obj: Record<string, unknown>,
  ip: string
): Record<string, unknown> {
  if (getThreatScore(ip) < 3) return obj;

  const entries = Object.entries(obj);
  // Fisher-Yates shuffle
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  return Object.fromEntries(entries);
}

/**
 * Generate fake ETag that looks real but is non-deterministic for attackers.
 */
export function generateDecoyEtag(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return `W/"${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}"`;
}

/**
 * Modify error responses for suspicious actors to be subtly misleading.
 * - Vary status codes slightly
 * - Add fake details
 * - Return inconsistent error structures
 */
export function shapeErrorResponse(
  status: number,
  message: string,
  ip: string
): { status: number; body: Record<string, unknown> } {
  const score = getThreatScore(ip);

  // Low threat: normal error
  if (score < 5) {
    return { status, body: { error: message } };
  }

  // Medium threat: add noise
  if (score < 15) {
    const errorFormats = [
      { error: message, code: `E${status}` },
      { message, statusCode: status },
      { errors: [{ msg: message }], status },
      { error: { message, type: "ClientError" } },
    ];
    return {
      status,
      body: errorFormats[Math.floor(Math.random() * errorFormats.length)],
    };
  }

  // High threat: misleading errors
  const misleading = [
    { status: 200, body: { success: true, data: null } }, // Fake success
    { status: 403, body: { error: "Insufficient permissions" } },
    { status: 401, body: { error: "Token expired", retry: true } },
    { status: 500, body: { error: "Temporary service disruption" } },
  ];
  return misleading[Math.floor(Math.random() * misleading.length)];
}
