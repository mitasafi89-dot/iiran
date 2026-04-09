-- ============================================================================
-- IIRan Supabase Migration
-- Run this SQL in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================================

-- Stories table: persists fetched stories with cached image data
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  excerpt TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  image_stored_path TEXT,
  theme TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stories_published ON stories (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_source ON stories (source);

-- News articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  image_stored_path TEXT,
  score REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles (published_at DESC);

-- Cached images metadata
CREATE TABLE IF NOT EXISTS cached_images (
  id SERIAL PRIMARY KEY,
  original_url TEXT NOT NULL UNIQUE,
  stored_path TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'image/jpeg',
  size_bytes INTEGER,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_original ON cached_images (original_url);

-- Enable Row Level Security
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_images ENABLE ROW LEVEL SECURITY;

-- Public read policies (anon key can read)
CREATE POLICY "Public read stories" ON stories FOR SELECT USING (true);
CREATE POLICY "Public read news" ON news_articles FOR SELECT USING (true);
CREATE POLICY "Public read images" ON cached_images FOR SELECT USING (true);

-- Service role write policies (sync operations)
CREATE POLICY "Service write stories" ON stories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write news" ON news_articles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write images" ON cached_images FOR ALL USING (auth.role() = 'service_role');
