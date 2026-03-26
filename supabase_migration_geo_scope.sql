-- FRA Migration: Add geographic scope columns for country/region indicators
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/rcgynwcttgvqcnbyfhiz/sql/new

-- 1. Add geo_scope to opportunities (country_id already exists)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS geo_scope TEXT DEFAULT 'pan_african';

-- 2. Add country_id and geo_scope to news
ALTER TABLE news ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id);
ALTER TABLE news ADD COLUMN IF NOT EXISTS geo_scope TEXT DEFAULT NULL;

-- 3. Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('opportunities', 'news')
  AND column_name IN ('geo_scope', 'country_id')
ORDER BY table_name, column_name;
