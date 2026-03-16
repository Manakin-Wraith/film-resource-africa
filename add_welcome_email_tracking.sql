-- Add welcome email tracking to newsletter_subscriptions
-- Run this in Supabase SQL Editor

ALTER TABLE newsletter_subscriptions
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;
