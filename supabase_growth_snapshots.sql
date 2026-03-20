-- ═══════════════════════════════════════════════════════════
-- GROWTH SNAPSHOTS — daily metric snapshots for trend analysis
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS growth_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Subscriber metrics
  total_subscribers INT DEFAULT 0,
  new_subscribers_today INT DEFAULT 0,
  active_subscribers INT DEFAULT 0,
  
  -- Content metrics
  total_news INT DEFAULT 0,
  new_news_today INT DEFAULT 0,
  total_opportunities INT DEFAULT 0,
  new_opportunities_today INT DEFAULT 0,
  approved_opportunities INT DEFAULT 0,
  pending_opportunities INT DEFAULT 0,
  
  -- Engagement metrics
  total_newsletter_sends INT DEFAULT 0,
  total_newsletter_opens INT DEFAULT 0,
  total_newsletter_clicks INT DEFAULT 0,
  
  -- Sponsor metrics
  total_partners INT DEFAULT 0,
  sponsor_clicks_today INT DEFAULT 0,
  sponsor_impressions_today INT DEFAULT 0,
  
  -- Traffic metrics (from page_views drain)
  pageviews_today INT DEFAULT 0,
  unique_sessions_today INT DEFAULT 0,
  unique_devices_today INT DEFAULT 0,
  
  -- Directory metrics
  total_directory_listings INT DEFAULT 0,
  total_call_sheet_listings INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_snapshot_date UNIQUE (snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_growth_snapshots_date ON growth_snapshots (snapshot_date DESC);

-- RLS
ALTER TABLE growth_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role all" ON growth_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- USEFUL VIEWS for analytics queries
-- ═══════════════════════════════════════════════════════════

-- Subscriber growth over time (cumulative)
CREATE OR REPLACE VIEW subscriber_growth AS
SELECT
  date_trunc('day', created_at)::date AS day,
  COUNT(*) AS new_subscribers,
  SUM(COUNT(*)) OVER (ORDER BY date_trunc('day', created_at)) AS cumulative_subscribers
FROM newsletter_subscriptions
GROUP BY 1
ORDER BY 1;

-- News content velocity
CREATE OR REPLACE VIEW news_velocity AS
SELECT
  date_trunc('week', published_at)::date AS week,
  category,
  COUNT(*) AS articles
FROM news
GROUP BY 1, 2
ORDER BY 1 DESC;

-- Opportunity pipeline
CREATE OR REPLACE VIEW opportunity_pipeline AS
SELECT
  date_trunc('week', created_at)::date AS week,
  status,
  application_status,
  COUNT(*) AS count
FROM opportunities
GROUP BY 1, 2, 3
ORDER BY 1 DESC;

-- Top pages (from drain data, last 30 days)
CREATE OR REPLACE VIEW top_pages_30d AS
SELECT
  path,
  COUNT(*) AS views,
  COUNT(DISTINCT session_id) AS unique_visitors,
  COUNT(DISTINCT country) AS countries
FROM page_views
WHERE event_type = 'pageview'
  AND timestamp > now() - interval '30 days'
GROUP BY path
ORDER BY views DESC
LIMIT 50;

-- Traffic by country (last 30 days)
CREATE OR REPLACE VIEW traffic_by_country_30d AS
SELECT
  country,
  COUNT(*) AS pageviews,
  COUNT(DISTINCT session_id) AS unique_visitors,
  COUNT(DISTINCT path) AS pages_viewed
FROM page_views
WHERE event_type = 'pageview'
  AND timestamp > now() - interval '30 days'
  AND country IS NOT NULL
GROUP BY country
ORDER BY pageviews DESC;

-- Traffic by device type (last 30 days)
CREATE OR REPLACE VIEW traffic_by_device_30d AS
SELECT
  device_type,
  browser,
  COUNT(*) AS pageviews,
  COUNT(DISTINCT session_id) AS unique_visitors
FROM page_views
WHERE event_type = 'pageview'
  AND timestamp > now() - interval '30 days'
GROUP BY device_type, browser
ORDER BY pageviews DESC;

-- Daily traffic trend
CREATE OR REPLACE VIEW daily_traffic AS
SELECT
  date_trunc('day', timestamp)::date AS day,
  COUNT(*) AS pageviews,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(DISTINCT device_id) AS unique_devices
FROM page_views
WHERE event_type = 'pageview'
GROUP BY 1
ORDER BY 1 DESC;

-- Referrer analysis (last 30 days)
CREATE OR REPLACE VIEW top_referrers_30d AS
SELECT
  referrer,
  COUNT(*) AS visits,
  COUNT(DISTINCT session_id) AS unique_visitors
FROM page_views
WHERE event_type = 'pageview'
  AND timestamp > now() - interval '30 days'
  AND referrer IS NOT NULL
  AND referrer != ''
GROUP BY referrer
ORDER BY visits DESC
LIMIT 30;
