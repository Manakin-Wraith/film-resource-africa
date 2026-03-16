-- FRA Migration: Add created_at and updated_at timestamps to opportunities table
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/rcgynwcttgvqcnbyfhiz/sql/new

-- 1. Add timestamp columns
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Backfill: set created_at for all existing rows to a baseline date
UPDATE opportunities SET created_at = '2026-03-01T00:00:00Z' WHERE created_at IS NULL;

-- 3. Mark recently added listings (IDs 56-65, added March 16 2026) as new
UPDATE opportunities SET created_at = '2026-03-16T08:00:00Z', updated_at = '2026-03-16T08:00:00Z' WHERE id >= 56 AND id <= 65;

-- 4. Mark recently updated listings (IDs 7 and 38, updated March 16 2026)
UPDATE opportunities SET updated_at = '2026-03-16T08:00:00Z' WHERE id IN (7, 38);

-- 5. Auto-update updated_at on any row change (trigger)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
