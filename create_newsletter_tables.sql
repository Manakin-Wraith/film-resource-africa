-- FRA Weekly Newsletter Automation — Supabase Schema
-- Run this in Supabase SQL Editor

-- 1. Newsletters table — stores each generated newsletter edition
CREATE TABLE IF NOT EXISTS newsletters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_plain text,
  edition_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  recipient_count int DEFAULT 0,
  open_count int DEFAULT 0,
  click_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 2. Newsletter sends — tracks individual deliveries per subscriber
CREATE TABLE IF NOT EXISTS newsletter_sends (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  newsletter_id uuid NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  subscriber_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'bounced', 'failed')),
  resend_message_id text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- 3. Pro tips library — rotating weekly tips included in newsletters
CREATE TABLE IF NOT EXISTS newsletter_pro_tips (
  id serial PRIMARY KEY,
  tip_text text NOT NULL,
  category text DEFAULT 'general'
    CHECK (category IN ('general', 'financing', 'application', 'market', 'networking', 'craft')),
  used_count int DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_edition_date ON newsletters(edition_date);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_newsletter_id ON newsletter_sends(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_status ON newsletter_sends(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_pro_tips_used ON newsletter_pro_tips(used_count, last_used_at);

-- 5. Analytics view — newsletter performance at a glance
CREATE OR REPLACE VIEW newsletter_analytics AS
SELECT
  n.id,
  n.subject,
  n.edition_date,
  n.status,
  n.recipient_count,
  COUNT(ns.id) FILTER (WHERE ns.status = 'sent')    AS delivered,
  COUNT(ns.id) FILTER (WHERE ns.status = 'opened')  AS opened,
  COUNT(ns.id) FILTER (WHERE ns.status = 'clicked')  AS clicked,
  COUNT(ns.id) FILTER (WHERE ns.status = 'bounced')  AS bounced,
  COUNT(ns.id) FILTER (WHERE ns.status = 'failed')   AS failed,
  CASE WHEN n.recipient_count > 0
    THEN ROUND(100.0 * COUNT(ns.id) FILTER (WHERE ns.status IN ('opened','clicked')) / n.recipient_count, 1)
    ELSE 0
  END AS open_rate_pct,
  n.sent_at,
  n.created_at
FROM newsletters n
LEFT JOIN newsletter_sends ns ON n.id = ns.newsletter_id
GROUP BY n.id, n.subject, n.edition_date, n.status, n.recipient_count, n.sent_at, n.created_at
ORDER BY n.edition_date DESC;

-- 6. Seed initial pro tips (rotating library)
INSERT INTO newsletter_pro_tips (tip_text, category) VALUES
  ('Always apply even if you think your project isn''t ready. Selection committees look for potential, not perfection. A strong concept with a clear African perspective can beat a polished script with no voice.', 'application'),
  ('Build your co-production network before you need it. Attend markets like Durban FilmMart and DISCOP even as an observer — the relationships you make there pay off when you apply to co-production funds later.', 'networking'),
  ('When budgeting for international funds, always include a realistic contingency (10-15%). Funders see this as a sign of professional producing, not padding.', 'financing'),
  ('Tailor every application. Generic cover letters get rejected. Reference the fund''s previous selections and explain why your project fits their mandate specifically.', 'application'),
  ('Don''t sleep on regional funds. Organizations like AFAC, Visions Sud Est, and the Hubert Bals Fund specifically prioritize Global South filmmakers and often have less competition than Sundance or Berlinale programmes.', 'financing'),
  ('Your logline is your first impression. Spend as much time on your one-sentence pitch as you do on your treatment. If you can''t explain your film in one sentence, the selection committee won''t read further.', 'craft'),
  ('Track every application you submit — fund name, deadline, what you sent, and the result. This database becomes invaluable for follow-up applications and understanding your success patterns.', 'general'),
  ('If you get rejected, email the programme coordinator and politely ask for feedback. Many labs (especially Berlinale Talents and TorinoFilmLab) will share brief notes that dramatically improve your next application.', 'application'),
  ('Series are the fastest-growing format in African content. If you have a feature concept that could work as a limited series, consider developing both versions — it doubles your funding opportunities.', 'market'),
  ('Partner with a producer from a different African country to unlock co-production treaty benefits. South Africa, Morocco, Nigeria, Kenya, and Egypt all have bilateral agreements that open doors to European co-production funds.', 'financing'),
  ('Set calendar reminders 6 weeks before every deadline you''re targeting. Most successful applications need at least 4 weeks of focused preparation.', 'general'),
  ('Attend online masterclasses and webinars hosted by funds you want to apply to. They often reveal exactly what selection committees are looking for — straight from the source.', 'networking'),
  ('Your director''s statement should answer: Why this story? Why now? Why you? Selection committees fund filmmakers as much as they fund projects.', 'craft'),
  ('Build a visual lookbook even for documentary projects. A 10-page PDF with reference images, tone boards, and visual style frames can set you apart from text-only applications.', 'craft'),
  ('Follow up on every connection you make at a market or lab within 48 hours. A short, specific email referencing your conversation keeps you top of mind.', 'networking'),
  ('When applying to multiple funds, stagger your deadlines. Submitting to 3 funds in the same week means none get your best work. Space them 2-3 weeks apart.', 'general'),
  ('Research who the fund has previously supported. If they''ve never funded a project like yours, either reframe your pitch to match their track record or target a different fund.', 'application'),
  ('Keep your project website or social media updated. Selection committees Google you. A professional online presence signals you''re serious about your career.', 'market'),
  ('Learn basic pitch deck design. A clean, professional deck with strong key art makes your project memorable in a stack of hundreds of applications.', 'craft'),
  ('Join filmmaker WhatsApp/Telegram groups in your region. Opportunities often circulate in these networks days before they hit official channels.', 'networking')
ON CONFLICT DO NOTHING;
