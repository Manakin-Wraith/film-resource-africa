-- FRA "The Call Sheet" — Supabase Schema
-- Run this in Supabase SQL Editor

-- 1. Main listings table
CREATE TABLE IF NOT EXISTS call_sheet_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  production_title text NOT NULL,
  production_company text NOT NULL,
  producer_name text NOT NULL,
  producer_email text NOT NULL,
  category text NOT NULL
    CHECK (category IN (
      'Key Crew',
      'Writers'' Room',
      'Post & VFX',
      'Emerging Talent',
      'Co-Production Partners',
      'Festival & Market Reps'
    )),
  description text NOT NULL,
  requirements text,
  compensation text NOT NULL,
  compensation_type text NOT NULL DEFAULT 'paid'
    CHECK (compensation_type IN ('paid', 'stipend', 'deferred+paid')),
  location text NOT NULL,
  project_stage text NOT NULL DEFAULT 'pre-production'
    CHECK (project_stage IN ('development', 'pre-production', 'production', 'post-production')),
  start_date text,
  duration text,
  application_url text,
  website text,
  mentorship_included boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_call_sheet_status ON call_sheet_listings(status);
CREATE INDEX IF NOT EXISTS idx_call_sheet_category ON call_sheet_listings(category);
CREATE INDEX IF NOT EXISTS idx_call_sheet_created ON call_sheet_listings(created_at DESC);

-- 3. Enable RLS (optional — service role key bypasses)
ALTER TABLE call_sheet_listings ENABLE ROW LEVEL SECURITY;

-- Allow public reads on approved listings
CREATE POLICY "Public can read approved listings"
  ON call_sheet_listings FOR SELECT
  USING (status = 'approved');

-- Allow inserts (for submission form)
CREATE POLICY "Anyone can submit a listing"
  ON call_sheet_listings FOR INSERT
  WITH CHECK (true);

-- Service role handles updates/deletes (admin)
