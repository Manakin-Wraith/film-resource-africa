/**
 * Tech-Pulse — content source of truth (PLACEHOLDER STAGE)
 * ---------------------------------------------------------
 * The real podcast content (final episodes, YouTube IDs, guest photos) is not
 * ready yet. Everything here is placeholder copy carried over from the approved
 * design wireframe so the page can ship and be reviewed against the FRA tokens.
 *
 * INTEGRATION PLAN — how to make this real later:
 *   1. Each episode below maps 1:1 to a future `tech_pulse_episodes` Supabase row.
 *      When content lands, create that table (mirror the `Episode` type), then
 *      replace the static `EPISODES` import in page.tsx with a server-side fetch.
 *      Nothing in TechPulseClient.tsx needs to change — it only reads the type.
 *   2. Swap PLACEHOLDER_YT for each episode's real `yt` (YouTube video id).
 *   3. Guest/host avatars use the gradient fallback until real `avatarUrl`s exist;
 *      add an optional `avatarUrl` field and render it when present.
 *   4. SCHEDULE + NEXT_EPISODE become derived from episode dates once real.
 *
 * Flip CONTENT_READY to false to surface a "pilot season" empty/teaser state
 * instead of the placeholder archive (see TechPulseClient).
 */

export const CONTENT_READY = false;

/** Single placeholder YouTube id so the embed actually loads in review. */
export const PLACEHOLDER_YT = 'jNQXAC9IVRw';

export type Guest = {
  name: string;
  role: string;
  /** amber styling on the avatar dot — used for business-tier guests */
  amber?: boolean;
  avatarUrl?: string;
};

export type Chapter = {
  ts: string;
  title: string;
  note?: string;
};

export type Episode = {
  n: string;
  date: string;
  dateShort: string;
  title: string;
  pull: string;
  pullBy: string;
  summary: string[];
  dur: string;
  host: string;
  producer: string;
  topic: string;
  recorded: string;
  featured?: boolean;
  tags: string[];
  guests: Guest[];
  chapters: Chapter[];
  yt: string;
};

export type Host = {
  name: string;
  role: string;
  avatarUrl?: string;
};

export const HOSTS: Host[] = [
  { name: 'Tobi Adeyemi', role: 'Host · editor, FRA · Lagos' },
  { name: 'Lena Mwangi', role: 'Co-host · producer · Berlin' },
];

export const NEXT_EPISODE = {
  n: '015',
  title: 'The new agency stack.',
  blurb:
    'Three studio founders compare what’s actually on their machines this quarter — and what got cut. Hosted by Tobi.',
  when: 'Sun 24 May · 18:00 WAT',
};

/** TV-guide schedule. Public 18:00 broadcast row + members-only live room row. */
export const SCHEDULE_WEEKS = [
  { label: 'Wk 14', date: '06 Apr' },
  { label: 'Wk 15', date: '13 Apr' },
  { label: 'Wk 16', date: '20 Apr' },
  { label: 'Wk 17', date: '27 Apr' },
  { label: 'Wk 18', date: '04 May' },
  { label: 'Wk 19', date: '11 May' },
  { label: 'Wk 20', date: '18 May', current: true },
];

/** Broadcast row — one cell per week. `ep` links the cell to an Episode for swap. */
export const SCHEDULE_BROADCAST = [
  { ep: '008', epn: 'EP 008 · 44 MIN', title: 'The studio without an office', guest: 'D. Igwe' },
  { ep: '009', epn: 'EP 009 · 29 MIN', title: 'The contract every member should rewrite', guest: 'S. Adekunle' },
  { ep: '010', epn: 'EP 010 · 36 MIN', title: 'Year one inside the room', guest: 'Founders' },
  { ep: '011', epn: 'EP 011 · 55 MIN', title: 'Cities, latency & the new studio map', guest: 'M. Park' },
  { ep: '012', epn: 'EP 012 · 41 MIN', title: 'The freelance pricing reset', guest: 'Panel of 4' },
  { ep: '013', epn: 'EP 013 · 48 MIN', title: 'AI agents in the studio', guest: 'K. Mendes' },
  { ep: '014', epn: 'EP 014 · 52 MIN', title: 'Design tool monopoly', guest: '▶ On air', now: true },
];

/** Members-only live-room row — sparse; `null` = empty cell. */
export const SCHEDULE_LIVEROOM: ({ epn: string; title: string; guest: string } | null)[] = [
  null,
  null,
  { epn: 'LIVE · MEMBERS', title: 'Post-show Q&A in Discord', guest: 'members only' },
  null,
  { epn: 'LIVE · MEMBERS', title: 'Founders AMA', guest: 'members only' },
  null,
  { epn: 'EP 015 · UPCOMING', title: '"The new agency stack"', guest: '24 May · live taping' },
];

export const EPISODES: Episode[] = [
  {
    n: '014',
    date: '18 May 2026',
    dateShort: '18 MAY · 52 MIN',
    title: 'The quiet collapse of the design tool monopoly',
    pull: 'You can feel the platform getting nervous. That’s what’s interesting about right now.',
    pullBy: '— Ada Okafor, Foundry · 31:05 in',
    summary: [
      'Ada Okafor (Foundry, Lagos) and Jonas Reuter (Studio Reuter, Berlin) on <strong>the week designers stopped pretending the platform was neutral</strong> — what they’re switching to, what they’re keeping, and what kind of studio fits in the gap.',
      'A long conversation, recorded Sunday in two time zones, mostly uncut. The second half runs hot.',
    ],
    dur: '52:14',
    host: 'Tobi Adeyemi',
    producer: 'L. Mwangi',
    topic: 'Tools, Platforms',
    recorded: 'Lagos / Berlin',
    featured: true,
    tags: ['Tools', 'Platforms', 'Conversation'],
    guests: [
      { name: 'Ada Okafor', role: 'Founder · Foundry, Lagos' },
      { name: 'Jonas Reuter', role: 'Studio Reuter · Berlin' },
    ],
    chapters: [
      { ts: '00:00', title: 'Cold open', note: '"What we left out last week"' },
      { ts: '04:22', title: 'The Figma question, finally asked out loud' },
      { ts: '18:40', title: 'What members are switching to', note: 'Live poll results' },
      { ts: '31:05', title: 'Hot take from the room', note: '★ The 8-minute one' },
      { ts: '44:11', title: 'Listener letters & sign-off' },
    ],
    yt: PLACEHOLDER_YT,
  },
  {
    n: '013',
    date: '11 May 2026',
    dateShort: '11 MAY · 48 MIN',
    title: 'AI agents in the studio: who owns the work?',
    pull: 'The awkward middle months are the interesting ones — nobody’s pretending anymore.',
    pullBy: '— K. Mendes · 22:40 in',
    summary: [
      'K. Mendes on the awkward middle months — when half the studio is shipping with an agent and the other half won’t say it out loud.',
      'On labour, attribution, and the contracts nobody has rewritten yet.',
    ],
    dur: '48:02',
    host: 'Tobi Adeyemi',
    producer: 'L. Mwangi',
    topic: 'Labour, Tools',
    recorded: 'Mexico City',
    tags: ['Labour', 'Tools'],
    guests: [{ name: 'K. Mendes', role: 'Senior Designer · Pivot' }],
    chapters: [
      { ts: '00:00', title: 'Cold open' },
      { ts: '06:12', title: 'Who is actually shipping with agents' },
      { ts: '22:40', title: 'The contract gap' },
      { ts: '38:00', title: 'What clients ask about now' },
    ],
    yt: PLACEHOLDER_YT,
  },
  {
    n: '012',
    date: '04 May 2026',
    dateShort: '04 MAY · 41 MIN',
    title: 'The freelance pricing reset',
    pull: 'Everyone is too polite about money. So we put rate cards on the table.',
    pullBy: '— Tobi Adeyemi · host',
    summary: [
      'Four members compare rate cards in the open — what they raised, what they dropped, what their clients did about it.',
      'Includes the spreadsheet they all agreed to share.',
    ],
    dur: '41:18',
    host: 'Tobi Adeyemi',
    producer: 'L. Mwangi',
    topic: 'Money',
    recorded: 'Remote',
    tags: ['Money', 'Conversation'],
    guests: [{ name: 'Panel of four', role: 'Adekunle, Iwu, Park, Reuter' }],
    chapters: [
      { ts: '00:00', title: 'Ground rules' },
      { ts: '08:00', title: 'Last year’s rate cards' },
      { ts: '22:30', title: 'The raise that worked' },
      { ts: '33:10', title: 'The cut that didn’t' },
    ],
    yt: PLACEHOLDER_YT,
  },
  {
    n: '011',
    date: '27 Apr 2026',
    dateShort: '27 APR · 55 MIN',
    title: 'Cities, latency, and the new studio map',
    pull: 'San Francisco isn’t losing. It’s just no longer the only address on the call sheet.',
    pullBy: '— M. Park · Atlas',
    summary: [
      'M. Park on why Lagos, Lisbon and Mexico City keep ending up on the same call sheet — and what’s quietly leaving SF.',
      'A piece about place, time zones, and the soft economics of a 50-person studio.',
    ],
    dur: '55:39',
    host: 'Tobi Adeyemi',
    producer: 'L. Mwangi',
    topic: 'Place',
    recorded: 'Lisbon',
    tags: ['Place'],
    guests: [{ name: 'M. Park', role: 'Editor · Atlas' }],
    chapters: [
      { ts: '00:00', title: 'Cold open' },
      { ts: '09:00', title: 'Why Lagos / Lisbon / CDMX' },
      { ts: '28:00', title: 'What’s leaving SF' },
      { ts: '41:00', title: 'The soft economics' },
    ],
    yt: PLACEHOLDER_YT,
  },
  {
    n: '010',
    date: '20 Apr 2026',
    dateShort: '20 APR · 36 MIN',
    title: 'Year one inside the room',
    pull: 'We thought we were building a directory. We were building a habit.',
    pullBy: '— J. Eze, founder',
    summary: [
      'A long sit-down with the founders. What worked. What didn’t. The Slack messages they wish they’d sent.',
      'Recorded the day FRA turned one.',
    ],
    dur: '36:22',
    host: 'Tobi Adeyemi',
    producer: 'L. Mwangi',
    topic: 'FRA · Anniversary',
    recorded: 'Lagos',
    tags: ['FRA', 'Founders'],
    guests: [{ name: 'J. Eze & A. Bello', role: 'Founders · FRA' }],
    chapters: [
      { ts: '00:00', title: 'One year ago' },
      { ts: '09:00', title: 'What worked' },
      { ts: '18:00', title: 'What didn’t' },
      { ts: '28:00', title: 'The Slack thread' },
    ],
    yt: PLACEHOLDER_YT,
  },
  {
    n: '009',
    date: '13 Apr 2026',
    dateShort: '13 APR · 29 MIN',
    title: 'The contract every member should rewrite',
    pull: 'Most freelance contracts are about fear. The good ones are about scope.',
    pullBy: '— S. Adekunle',
    summary: [
      'Lawyer-by-training and member S. Adekunle walks through three clauses that age badly — and what to put in their place.',
      'Short and useful.',
    ],
    dur: '29:48',
    host: 'Tobi Adeyemi',
    producer: 'L. Mwangi',
    topic: 'Money',
    recorded: 'Remote',
    tags: ['Money', 'Practice'],
    guests: [{ name: 'S. Adekunle', role: 'Lawyer · Member' }],
    chapters: [
      { ts: '00:00', title: 'Three clauses that age badly' },
      { ts: '12:00', title: 'What to put in their place' },
    ],
    yt: PLACEHOLDER_YT,
  },
];
