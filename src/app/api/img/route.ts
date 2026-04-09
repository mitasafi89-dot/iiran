import { type NextRequest, NextResponse } from "next/server";
import { getCachedImageUrl } from "@/lib/image-cache";

// ── Domain allowlist (matches next.config.ts remotePatterns) ────────────
const ALLOWED_EXACT = new Set([
  "media.mehrnews.com",
  "static.presstv.ir",
  "cdn.presstv.ir",
  "cdn-media.tass.ru",
  "cdnph.upi.com",
  "reliefweb.int",
  "news.un.org",
  "images.unsplash.com",
  "upload.wikimedia.org",
  "i.ytimg.com",
  "images.pexels.com",
  "pixabay.com",
  "uivwihnytvmlnkyzuxmo.supabase.co",
]);

const ALLOWED_SUFFIX = [
  ".tehrantimes.com",
  ".presstv.ir",
  ".aljazeera.com",
  ".aljazeera.net",
  ".middleeasteye.net",
  ".trtworld.com",
  ".dailysabah.com",
  ".dawn.com",
  ".thenews.com.pk",
  ".timesofindia.com",
  ".hindustantimes.com",
  ".scmp.com",
  ".cgtn.com",
  ".xinhuanet.com",
  ".globaltimes.cn",
  ".tass.com",
  ".tass.ru",
  ".icrc.org",
  ".mehrnews.com",
  ".irna.ir",
  ".tasnimnews.com",
  ".farsnews.ir",
  ".isna.ir",
  ".aa.com.tr",
  ".mintpressnews.com",
  ".thegrayzone.com",
  ".rt.com",
  ".sputnikglobe.com",
  ".chinadaily.com.cn",
  ".globaltimes.cn",
];

function isAllowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (ALLOWED_EXACT.has(h)) return true;
  return ALLOWED_SUFFIX.some((suffix) => h === suffix.slice(1) || h.endsWith(suffix));
}

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse(null, { status: 400 });
  }

  // Check Supabase Storage cache first
  try {
    const cachedUrl = await getCachedImageUrl(url);
    if (cachedUrl) {
      return NextResponse.redirect(cachedUrl, { status: 302, headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      }});
    }
  } catch {
    // Cache miss or DB unavailable, fall through to proxy
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (parsed.protocol !== "https:") {
    return new NextResponse(null, { status: 400 });
  }

  if (!isAllowedHost(parsed.hostname)) {
    return new NextResponse(null, { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      },
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: 502 });
    }

    const ct = upstream.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) {
      return new NextResponse(null, { status: 502 });
    }

    // Enforce max size
    const cl = upstream.headers.get("content-length");
    if (cl && parseInt(cl) > MAX_SIZE) {
      return new NextResponse(null, { status: 502 });
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
