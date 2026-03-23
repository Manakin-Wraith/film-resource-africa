-- Migration: Add 'agency' to directory_listings.directory_type check constraint
-- Run in Supabase SQL Editor

-- Drop the existing check constraint on directory_type
ALTER TABLE directory_listings DROP CONSTRAINT IF EXISTS directory_listings_directory_type_check;

-- Re-create with 'agency' included
ALTER TABLE directory_listings ADD CONSTRAINT directory_listings_directory_type_check
  CHECK (directory_type IN ('company', 'crew', 'service', 'training', 'agency'));
