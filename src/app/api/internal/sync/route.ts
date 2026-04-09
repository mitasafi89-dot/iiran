// ============================================================================
// SYNC API — Fetches live stories/news from RSS & APIs, stores to Supabase.
// Protected by SUPABASE_SERVICE_ROLE_KEY header check.
// Call via cron job or manually: POST /api/internal/sync
// ============================================================================

import { type NextRequest, NextResponse } from "next/server";
import { syncStoriesToDB, syncNewsToDB } from "@/lib/supabase-data";

export async function POST(req: NextRequest) {
  // Authenticate with service role key
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Dynamic import to avoid circular issues with "use cache"
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

    return NextResponse.json({ ok: true, results, timestamp: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
