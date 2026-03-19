-- ═══════════════════════════════════════════════════════════
-- SPONSORED PLACEMENTS SYSTEM
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Partners table — who's advertising
CREATE TABLE IF NOT EXISTS partners (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Sponsored placements — what's booked where
CREATE TABLE IF NOT EXISTS sponsored_placements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id BIGINT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  section TEXT NOT NULL,               -- e.g. 'Closing Soon', 'Latest News'
  slot_position INTEGER NOT NULL DEFAULT 1 CHECK (slot_position = 1),
  variant TEXT NOT NULL DEFAULT 'branded' CHECK (variant IN ('minimal', 'branded')),
  cta_text TEXT DEFAULT 'Learn More',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Prevent double-booking same slot
  UNIQUE (section, slot_position, start_date)
);

-- 3. Sponsored clicks — per-click tracking
CREATE TABLE IF NOT EXISTS sponsored_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  placement_id UUID REFERENCES sponsored_placements(id) ON DELETE SET NULL,
  partner_id BIGINT REFERENCES partners(id) ON DELETE SET NULL,
  section TEXT NOT NULL,
  slot_position INTEGER,
  clicked_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Sponsored impressions — card was shown to a user
CREATE TABLE IF NOT EXISTS sponsored_impressions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  placement_id UUID REFERENCES sponsored_placements(id) ON DELETE SET NULL,
  partner_id BIGINT REFERENCES partners(id) ON DELETE SET NULL,
  section TEXT NOT NULL,
  slot_position INTEGER,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS policies — allow inserts from anon/service role
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_impressions ENABLE ROW LEVEL SECURITY;

-- Read access for active placements (public needs to fetch what to display)
CREATE POLICY "Anyone can read active partners"
  ON partners FOR SELECT USING (active = true);

CREATE POLICY "Anyone can read active placements"
  ON sponsored_placements FOR SELECT USING (active = true);

-- Insert access for click/impression tracking (anon users trigger these)
CREATE POLICY "Anyone can insert sponsored clicks"
  ON sponsored_clicks FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert sponsored impressions"
  ON sponsored_impressions FOR INSERT WITH CHECK (true);

-- Read access for clicks/impressions (for reporting — restrict to service role in prod)
CREATE POLICY "Service role can read sponsored clicks"
  ON sponsored_clicks FOR SELECT USING (true);

CREATE POLICY "Service role can read sponsored impressions"
  ON sponsored_impressions FOR SELECT USING (true);

-- 6. Indexes for fast queries
CREATE INDEX idx_placements_section_active ON sponsored_placements(section, active) WHERE active = true;
CREATE INDEX idx_placements_dates ON sponsored_placements(start_date, end_date) WHERE active = true;
CREATE INDEX idx_clicks_partner ON sponsored_clicks(partner_id, clicked_at);
CREATE INDEX idx_clicks_placement ON sponsored_clicks(placement_id, clicked_at);
CREATE INDEX idx_impressions_partner ON sponsored_impressions(partner_id, viewed_at);
CREATE INDEX idx_impressions_placement ON sponsored_impressions(placement_id, viewed_at);
