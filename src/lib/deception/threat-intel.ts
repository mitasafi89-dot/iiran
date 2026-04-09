// ============================================================================
// THREAT INTELLIGENCE ENGINE
// Captures, correlates, and profiles attacker behavior.
// Every malicious action produces actionable signal.
// ============================================================================

export interface ThreatSignal {
  type:
    | "honeypot_triggered"
    | "tripwire_hit"
    | "automation_detected"
    | "anomalous_timing"
    | "header_anomaly"
    | "payload_probe"
    | "path_traversal"
    | "canary_access"
    | "brute_force"
    | "enumeration"
    | "bot_field_filled"
    | "fake_admin_access"
    | "suspicious_navigation";
  severity: "low" | "medium" | "high" | "critical";
  ip: string;
  timestamp: number;
  details: Record<string, unknown>;
}

export interface AttackerProfile {
  ip: string;
  firstSeen: number;
  lastSeen: number;
  signals: ThreatSignal[];
  threatScore: number;
  tags: Set<string>;
  fingerprint: string;
  sessionIds: Set<string>;
}

// In-memory attacker intelligence store
// Production: replace with Redis/dedicated threat intel store
const attackerProfiles = new Map<string, AttackerProfile>();
const signalLog: ThreatSignal[] = [];
const MAX_SIGNAL_LOG = 10_000;
const MAX_PROFILES = 5_000;

// Cleanup profiles older than 24h every 5 min
const PROFILE_TTL = 86_400_000;
let lastProfileCleanup = Date.now();

function cleanupProfiles() {
  const now = Date.now();
  if (now - lastProfileCleanup < 300_000) return;
  lastProfileCleanup = now;
  for (const [ip, profile] of attackerProfiles) {
    if (now - profile.lastSeen > PROFILE_TTL) {
      attackerProfiles.delete(ip);
    }
  }
  // Trim signal log
  if (signalLog.length > MAX_SIGNAL_LOG) {
    signalLog.splice(0, signalLog.length - MAX_SIGNAL_LOG);
  }
}

const SEVERITY_SCORES: Record<ThreatSignal["severity"], number> = {
  low: 1,
  medium: 3,
  high: 7,
  critical: 15,
};

export function recordSignal(signal: ThreatSignal): AttackerProfile {
  cleanupProfiles();

  signalLog.push(signal);

  let profile = attackerProfiles.get(signal.ip);
  if (!profile) {
    if (attackerProfiles.size >= MAX_PROFILES) {
      // Evict oldest
      let oldestIp = "";
      let oldestTime = Infinity;
      for (const [ip, p] of attackerProfiles) {
        if (p.lastSeen < oldestTime) {
          oldestTime = p.lastSeen;
          oldestIp = ip;
        }
      }
      if (oldestIp) attackerProfiles.delete(oldestIp);
    }

    profile = {
      ip: signal.ip,
      firstSeen: signal.timestamp,
      lastSeen: signal.timestamp,
      signals: [],
      threatScore: 0,
      tags: new Set(),
      fingerprint: "",
      sessionIds: new Set(),
    };
    attackerProfiles.set(signal.ip, profile);
  }

  profile.lastSeen = signal.timestamp;
  profile.signals.push(signal);
  profile.threatScore += SEVERITY_SCORES[signal.severity];
  profile.tags.add(signal.type);

  // Keep per-profile signal log bounded
  if (profile.signals.length > 100) {
    profile.signals = profile.signals.slice(-100);
  }

  return profile;
}

export function getProfile(ip: string): AttackerProfile | undefined {
  return attackerProfiles.get(ip);
}

export function getThreatScore(ip: string): number {
  return attackerProfiles.get(ip)?.threatScore ?? 0;
}

export function isKnownThreat(ip: string, threshold = 5): boolean {
  return getThreatScore(ip) >= threshold;
}

/**
 * Generate behavioral fingerprint from request characteristics.
 * Combines non-PII signals to identify repeat attackers across IPs.
 */
export function generateBehavioralFingerprint(headers: Headers): string {
  const components = [
    headers.get("accept-language") ?? "",
    headers.get("accept-encoding") ?? "",
    headers.get("accept") ?? "",
    headers.get("sec-ch-ua") ?? "",
    headers.get("sec-ch-ua-platform") ?? "",
    headers.get("sec-ch-ua-mobile") ?? "",
    // Connection characteristics
    headers.get("connection") ?? "",
  ];

  // Simple hash - not crypto-grade, just for fingerprinting
  let hash = 0;
  const str = components.join("|");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `bf_${(hash >>> 0).toString(36)}`;
}

/**
 * Detect automation signals from request headers.
 * Strong signals (known bot UAs, headless browsers) are sufficient alone.
 * Weak signals (missing headers) require corroboration.
 * NOTE: Next.js 16's proxy layer may inject accept-language, sec-fetch-mode
 * before middleware runs, so missing-header checks are unreliable as sole signals.
 */
export function detectAutomation(headers: Headers): {
  isLikely: boolean;
  signals: string[];
} {
  const signals: string[] = [];
  let hasStrongSignal = false;

  // Missing standard browser headers (weak signals - framework may add these)
  if (!headers.get("accept-language")) signals.push("no_accept_language");
  if (!headers.get("accept-encoding")) signals.push("no_accept_encoding");
  if (!headers.get("sec-fetch-mode")) signals.push("no_sec_fetch");

  // Known automation user agents (STRONG signals)
  const ua = (headers.get("user-agent") ?? "").toLowerCase();
  const automationUAs = [
    "python-requests",
    "python-urllib",
    "go-http-client",
    "java/",
    "libwww",
    "wget",
    "curl",
    "httpie",
    "postman",
    "insomnia",
    "scrapy",
    "httpclient",
    "node-fetch",
    "axios",
    "got/",
    "undici",
    "mechanize",
    "aiohttp",
    "httpx",
  ];
  for (const bot of automationUAs) {
    if (ua.includes(bot)) {
      signals.push(`ua_${bot.replace(/[^a-z]/g, "")}`);
      hasStrongSignal = true;
    }
  }

  // Empty or missing user-agent (STRONG signal)
  if (!ua || ua.length < 10) {
    signals.push("suspicious_ua");
    hasStrongSignal = true;
  }

  // Headless browser indicators (STRONG signal)
  if (headers.get("sec-ch-ua")?.includes('"HeadlessChrome"')) {
    signals.push("headless_chrome");
    hasStrongSignal = true;
  }

  // Missing sec-ch-ua on modern Chromium (should always be present)
  if (ua.includes("chrome/") && !headers.get("sec-ch-ua"))
    signals.push("missing_sec_ch_ua_chromium");

  return {
    // One strong signal is enough; weak signals need corroboration
    isLikely: hasStrongSignal || signals.length >= 2,
    signals,
  };
}

/**
 * Analyze request timing patterns for a given IP.
 * Perfectly regular intervals indicate automation.
 */
export function analyzeTimingPattern(ip: string): {
  isRegular: boolean;
  avgIntervalMs: number;
} {
  const profile = attackerProfiles.get(ip);
  if (!profile || profile.signals.length < 5) {
    return { isRegular: false, avgIntervalMs: 0 };
  }

  const timestamps = profile.signals.map((s) => s.timestamp).sort();
  const intervals: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }

  if (intervals.length < 3) return { isRegular: false, avgIntervalMs: 0 };

  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance =
    intervals.reduce((sum, i) => sum + (i - avg) ** 2, 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation < 0.15 means suspiciously regular
  const cv = avg > 0 ? stdDev / avg : 0;

  return {
    isRegular: cv < 0.15 && avg < 5000, // Regular + fast = bot
    avgIntervalMs: avg,
  };
}

/**
 * Log structured threat intelligence event.
 * In production, pipe to SIEM (Splunk, Elastic, Datadog).
 */
export function logThreatIntel(signal: ThreatSignal): void {
  const entry = {
    _type: "threat_intel",
    ...signal,
    profile_score: getThreatScore(signal.ip),
    fingerprint: attackerProfiles.get(signal.ip)?.fingerprint,
  };

  if (process.env.NODE_ENV === "production") {
    console.log(JSON.stringify(entry));
  } else {
    console.log(
      `[THREAT] ${signal.severity.toUpperCase()} ${signal.type}`,
      signal.details
    );
  }
}

/**
 * Get intelligence summary for monitoring dashboards.
 */
export function getIntelSummary(): {
  activeThreats: number;
  totalSignals: number;
  topThreats: Array<{ ip: string; score: number; tags: string[] }>;
} {
  const topThreats = Array.from(attackerProfiles.values())
    .sort((a, b) => b.threatScore - a.threatScore)
    .slice(0, 10)
    .map((p) => ({
      ip: p.ip,
      score: p.threatScore,
      tags: Array.from(p.tags),
    }));

  return {
    activeThreats: attackerProfiles.size,
    totalSignals: signalLog.length,
    topThreats,
  };
}
