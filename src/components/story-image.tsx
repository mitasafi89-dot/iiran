"use client";

import Image from "next/image";
import { useState, useCallback } from "react";

interface StoryImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  preload?: boolean;
}

/**
 * Optimized image component for news/story cards.
 *
 * Uses Next.js <Image> for automatic AVIF/WebP conversion, responsive srcset,
 * and server-side optimization caching (minimumCacheTTL: 1h).
 * External images route through /api/img proxy to bypass hotlink protection.
 *
 * Rendering chain:
 *   Browser → /_next/image → /api/img proxy → external CDN
 *   First load: proxy + optimize (AVIF, resize). Cached for 1h+.
 *   Subsequent loads: served from Next.js optimization cache.
 */
export function StoryImage({ src, alt, fill, sizes, className, preload }: StoryImageProps) {
  const isSupabase = src.includes("supabase.co/storage/");
  const imageSrc = isSupabase ? src : `/api/img?url=${encodeURIComponent(src)}`;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => setFailed(true), []);
  const handleLoad = useCallback(() => setLoaded(true), []);

  return (
    <>
      {(!loaded || failed) && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-muted to-primary/5" />
      )}
      {!failed && (
        <Image
          src={imageSrc}
          alt={alt}
          fill={fill}
          sizes={sizes}
          quality={75}
          className={`${className || ""} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          preload={preload}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </>
  );
}
