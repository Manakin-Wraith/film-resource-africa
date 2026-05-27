-- PRS — Project Readiness Score
-- Stores public intake submissions and their AI-generated diagnosis.
-- One free assessment per email (lifetime); members may submit repeatedly.

create table if not exists assessments (
  id            uuid primary key default gen_random_uuid(),
  token         text unique not null,                 -- public URL slug: /p/<token>
  email         text not null,
  member_id     uuid references members(id) on delete set null,

  -- denormalised project header (for card head + lists, avoids parsing intake_data)
  project_title text not null,
  format        text,
  genre         text,
  country       text,

  intake_data   jsonb not null,                       -- { "1": "...", "15": ["...","..."] }

  status        text not null default 'pending',      -- pending | scored | failed
  tier          text,                                 -- early | developing | ready
  score         integer,                              -- 0..25
  diagnosis     jsonb,                                -- full Diagnosis object

  submitted_at  timestamptz not null default now(),
  scored_at     timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists assessments_email_idx     on assessments (lower(email));
create index if not exists assessments_member_idx    on assessments (member_id);
create index if not exists assessments_status_idx    on assessments (status);

-- Enforce "one free assessment per email" at the DB level: at most one row per
-- email where member_id is null. (Members are exempt — they can resubmit.)
create unique index if not exists assessments_one_free_per_email
  on assessments (lower(email))
  where member_id is null;

-- Intro requests fired from member counterparty cards ("Request intro") and
-- "Discuss with FRA" links — tracked rather than mailto, per the brief.
create table if not exists prs_intro_requests (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid references assessments(id) on delete cascade,
  member_id     uuid references members(id) on delete set null,
  kind          text not null,                        -- 'counterparty' | 'fra_move'
  subject       text not null,                        -- counterparty name or move title
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists prs_intro_requests_assessment_idx on prs_intro_requests (assessment_id);
