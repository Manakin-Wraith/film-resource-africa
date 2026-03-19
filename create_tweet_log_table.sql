-- Tweet Log table for tracking all tweets posted by the @film_resource_ X account
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS tweet_log (
  id SERIAL PRIMARY KEY,
  tweet_id TEXT NOT NULL,
  tweet_text TEXT NOT NULL,
  tweet_type TEXT NOT NULL DEFAULT 'manual',
  -- Types: opportunity, news, deadline, deadline_thread, engagement, spotlight, thread, manual
  source_id INTEGER,
  source_table TEXT,
  -- Source tables: opportunities, news, call_sheet_listings, directory_listings
  thread_id TEXT,
  -- Parent tweet ID if this is part of a thread
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups to avoid duplicate tweets
CREATE INDEX IF NOT EXISTS idx_tweet_log_source
  ON tweet_log (source_table, source_id);

CREATE INDEX IF NOT EXISTS idx_tweet_log_type
  ON tweet_log (tweet_type);

CREATE INDEX IF NOT EXISTS idx_tweet_log_posted
  ON tweet_log (posted_at DESC);

-- Enable RLS (optional — service role key bypasses this)
ALTER TABLE tweet_log ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on tweet_log"
  ON tweet_log
  FOR ALL
  USING (true)
  WITH CHECK (true);
