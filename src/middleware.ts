import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isTripwire,
  triggerTripwire,
  getFakeAdminPage,
  getFakeEnvFile,
  getFakeGitContent,
  getFakeApiResponse,
  generateBehavioralFingerprint,
  detectAutomation,
  recordSignal,
  getThreatScore,
  shapeResponseHeaders,
  computeDelay,
  recordNavigation,
  detectSuspiciousNavigation,
  evaluateAutoDefense,
  isBlocked,
  classifySession,
} from "@/lib/deception";

// ============================================================================
// EDGE MIDDLEWARE — Runs on EVERY request at the edge
// Implements: Security headers, CSP, origin validation, deception layer
// ============================================================================

// Nonce generation for CSP (crypto available at edge)
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

// Allowed origins for API requests
const ALLOWED_ORIGINS = new Set([
  "https://iiran.org",
  "https://www.iiran.org",
  // Dev origins
  ...(process.env.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://127.0.0.1:3000"]
    : []),
]);

// Extract client IP (duplicated here to avoid importing from non-edge module)
function getIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = generateNonce();
  const ip = getIp(request);

  // ══════════════════════════════════════════════════════════════════════
  // PHASE 1: DECEPTION LAYER — Intercept before normal routing
  // ══════════════════════════════════════════════════════════════════════

  // ── Record navigation for flow analysis ────────────────────────────
  recordNavigation(ip, pathname);

  // ── Behavioral fingerprinting ──────────────────────────────────────
  const fingerprint = generateBehavioralFingerprint(request.headers);

  // ── Automation detection ───────────────────────────────────────────
  const automation = detectAutomation(request.headers);
  if (automation.isLikely) {
    recordSignal({
      type: "automation_detected",
      severity: "medium",
      ip,
      timestamp: Date.now(),
      details: { signals: automation.signals, fingerprint },
    });
  }

  // ── Suspicious navigation patterns ─────────────────────────────────
  if (detectSuspiciousNavigation(ip)) {
    recordSignal({
      type: "suspicious_navigation",
      severity: "medium",
      ip,
      timestamp: Date.now(),
      details: { pathname, fingerprint },
    });
  }

  // ── Evaluate auto-defense based on accumulated threat score ────────
  evaluateAutoDefense(ip);

  // ── Tripwire detection — honeypot paths (ALWAYS served) ────────────
  // Serve decoy content regardless of block status. Honeypots are more
  // valuable than blocking — they waste attacker time and gather intel.
  if (isTripwire(pathname)) {
    triggerTripwire(pathname, ip, request.headers);
    evaluateAutoDefense(ip);

    // Serve convincing decoy content based on what they're probing
    return await serveTripwireResponse(pathname, ip);
  }

  // ── Hard block for confirmed hostile actors ────────────────────────
  // Only blocks non-tripwire routes. Attackers still see honeypots.
  if (isBlocked(ip)) {
    // Don't return 403 (tells them they're blocked).
    // Return a tarpit: slow, misleading response.
    await sleep(2000 + Math.random() * 3000);
    return new NextResponse("Service Unavailable", {
      status: 503,
      headers: { "retry-after": String(30 + Math.floor(Math.random() * 60)) },
    });
  }

  // ── Tarpit: add progressive delays for suspicious actors ───────────
  const delay = computeDelay(ip);
  if (delay > 0) {
    await sleep(delay);
  }

  // ══════════════════════════════════════════════════════════════════════
  // PHASE 2: STANDARD SECURITY — Origin validation, headers
  // ══════════════════════════════════════════════════════════════════════

  // ── Origin validation for mutating API requests ────────────────────
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const method = request.method;

    if (
      pathname.startsWith("/api/v1/") ||
      pathname.startsWith("/api/graphql") ||
      pathname.startsWith("/api/internal/")
    ) {
      // Decoy routes: let them through to the honeypot handlers
    } else if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      // For all other mutating requests, enforce origin
      if (!origin || !ALLOWED_ORIGINS.has(origin)) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }
  }

  const response = NextResponse.next();

  // ── Pass nonce to downstream via request header (NOT response header) --
  // SECURITY: Never expose the nonce in a response header. Leaked nonces
  // allow an attacker with partial XSS to bypass CSP entirely.
  // Use request headers or Next.js metadata instead.
  response.headers.set("x-nonce", nonce);
  // TODO: Migrate to Next.js built-in nonce propagation and remove this
  // response header. For now it remains for hydration compatibility.

  // ── Content Security Policy ────────────────────────────────────────
  // Strict CSP with nonce for inline scripts (Next.js hydration)
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`, // Next.js injects styles; nonce for styles is not yet universally supported
    `img-src 'self' data: blob: https://images.unsplash.com https://upload.wikimedia.org https://i.ytimg.com https://i.guim.co.uk https://media.guim.co.uk https://reliefweb.int https://images.pexels.com https://pixabay.com https://media.mehrnews.com https://*.presstv.ir https://cdn.presstv.ir https://static.presstv.ir https://cdn-media.tass.ru https://cdnph.upi.com https://*.tehrantimes.com https://*.aljazeera.com https://*.aljazeera.net https://*.middleeasteye.net https://*.tass.com https://*.tass.ru https://*.supabase.co`,
    `font-src 'self' https://fonts.gstatic.com`,
    `connect-src 'self' https://*.supabase.co`,
    `frame-src 'none'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // ══════════════════════════════════════════════════════════════════════
  // PHASE 3: RESPONSE SHAPING — Obfuscate technology stack
  // ══════════════════════════════════════════════════════════════════════

  // Apply deception layer to all response headers
  shapeResponseHeaders(response.headers, ip);

  // ── Security Headers ───────────────────────────────────────────────

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME-type sniffing (stops browsers from executing non-JS as JS)
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Control Referer header leakage
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // HSTS: Force HTTPS for 2 years, include subdomains, preload-ready
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  // Lock down browser features not used by this app
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  );

  // Prevent DNS prefetch abuse
  response.headers.set("X-DNS-Prefetch-Control", "off");

  // Prevent IE from opening downloads in site context
  response.headers.set("X-Download-Options", "noopen");

  // Prevent cross-origin info leakage
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");

  // Cross-Origin policies for isolation
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Cross-Origin-Embedder-Policy", "credentialless");

  // ── Pass session classification to downstream routes ───────────────
  const sessionTag = classifySession(ip);
  response.headers.set("x-session-tag", sessionTag);
  response.headers.set("x-threat-score", String(getThreatScore(ip)));

  // ── Cache control for sensitive pages ──────────────────────────────
  if (pathname.startsWith("/api/")) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
  }

  return response;
}

// ══════════════════════════════════════════════════════════════════════════
// TRIPWIRE RESPONSE HANDLERS — Serve convincing decoy content
// ══════════════════════════════════════════════════════════════════════════

async function serveTripwireResponse(
  pathname: string,
  ip: string
): Promise<NextResponse> {
  const normalized = pathname.toLowerCase();

  // Add realistic processing delay
  await sleep(80 + Math.random() * 200);

  // Fake admin panels
  if (
    normalized.includes("admin") ||
    normalized.includes("wp-admin") ||
    normalized.includes("wp-login")
  ) {
    return new NextResponse(getFakeAdminPage(ip), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        server: "Apache/2.4.57",
      },
    });
  }

  // Fake .env / config files
  if (normalized.includes(".env")) {
    return new NextResponse(getFakeEnvFile(ip), {
      status: 200,
      headers: { "content-type": "text/plain", server: "nginx/1.24.0" },
    });
  }

  // Fake .git files
  if (normalized.includes(".git")) {
    return new NextResponse(getFakeGitContent(pathname, ip), {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
  }

  // Fake API endpoints
  if (normalized.includes("/api/")) {
    const body = getFakeApiResponse(pathname, ip);
    return NextResponse.json(body, {
      headers: { "x-request-id": crypto.randomUUID() },
    });
  }

  // Actuator / Spring Boot probes
  if (normalized.includes("actuator")) {
    return NextResponse.json({
      status: "UP",
      components: {
        db: { status: "UP" },
        redis: { status: "UP" },
        diskSpace: { status: "UP", total: 107374182400, free: 85899345920 },
      },
    });
  }

  // phpMyAdmin / database probes
  if (
    normalized.includes("phpmyadmin") ||
    normalized.includes("pma") ||
    normalized.includes("mysql")
  ) {
    return new NextResponse(
      "<html><body><h1>phpMyAdmin</h1><p>Access denied. Authentication required.</p></body></html>",
      {
        status: 401,
        headers: {
          "content-type": "text/html",
          "www-authenticate": 'Basic realm="phpMyAdmin"',
          server: "Apache/2.4.57",
        },
      }
    );
  }

  // Backup / SQL file probes
  if (/\.(sql|bak|old|orig)$/i.test(normalized)) {
    return new NextResponse(
      "-- MySQL dump\n-- Server version 8.0.33\n-- Access denied for user 'root'@'%'\n",
      {
        status: 200,
        headers: {
          "content-type": "application/octet-stream",
          "content-disposition": "attachment",
        },
      }
    );
  }

  // Default: generic 404 with misleading server header
  return new NextResponse("Not Found", {
    status: 404,
    headers: { server: "nginx/1.24.0" },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
