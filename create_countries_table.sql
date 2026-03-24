-- Location Pages: Countries table + opportunity relationship
-- Run this in Supabase SQL Editor

-- 0. Clean up any previous attempts (safe to run even if tables don't exist)
DROP TABLE IF EXISTS opportunity_countries CASCADE;
DROP TABLE IF EXISTS countries CASCADE;

-- 1. Create countries table
CREATE TABLE IF NOT EXISTS countries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  iso_code CHAR(2),
  region TEXT,                      -- e.g. 'West Africa', 'East Africa', 'North Africa', 'Southern Africa'
  film_industry_size TEXT,          -- 'small', 'medium', 'large'
  annual_productions INTEGER,
  major_studios TEXT[],
  notable_filmmakers TEXT[],
  intro_text TEXT,                  -- editorial intro paragraph for the country page
  filming_permit_info TEXT,
  tax_incentives TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Junction table: many-to-many between opportunities and countries
CREATE TABLE IF NOT EXISTS opportunity_countries (
  opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
  PRIMARY KEY (opportunity_id, country_id)
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_countries_slug ON countries(slug);
CREATE INDEX IF NOT EXISTS idx_opportunity_countries_country ON opportunity_countries(country_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_countries_opp ON opportunity_countries(opportunity_id);

-- 4. Seed Tier 1 countries (8 major film hubs)
INSERT INTO countries (name, slug, iso_code, region, film_industry_size, annual_productions, major_studios, notable_filmmakers, intro_text, filming_permit_info, tax_incentives)
VALUES
  (
    'Nigeria',
    'nigeria',
    'NG',
    'West Africa',
    'large',
    2500,
    ARRAY['EbonyLife Studios', 'Kunle Afolayan Productions', 'Inkblot Productions', 'FilmOne Entertainment'],
    ARRAY['Kunle Afolayan', 'Genevieve Nnaji', 'Kemi Adetiba', 'Akin Omotoso', 'Mo Abudu'],
    'Nigeria is home to Nollywood — the world''s second-largest film industry by volume. With a rapidly growing box office, international co-productions, and a new wave of globally acclaimed filmmakers, Nigeria offers unmatched opportunities for African storytellers.',
    'Filming permits are managed by state film commissions. Lagos State Film & Video Censors Board handles permits for Lagos. Other states have their own bodies. International productions may need additional clearance from the National Film and Video Censors Board (NFVCB).',
    'Nigeria does not currently offer formal film tax rebates, but the Creative Industry Financing Initiative (CIFI) through the Bank of Industry provides low-interest loans for film production.'
  ),
  (
    'South Africa',
    'south-africa',
    'ZA',
    'Southern Africa',
    'large',
    150,
    ARRAY['Triggerfish Animation', 'Videovision Entertainment', 'Film Afrika Worldwide', 'Moonlighting Films'],
    ARRAY['Neill Blomkamp', 'John Trengove', 'Jenna Bass', 'Jahmil X.T. Qubeka', 'Sara Blecher'],
    'South Africa has the most developed film infrastructure on the continent, with world-class studios, experienced crews, and generous tax incentives. From Cape Town''s stunning locations to Johannesburg''s urban energy, SA is a premier destination for African and international productions.',
    'The National Film and Video Foundation (NFVF) oversees the industry. Filming permits vary by province and municipality. The DTI (Department of Trade and Industry) manages the Foreign Film and Television Production incentive.',
    'South Africa offers a 25% rebate on qualifying South African production expenditure (QSAPE) for foreign productions, and 20-25% for local productions through the DTI incentive programme.'
  ),
  (
    'Kenya',
    'kenya',
    'KE',
    'East Africa',
    'medium',
    80,
    ARRAY['LiKA Management', 'Ginger Ink Films', 'Seven Productions', 'Rocque Pictures'],
    ARRAY['Wanuri Kahiu', 'Lupita Nyong''o', 'Likarion Wainaina', 'Judy Kibinge', 'Jim Chuchu'],
    'Kenya''s film industry is experiencing rapid growth, driven by a new generation of storytellers and increasing international interest. Nairobi has emerged as East Africa''s creative hub, with film festivals, training programs, and a vibrant independent cinema scene.',
    'The Kenya Film Commission (KFC) manages filming permits. A filming license is required for all commercial productions. Permits can be obtained through the KFC website and typically take 7-14 days to process.',
    'Kenya introduced a 30% film rebate incentive in 2023 for qualifying productions spending at least KES 20 million ($150,000 USD) in the country.'
  ),
  (
    'Ghana',
    'ghana',
    'GH',
    'West Africa',
    'medium',
    100,
    ARRAY['Sparrow Productions', 'Silverbird Film Distribution', 'Farmhouse Productions'],
    ARRAY['Shirley Frimpong-Manso', 'Leila Djansi', 'Peter Sedufia', 'Yvonne Nelson'],
    'Ghana''s Ghallywood industry is growing rapidly, with a mix of local-language and English-language productions. The country''s stable political environment, English-speaking workforce, and beautiful locations make it an attractive filming destination.',
    'The National Film Authority (NFA) was established in 2020 to regulate and promote the film industry. Filming permits are obtained through the NFA and local authorities.',
    'Ghana is developing film incentive programs through the National Film Authority. The government has announced plans for tax exemptions on filmmaking equipment and production costs.'
  ),
  (
    'Egypt',
    'egypt',
    'EG',
    'North Africa',
    'large',
    80,
    ARRAY['New Century Production', 'Synergy Films', 'Film Clinic'],
    ARRAY['Youssef Chahine (legacy)', 'Mohamed Diab', 'Amr Salama', 'Abu Bakr Shawky', 'Mariam Naoum'],
    'Egypt has the oldest and most established film industry in the Arab world, with a rich cinematic heritage dating back to the 1920s. Cairo remains a major production hub, and Egyptian films continue to dominate Arabic-language cinema across the region.',
    'Filming permits are managed by the Egyptian Ministry of Culture and the General Authority for Cultural Palaces. International productions require approval from the Ministry of Defence for certain locations. The process can take 2-4 weeks.',
    'Egypt does not currently have a formal film tax rebate program, though the government has been exploring incentive frameworks for international productions.'
  ),
  (
    'Morocco',
    'morocco',
    'MA',
    'North Africa',
    'large',
    60,
    ARRAY['Sigma Technologies', 'Les Films du Nouveau Monde', 'Nabil Ayouch Productions'],
    ARRAY['Nabil Ayouch', 'Maryam Touzani', 'Faouzi Bensaïdi', 'Hicham Lasri', 'Narjiss Nejjar'],
    'Morocco has positioned itself as Africa''s top filming destination for international productions, with the legendary Atlas Studios in Ouarzazate and stunning landscapes that have doubled for locations worldwide. The Marrakech International Film Festival brings global attention to Moroccan cinema annually.',
    'The Centre Cinématographique Marocain (CCM) manages filming permits. Morocco has a streamlined process for international productions, with permits typically issued within 5-10 business days.',
    'Morocco offers a 20% cash rebate on qualifying production expenditure for international productions spending at least MAD 5 million ($500,000 USD) in the country. Additional rebates available for post-production work.'
  ),
  (
    'Tanzania',
    'tanzania',
    'TZ',
    'East Africa',
    'small',
    40,
    ARRAY['Kijiweni Productions', 'Tanzania Film Services'],
    ARRAY['Amil Shivji', 'Ekwa Msangi', 'Issa Ngariba'],
    'Tanzania''s film industry is emerging with a wave of Swahili-language productions and internationally recognized filmmakers. The country''s breathtaking landscapes — from Zanzibar''s beaches to the Serengeti — offer unique filming locations.',
    'Filming permits are managed by the Tanzania Film Censorship Board (TFCB) and the Tanzania Commission for Science and Technology (COSTECH) for research-related content. Permits for national parks require additional approval from TANAPA.',
    'Tanzania does not currently offer formal film production tax incentives, though the government has expressed interest in developing an incentive program.'
  ),
  (
    'Ethiopia',
    'ethiopia',
    'ET',
    'East Africa',
    'small',
    30,
    ARRAY['Haile-Gerima Films (legacy)', 'Rasselas Films'],
    ARRAY['Haile Gerima (legacy)', 'Yared Zeleke', 'Hermon Hailay', 'Ephraim Tadesse'],
    'Ethiopia''s cinema scene is growing, anchored by a strong tradition of independent filmmaking and the legacy of legendary director Haile Gerima. Addis Ababa''s vibrant cultural scene and the country''s unique landscapes provide rich material for storytelling.',
    'Filming permits are obtained through the Ethiopian Ministry of Culture and Tourism. The process can vary significantly depending on the project type and locations involved.',
    'Ethiopia does not currently offer formal film tax rebate programs. However, the Ethiopian Film Initiative has been working to establish a supportive framework for the industry.'
  )
ON CONFLICT (slug) DO NOTHING;

-- 5. RLS policies (enable as needed)
-- ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public read" ON countries FOR SELECT USING (true);
-- ALTER TABLE opportunity_countries ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public read" ON opportunity_countries FOR SELECT USING (true);
