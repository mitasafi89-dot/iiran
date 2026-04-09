import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useCache: true,
  },

  // ── Hardening: disable unnecessary features ─────────────────────────
  // Disable server-side source maps in production (prevents stack trace leakage)
  productionBrowserSourceMaps: false,

  // Disable x-powered-by header (information disclosure)
  poweredByHeader: false,

  cacheLife: {
    newsPipeline: {
      stale: 300,       // serve stale for 5 min while revalidating
      revalidate: 21600, // revalidate every 6 hours
      expire: 86400,     // expire after 1 day without traffic
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Allow /api/img proxy with query strings through /_next/image optimizer
    localPatterns: [
      {
        pathname: "/api/img",
        // search omitted = allows all query parameters (needed for ?url=...)
      },
      {
        pathname: "/**",
        search: "",
        // All other local paths: no query strings allowed
      },
    ],
    // Explicit allowlist of remote image origins (prevents SSRF via image proxy)
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "reliefweb.int" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "pixabay.com" },
      // Iranian media CDNs
      { protocol: "https", hostname: "media.mehrnews.com" },
      { protocol: "https", hostname: "*.presstv.ir" },
      { protocol: "https", hostname: "static.presstv.ir" },
      { protocol: "https", hostname: "cdn.presstv.ir" },
      { protocol: "https", hostname: "cdnph.upi.com" },
      { protocol: "https", hostname: "*.tehrantimes.com" },
      // TASS CDN
      { protocol: "https", hostname: "cdn-media.tass.ru" },
      // News og:image CDNs (for scraped article images)
      { protocol: "https", hostname: "*.aljazeera.com" },
      { protocol: "https", hostname: "*.aljazeera.net" },
      { protocol: "https", hostname: "*.middleeasteye.net" },
      { protocol: "https", hostname: "*.trtworld.com" },
      { protocol: "https", hostname: "*.dailysabah.com" },
      { protocol: "https", hostname: "*.dawn.com" },
      { protocol: "https", hostname: "*.thenews.com.pk" },
      { protocol: "https", hostname: "*.timesofIndia.com" },
      { protocol: "https", hostname: "*.hindustantimes.com" },
      { protocol: "https", hostname: "*.scmp.com" },
      { protocol: "https", hostname: "*.cgtn.com" },
      { protocol: "https", hostname: "*.xinhuanet.com" },
      { protocol: "https", hostname: "*.globaltimes.cn" },
      { protocol: "https", hostname: "*.tass.com" },
      { protocol: "https", hostname: "*.tass.ru" },
      { protocol: "https", hostname: "news.un.org" },
      { protocol: "https", hostname: "*.icrc.org" },
      // Supabase Storage (cached images)
      { protocol: "https", hostname: "*.supabase.co" },
    ],
    // Limit image optimization sizes to prevent resource exhaustion
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Limit concurrent image optimizations
    minimumCacheTTL: 3600,
  },
};

export default nextConfig;
