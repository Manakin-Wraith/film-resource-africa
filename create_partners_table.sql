-- Create partners table for the ticker carousel
-- Run in Supabase SQL Editor

CREATE TABLE partners (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website TEXT,
  tier TEXT NOT NULL DEFAULT 'partner' CHECK (tier IN ('partner', 'sponsor')),
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partners_status ON partners (status);
CREATE INDEX idx_partners_sort ON partners (sort_order, created_at DESC);

-- RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved partners"
  ON partners FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Service role full access to partners"
  ON partners FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_partners_updated_at();
