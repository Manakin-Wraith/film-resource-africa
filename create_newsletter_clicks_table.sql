-- FRA Newsletter Click Tracking — Supabase Schema
-- Run this in Supabase SQL Editor

-- 1. Newsletter clicks — logs every tracked link click from emails
CREATE TABLE IF NOT EXISTS newsletter_clicks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  newsletter_id uuid REFERENCES newsletters(id) ON DELETE SET NULL,
  send_id uuid REFERENCES newsletter_sends(id) ON DELETE SET NULL,
  link_url text NOT NULL,
  link_label text,
  campaign text,
  clicked_at timestamptz DEFAULT now(),
  user_agent text,
  ip_address text
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_clicks_newsletter_id ON newsletter_clicks(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_clicks_send_id ON newsletter_clicks(send_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_clicks_clicked_at ON newsletter_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_clicks_campaign ON newsletter_clicks(campaign);

-- 3. Analytics view — click performance per newsletter
CREATE OR REPLACE VIEW newsletter_click_analytics AS
SELECT
  nc.newsletter_id,
  n.subject,
  n.edition_date,
  nc.campaign,
  nc.link_label,
  nc.link_url,
  COUNT(*) AS total_clicks,
  COUNT(DISTINCT nc.send_id) AS unique_clickers,
  MIN(nc.clicked_at) AS first_click,
  MAX(nc.clicked_at) AS last_click
FROM newsletter_clicks nc
LEFT JOIN newsletters n ON nc.newsletter_id = n.id
GROUP BY nc.newsletter_id, n.subject, n.edition_date, nc.campaign, nc.link_label, nc.link_url
ORDER BY nc.newsletter_id, total_clicks DESC;

-- 4. Enable RLS but allow inserts from the API (service role bypasses RLS)
ALTER TABLE newsletter_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (the tracking endpoint is public)
CREATE POLICY "Allow anonymous click inserts"
  ON newsletter_clicks FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Service role full access on clicks"
  ON newsletter_clicks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
