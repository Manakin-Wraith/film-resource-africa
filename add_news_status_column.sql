-- Add status column to news table for community spotlight moderation
-- Run this in Supabase SQL Editor

ALTER TABLE news
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
  CHECK (status IN ('pending', 'published', 'rejected'));

-- Add submitter tracking columns for community submissions
ALTER TABLE news
ADD COLUMN IF NOT EXISTS submitted_by_name TEXT,
ADD COLUMN IF NOT EXISTS submitted_by_email TEXT,
ADD COLUMN IF NOT EXISTS project_name TEXT;

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);

-- Backfill: all existing rows are already published (default)
