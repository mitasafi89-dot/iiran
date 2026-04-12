// ============================================================================
// SECURITY UTILITIES
// Centralized security functions for API routes
// ============================================================================

import type { NextRequest } from "next/server";

/**
 * Extract client IP from request headers.
 * Works behind proxies/CDNs (Cloudflare, Vercel, etc.).
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// Matches loopback, RFC-1918 private ranges, link-local, and common internal hostnames.
// Used to prevent SSRF when URLs come from untrusted external sources (RSS feeds, APIs).
const PRIVATE_HOST_RE = /^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i;
const PRIVATE_IP_RE =
  /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1$|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:)/i;

/**
 * Validate a URL from an untrusted source (RSS feed, API response).
 * Rejects javascript:, data:, vbscript:, private/loopback IPs, and other
 * dangerous schemes or destinations. Returns null if the URL is unsafe.
 */
export function sanitizeExternalUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    const host = parsed.hostname.toLowerCase();
    if (PRIVATE_HOST_RE.test(host) || PRIVATE_IP_RE.test(host)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}
