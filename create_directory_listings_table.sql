-- Industry Directory Listings — unified table for companies, crew, services, training
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS directory_listings (
  id BIGSERIAL PRIMARY KEY,
  
  -- Core fields (all types)
  name TEXT NOT NULL,
  directory_type TEXT NOT NULL CHECK (directory_type IN ('company', 'crew', 'service', 'training')),
  category TEXT NOT NULL,            -- e.g. 'Fiction', 'Cinematographer', 'Equipment Rental', 'Film School'
  description TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  logo_url TEXT,
  
  -- Company-specific
  speciality TEXT,                    -- e.g. 'Fiction, Documentary, Commercial'
  notable_projects TEXT,
  year_founded INTEGER,
  company_size TEXT CHECK (company_size IN ('indie', 'mid', 'major') OR company_size IS NULL),
  
  -- Crew-specific
  role TEXT,                          -- Primary role, e.g. 'Director of Photography'
  secondary_roles TEXT,               -- Comma-separated additional roles
  bio TEXT,
  portfolio_url TEXT,
  credits TEXT,                       -- Notable credits / filmography
  availability TEXT CHECK (availability IN ('available', 'busy', 'selective') OR availability IS NULL),
  day_rate_range TEXT,                -- e.g. '$200-400' or 'Negotiable'
  
  -- Service-specific
  service_type TEXT,                  -- e.g. 'Camera Rental', 'Sound Stage', 'Color Grading'
  pricing_tier TEXT CHECK (pricing_tier IN ('budget', 'mid', 'premium') OR pricing_tier IS NULL),
  
  -- Training-specific
  program_type TEXT CHECK (program_type IN ('school', 'workshop', 'online', 'mentorship', 'masterclass') OR program_type IS NULL),
  duration TEXT,                      -- e.g. '3 years', '2 weeks', 'Self-paced'
  cost TEXT,
  accreditation TEXT,
  next_intake TEXT,
  
  -- Admin / meta
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  featured BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  votes INTEGER DEFAULT 0,
  submitted_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_directory_type ON directory_listings(directory_type);
CREATE INDEX idx_directory_category ON directory_listings(category);
CREATE INDEX idx_directory_country ON directory_listings(country);
CREATE INDEX idx_directory_status ON directory_listings(status);
CREATE INDEX idx_directory_featured ON directory_listings(featured) WHERE featured = TRUE;
CREATE INDEX idx_directory_type_status ON directory_listings(directory_type, status);

-- Full-text search index
CREATE INDEX idx_directory_search ON directory_listings 
  USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, '') || ' ' || coalesce(country, '') || ' ' || coalesce(city, '')));

-- RLS policies
ALTER TABLE directory_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved listings"
  ON directory_listings FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Service role full access"
  ON directory_listings FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_directory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_directory_updated_at
  BEFORE UPDATE ON directory_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_directory_updated_at();
