import { type NextRequest, NextResponse } from "next/server";
import { getCachedImageUrl } from "@/lib/image-cache";

// ── CORS header for image proxy responses ────────────────────────────────
const CORS_HEADER = { "Access-Control-Allow-Origin": "https://iiran.org" };

// ── Domain allowlist — exact hostnames only, no wildcards ───────────────
// Wildcards (e.g. *.presstv.ir) are dangerous: an attacker who can register
// or compromise any subdomain gains access to the proxy. Use exact names.
const ALLOWED_HOSTS = new Set([
  // Iranian state media
  "media.mehrnews.com",
  "static.presstv.ir",
  "cdn.presstv.ir",
  "img.presstv.ir",
  "en.mehrnews.com",
  // Wire services / international
  "cdn-media.tass.ru",
  "cdnph.upi.com",
  "reliefweb.int",
  "news.un.org",
  "images.aljazeera.net",
  "www.aljazeera.com",
  "static.middleeasteye.net",
  "www.trtworld.com",
  "www.cgtn.com",
  "www.xinhuanet.com",
  "www.globaltimes.cn",
  "www.chinadaily.com.cn",
  "www.dawn.com",
  "www.tehrantimes.com",
  "www.tasnimnews.com",
  "en.farsnews.ir",
  "en.isna.ir",
  "www.mintpressnews.com",
  "thegrayzone.com",
  "www.rt.com",
  "sputnikglobe.com",
  "www.irna.ir",
  // Stock / illustration
  "images.unsplash.com",
  "upload.wikimedia.org",
  "i.ytimg.com",
  "images.pexels.com",
  "pixabay.com",
  // Supabase Storage (own CDN)
  "uivwihnytvmlnkyzuxmo.supabase.co",
]);

// ── Private / loopback IP range detection ───────────────────────────────
// Prevents SSRF against internal services even if hostname resolves locally.
// We check the literal hostname string; for full protection the fetch itself
// must not follow redirects to private addresses (set redirect: "error" below).
const PRIVATE_HOST_RE =
  /^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i;

const PRIVATE_IP_RE =
  /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:)/i;

function isPrivateHost(hostname: string): boolean {
  return PRIVATE_HOST_RE.test(hostname) || PRIVATE_IP_RE.test(hostname);
}

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTS.has(hostname.toLowerCase());
}

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse(null, { status: 400, headers: CORS_HEADER });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse(null, { status: 400, headers: CORS_HEADER });
  }

  if (parsed.protocol !== "https:") {
    return new NextResponse(null, { status: 400, headers: CORS_HEADER });
  }

  // Block requests to loopback, RFC-1918, and other private address ranges
  if (isPrivateHost(parsed.hostname)) {
    return new NextResponse(null, { status: 403, headers: CORS_HEADER });
  }

  if (!isAllowedHost(parsed.hostname)) {
    return new NextResponse(null, { status: 403, headers: CORS_HEADER });
  }

  // Check Supabase Storage cache first
  try {
    const cachedUrl = await getCachedImageUrl(url);
    if (cachedUrl) {
      return NextResponse.redirect(cachedUrl, {
        status: 302,
        headers: {
          ...CORS_HEADER,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }
  } catch {
    // Cache miss or DB unavailable, fall through to proxy
  }

  try {
    const upstream = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      // Never follow redirects — a redirect to a private IP would bypass the
      // hostname check above and enable SSRF against internal services.
      redirect: "error",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      },
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: 502, headers: CORS_HEADER });
    }

    const ct = upstream.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) {
      return new NextResponse(null, { status: 502, headers: CORS_HEADER });
    }

    // Enforce max size
    const cl = upstream.headers.get("content-length");
    if (cl && parseInt(cl) > MAX_SIZE) {
      return new NextResponse(null, { status: 502, headers: CORS_HEADER });
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        ...CORS_HEADER,
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502, headers: CORS_HEADER });
  }
}
