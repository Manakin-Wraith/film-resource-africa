// PRS v1 intake — 7 sections, 25 questions.
// Canonical source: the live pilot Google Form, transcribed in
// prs-ui-ux-brief.md § 7A. Keep IDs stable (Q1–Q25) — the diagnosis
// cites them as evidence ("you wrote on Q15…").

export type FieldType = 'text' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio';

export interface Question {
  id: number;
  q: string;
  type: FieldType;
  required: boolean;
  helper?: string;
  placeholder?: string;
  options?: string[];
  maxWords?: number;
  rows?: number;
}

export interface Section {
  title: string;
  sub: string;
  questions: Question[];
}

export const SECTIONS: Section[] = [
  {
    title: 'About You',
    sub: "Who's filling this in.",
    questions: [
      { id: 1, q: 'Your full name', type: 'text', required: true, placeholder: 'e.g. Nadia Solomons' },
      { id: 2, q: 'Your role on this project', type: 'select', required: true,
        options: ['Director', 'Producer', 'Writer-director', 'Writer', 'Other'] },
      { id: 3, q: 'Link to one representative prior work (full film, series episode, or showreel)', type: 'url', required: false,
        helper: 'URL accessible without login. Optional but strongly encouraged.', placeholder: 'https://vimeo.com/…' },
    ],
  },
  {
    title: 'The Project',
    sub: 'The thing itself — title, format, where you are.',
    questions: [
      { id: 4, q: 'Project title', type: 'text', required: true },
      { id: 5, q: 'Format', type: 'select', required: true,
        options: ['Feature film', 'Short film', 'Documentary feature', 'Documentary short', 'TV series', 'Web series', 'Commercial', 'Branded content'] },
      { id: 6, q: 'Genre', type: 'text', required: true, helper: 'e.g., drama, thriller, comedy, doc' },
      { id: 7, q: 'Logline', type: 'textarea', required: true, helper: 'Max 50 words — what is this project, in a breath', maxWords: 50 },
      { id: 8, q: 'Synopsis', type: 'textarea', required: true, helper: 'Max 300 words — the story, arc, what happens', maxWords: 300, rows: 6 },
      { id: 9, q: 'Current stage', type: 'select', required: true,
        options: ['Idea', 'Treatment', 'First draft script', 'Revised draft', 'Locked script', 'In development', 'Pre-production', 'Post-Production'] },
    ],
  },
  {
    title: 'Audience & Market',
    sub: "Who this is for. Why they'll care. What it's near.",
    questions: [
      { id: 10, q: 'Who is this project for? Describe the target audience', type: 'textarea', required: true,
        helper: 'Demographics + psychographics — age, geography, values, what else they watch' },
      { id: 11, q: 'Why will they care?', type: 'textarea', required: true, helper: 'Max 150 words — the emotional/cultural hook', maxWords: 150 },
      { id: 12, q: 'Two or three comparable films, series, or docs', type: 'textarea', required: true,
        helper: 'Real titles — shows you understand your genre and audience' },
    ],
  },
  {
    title: 'Production & Distribution',
    sub: 'Money, location, where the audience will actually find it.',
    questions: [
      { id: 13, q: 'Primary filming location', type: 'select', required: true, helper: 'Province, or country if outside SA',
        options: ['Western Cape', 'Gauteng', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape', 'Multiple SA provinces', 'Elsewhere in Africa', 'Outside Africa'] },
      { id: 14, q: 'Estimated total production budget (ZAR)', type: 'select', required: true,
        options: ['Under R500k', 'R500k–R2m', 'R2m–R5m', 'R5m–R15m', 'R15m–R50m', 'Over R50m', "I don't know yet"] },
      { id: 15, q: 'Where do you intend this project to be seen?', type: 'checkbox', required: true,
        options: ['Cinema (theatrical)', 'Festival circuit', 'SA broadcast (SABC, eTV)', 'African streaming', 'Global streaming (Netflix, Prime, etc.)', 'Direct-to-audience (YouTube, web)', 'Commissioned (brand/corporate)', 'Not decided yet'] },
      { id: 16, q: 'How will this project make money back — or justify its budget?', type: 'textarea', required: true,
        helper: "Max 150 words — licensing, box office, grants-only, sponsorship, etc. Be honest if you haven't thought about it.", maxWords: 150 },
    ],
  },
  {
    title: 'South African & Regional Alignment',
    sub: 'How this fits where it lives.',
    questions: [
      { id: 17, q: 'How does this project connect to South African or African identity, culture, history, or economy?', type: 'textarea', required: true,
        helper: 'This matters to NFVF, Gauteng FC, KZN FC — all score cultural relevance' },
      { id: 18, q: 'How familiar are you with SA film funding bodies and incentives?', type: 'select', required: true,
        options: ["I've applied before", "I've researched them closely", 'I know they exist', "I'm not familiar at all"] },
      { id: 19, q: 'Which SA funders or incentives do you think your project might fit?', type: 'textarea', required: false,
        helper: 'Optional — tells us how funder-literate you are' },
    ],
  },
  {
    title: 'Team & Execution',
    sub: "Who's on this and what they've done.",
    questions: [
      { id: 20, q: 'Who is attached to the project?', type: 'textarea', required: true,
        helper: 'Director, producer, writer — names + one-line credits. e.g., "Directed by X (prior: Film Name 2023). Produced by Y (prior: Series Name)."' },
      { id: 21, q: 'Have you or the team raised or completed a project before?', type: 'select', required: true,
        options: ['Yes, multiple', 'Yes, one', 'No, this is our first'] },
    ],
  },
  {
    title: 'The Ask',
    sub: "What you want from FRA's read.",
    questions: [
      { id: 22, q: 'What are you seeking right now?', type: 'checkbox', required: true,
        options: ['Development funding', 'Production funding', 'Co-production partner', 'Distribution deal', 'Mentorship', 'Just feedback'] },
      { id: 23, q: 'What percentage of the budget is already secured?', type: 'select', required: false, helper: 'In-kind, self-funded, or committed',
        options: ['0%', 'Under 25%', '25–50%', '50–75%', 'Over 75%'] },
      { id: 24, q: 'Anything else we should know?', type: 'textarea', required: false },
      { id: 25, q: 'I consent to FRA contacting me about membership and follow-up feedback', type: 'radio', required: true,
        options: ['Yes', 'No'] },
    ],
  },
];

export const ALL_QUESTIONS: Question[] = SECTIONS.flatMap((s) => s.questions);

export const QUESTION_BY_ID: Record<number, Question> = Object.fromEntries(
  ALL_QUESTIONS.map((q) => [q.id, q]),
);

export type IntakeAnswers = Record<number, string | string[]>;

export function wordCount(s: string | undefined): number {
  if (!s) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

// Validate a full intake submission. Returns list of missing/invalid question IDs.
export function validateIntake(answers: IntakeAnswers): number[] {
  const problems: number[] = [];
  for (const q of ALL_QUESTIONS) {
    if (!q.required) continue;
    const v = answers[q.id];
    if (q.type === 'checkbox') {
      if (!Array.isArray(v) || v.length === 0) problems.push(q.id);
    } else if (typeof v !== 'string' || v.trim() === '') {
      problems.push(q.id);
    }
  }
  return problems;
}
