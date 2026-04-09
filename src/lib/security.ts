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

/**
 * Validate a URL from an untrusted source (RSS feed, API response).
 * Rejects javascript:, data:, vbscript:, and other dangerous schemes.
 * Returns null if the URL is unsafe.
 */
export function sanitizeExternalUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}
