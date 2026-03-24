-- Migration: Enrich countries table with resource data
-- Run in Supabase SQL Editor

-- 1. Film Commission (structured contact info)
ALTER TABLE countries ADD COLUMN IF NOT EXISTS film_commission JSONB;
-- Expected shape: { "name": "...", "website": "...", "email": "...", "phone": "...", "address": "..." }

-- 2. Co-production treaties
ALTER TABLE countries ADD COLUMN IF NOT EXISTS co_production_treaties JSONB DEFAULT '[]'::jsonb;
-- Expected shape: [{ "country": "...", "treaty_name": "...", "year": 2020, "details": "..." }]

-- 3. Key resources (funding bodies, guilds, industry associations, etc.)
ALTER TABLE countries ADD COLUMN IF NOT EXISTS key_resources JSONB DEFAULT '[]'::jsonb;
-- Expected shape: [{ "name": "...", "url": "...", "type": "fund|guild|association|government|festival_org|other", "description": "..." }]

-- 4. Notable filming locations
ALTER TABLE countries ADD COLUMN IF NOT EXISTS filming_locations JSONB DEFAULT '[]'::jsonb;
-- Expected shape: [{ "name": "...", "region": "...", "description": "...", "notable_productions": ["..."] }]

-- 5. Industry associations
ALTER TABLE countries ADD COLUMN IF NOT EXISTS industry_associations JSONB DEFAULT '[]'::jsonb;
-- Expected shape: [{ "name": "...", "website": "...", "description": "..." }]

-- 6. Practical production info
ALTER TABLE countries ADD COLUMN IF NOT EXISTS practical_info JSONB;
-- Expected shape: { "currency": "ZAR", "languages": ["English", "Zulu", "Xhosa"], "timezone": "SAST (UTC+2)", "power_standard": "Type M, 230V 50Hz", "visa_info": "..." }

-- 7. Link to official production guide
ALTER TABLE countries ADD COLUMN IF NOT EXISTS production_guide_url TEXT;
