-- FRA Fix: Correct timestamps after migration bug
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/rcgynwcttgvqcnbyfhiz/sql/new

-- 1. Drop the trigger temporarily so our updates don't get overridden
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;

-- 2. Fix all old listings (id < 56) — created March 1, not recently updated
UPDATE opportunities SET created_at = '2026-03-01T00:00:00Z', updated_at = '2026-03-01T00:00:00Z' WHERE id < 56;

-- 3. Mark IDs 7 and 38 as recently UPDATED (created old, updated today)
UPDATE opportunities SET created_at = '2026-03-01T00:00:00Z', updated_at = '2026-03-16T08:00:00Z' WHERE id IN (7, 38);

-- 4. Mark IDs 56-65 as NEW (created today)
UPDATE opportunities SET created_at = '2026-03-16T08:00:00Z', updated_at = '2026-03-16T08:00:00Z' WHERE id >= 56 AND id <= 65;

-- 5. Recreate the trigger for future updates
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
