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
  if (!src) return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center opacity-60">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z" />
        </svg>
        <p className="text-xs text-slate-400 mt-2">{alt || "News"}</p>
      </div>
    </div>
  );
  const isSupabase = src.includes("supabase.co/storage/");
  const imageSrc = isSupabase ? src : `/api/img?url=${encodeURIComponent(src)}`;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => setFailed(true), []);
  const handleLoad = useCallback(() => setLoaded(true), []);

  return (
    <>
      {(!loaded || failed) && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z" />
            </svg>
          </div>
        </div>
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
