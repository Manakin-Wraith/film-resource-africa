-- ═══════════════════════════════════════════════════════════
-- PAGE VIEWS TABLE — receives Vercel Analytics Drain data
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL DEFAULT 'pageview',  -- 'pageview' or 'event'
  event_name TEXT,                               -- custom event name (for event_type='event')
  event_data JSONB,                              -- custom event payload
  timestamp TIMESTAMPTZ NOT NULL,
  session_id BIGINT,
  device_id BIGINT,
  path TEXT NOT NULL,
  route TEXT,                                    -- Next.js route pattern e.g. /news/[slug]
  referrer TEXT,
  query_params TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  os_name TEXT,
  os_version TEXT,
  browser TEXT,
  browser_version TEXT,
  device_type TEXT,                              -- desktop, mobile, tablet
  device_brand TEXT,
  device_model TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views (path);
CREATE INDEX IF NOT EXISTS idx_page_views_event_type ON page_views (event_type);
CREATE INDEX IF NOT EXISTS idx_page_views_country ON page_views (country);
CREATE INDEX IF NOT EXISTS idx_page_views_device_type ON page_views (device_type);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views (session_id);

-- Composite index for time-range + path queries
CREATE INDEX IF NOT EXISTS idx_page_views_ts_path ON page_views (timestamp DESC, path);

-- Enable RLS but allow service role inserts
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role insert" ON page_views
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Allow service role select" ON page_views
  FOR SELECT TO service_role USING (true);

-- Daily aggregate materialized view (optional, run periodically)
-- This pre-computes daily stats for fast dashboard queries
CREATE OR REPLACE VIEW page_views_daily AS
SELECT
  date_trunc('day', timestamp) AS day,
  path,
  country,
  device_type,
  COUNT(*) AS views,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(DISTINCT device_id) AS unique_devices
FROM page_views
WHERE event_type = 'pageview'
GROUP BY 1, 2, 3, 4;
