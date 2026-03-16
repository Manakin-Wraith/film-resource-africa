-- Fix: Drop the CHECK constraint on 'type' column that blocks inserts
-- Run this in Supabase SQL Editor

-- Find and drop all check constraints on the contacts table related to type
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'contacts'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%type%'
  LOOP
    EXECUTE 'ALTER TABLE contacts DROP CONSTRAINT ' || quote_ident(r.conname);
    RAISE NOTICE 'Dropped constraint: %', r.conname;
  END LOOP;
END $$;

-- Backfill any NULL type values to 'general'
UPDATE contacts SET type = 'general' WHERE type IS NULL;
