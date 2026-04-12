// ============================================================================
// SYNC API — Fetches live stories/news from RSS & APIs, stores to Supabase.
// GET: Called by Vercel Cron (authenticated via CRON_SECRET).
// POST: Manual trigger (authenticated via SUPABASE_SERVICE_ROLE_KEY).
// After sync, revalidates cached pages so fresh content is served immediately.
// ============================================================================

import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";
import { syncStoriesToDB, syncNewsToDB, reEnrichNewsImages, reEnrichStoryImages } from "@/lib/supabase-data";

// Allow up to 60s for the sync pipeline (Vercel Pro limit)
export const maxDuration = 60;

// ── Auth helpers ────────────────────────────────────────────────────────────

function verifyCronAuth(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

function verifyManualAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
  return !!authHeader && authHeader === expected;
}

// ── Shared sync logic ───────────────────────────────────────────────────────

async function runSync() {
  const { getStoriesLive, getNewsFeedLive } = await import("@/lib/data-live");

  const [stories, news] = await Promise.allSettled([
    getStoriesLive(),
    getNewsFeedLive(),
  ]);

  const results: Record<string, unknown> = {};

  if (stories.status === "fulfilled" && stories.value.length > 0) {
    const count = await syncStoriesToDB(stories.value);
    results.stories = { fetched: stories.value.length, synced: count };
  } else {
    results.stories = {
      error: stories.status === "rejected" ? stories.reason?.message : "No stories fetched",
    };
  }

  if (news.status === "fulfilled" && news.value.length > 0) {
    const count = await syncNewsToDB(news.value);
    results.news = { fetched: news.value.length, synced: count };
  } else {
    results.news = {
      error: news.status === "rejected" ? news.reason?.message : "No news fetched",
    };
  }

  // Invalidate cached pages so the next visitor gets fresh content
  revalidateTag("news-data", "max");
  revalidateTag("stories-data", "max");
  revalidateTag("dashboard-data", "max");
  revalidateTag("videos-data", "max");
  revalidatePath("/", "layout");

  // Re-enrich existing DB articles that still lack images (backfill)
  try {
    const [newsEnriched, storiesEnriched] = await Promise.all([
      reEnrichNewsImages(10),
      reEnrichStoryImages(10),
    ]);
    if (newsEnriched > 0 || storiesEnriched > 0) {
      results.reEnrich = { news: newsEnriched, stories: storiesEnriched };
      // Re-invalidate if we found new images
      revalidateTag("news-data", "max");
      revalidateTag("stories-data", "max");
    }
  } catch (e) {
    results.reEnrich = { error: e instanceof Error ? e.message : "Re-enrichment failed" };
  }

  return results;
}

// ── GET: Vercel Cron ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await runSync();
    return NextResponse.json({ ok: true, results, timestamp: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ── POST: Manual trigger ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!verifyManualAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await runSync();
    return NextResponse.json({ ok: true, results, timestamp: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
