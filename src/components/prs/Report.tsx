'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Check, Calendar, User, Film, AlertTriangle, RefreshCw, Send, ArrowRight,
  Lock, Users, Globe, EyeOff,
} from 'lucide-react';
import type { Diagnosis, PrsTier } from '@/lib/prs/types';
import { TIER_LABELS, TIER_CLASS } from '@/lib/prs/types';
import { setProjectVisibility, type ProjectVisibility } from '@/app/actions';

export interface ProjectHead {
  title: string;
  format: string | null;
  genre: string | null;
  country: string | null;
}

export interface JournalEntry {
  token: string;
  date: string;
  tier: PrsTier | null;
  score: number | null;
  current: boolean;
  age: string;
}

interface FootMeta {
  scoredAt: string;
  submittedAt: string;
}

function TierBadge({ tier }: { tier: PrsTier }) {
  return (
    <span className={'prs-tier-badge ' + TIER_CLASS[tier]}>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }} />
      {TIER_LABELS[tier]}
    </span>
  );
}

function CardHead({ project, right }: { project: ProjectHead; right?: React.ReactNode }) {
  const meta = [project.format, project.genre, project.country].filter(Boolean).join(' · ');
  return (
    <header style={{ marginBottom: 36 }}>
      <div className="section-rule section-rule-muted" />
      <div className="section-rubric">Diagnosis · v1</div>
      <div className="card-head-row">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="card-title">{project.title}</h1>
          {meta && <div className="card-meta">{meta}</div>}
        </div>
        {right}
      </div>
    </header>
  );
}

function Section({
  rule = 'muted', rubric, title, sub, children,
}: {
  rule?: 'muted' | 'primary' | 'accent' | 'urgent' | 'success';
  rubric: string; title: string; sub?: string; children: React.ReactNode;
}) {
  return (
    <section className="prs-report-section">
      <div className={`section-rule section-rule-${rule}`} />
      <div className="section-rubric">{rubric}</div>
      <h2 className="section-heading">{title}</h2>
      {sub && <p className="prs-prose-secondary" style={{ marginBottom: 24, marginTop: -8, maxWidth: '60ch' }}>{sub}</p>}
      {children}
    </section>
  );
}

function StaleBanner({ isMember }: { isMember: boolean }) {
  return (
    <div className="stale-banner">
      <AlertTriangle size={16} />
      <div>
        <strong style={{ color: 'var(--foreground)', fontWeight: 600 }}>This diagnosis is over a month old.</strong>
        <span style={{ color: 'var(--foreground-secondary)', marginLeft: 6 }}>
          {isMember
            ? 'Project moved on? Submit a fresh diagnosis.'
            : 'Your project may have moved on. Free intake is one-per-project — upgrade to re-submit.'}
        </span>
      </div>
    </div>
  );
}

function FootMetaRow({ meta }: { meta: FootMeta }) {
  return (
    <div className="card-footer">
      <span>Scored {meta.scoredAt}</span>
      <span className="dot">·</span>
      <span>Submitted {meta.submittedAt}</span>
      <span className="dot">·</span>
      <span>PRS v1.0</span>
      <span className="dot">·</span>
      <span>Informational only — not a funder decision</span>
    </div>
  );
}

/* ─────────────────────────  FREE  ───────────────────────── */

export function ReportFree({
  project, diagnosis, stale, meta,
}: { project: ProjectHead; diagnosis: Diagnosis; stale: boolean; meta: FootMeta }) {
  const d = diagnosis;
  const [tier, setTier] = useState<'individual' | 'business'>('individual');

  return (
    <div className="prs-root">
      <div className="prs-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <CardHead project={project} />

        <div className="score-block">
          <div className="score-headline">
            <div>
              <div className="section-rubric" style={{ marginBottom: 6 }}>Your project is</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <TierBadge tier={d.tier} />
                <div className="score-headline-num">{d.score}<span> / {d.scoreMax}</span></div>
              </div>
            </div>
          </div>
          <div className="score-row">
            <div className="score-label">Funder-fit verdict</div>
            <div className="score-value-secondary">{d.funderFit}</div>
          </div>
        </div>

        {stale && <StaleBanner isMember={false} />}

        <Section rule="primary" rubric="The read" title="A specialist's opening assessment">
          <p className="the-read">{d.readFree}</p>
        </Section>

        <Section rule="success" rubric="What's working" title="Strengths the intake makes visible">
          {d.working.map((w, i) => (
            <div key={i} className="working-bullet">
              <div className="working-bullet-tick"><Check size={14} /></div>
              <div>{w.free}</div>
            </div>
          ))}
        </Section>

        <Section
          rule="accent" rubric="What's blocking" title="Problems to solve before funding"
          sub="Described, not solved. The full report names the specific fixes."
        >
          {d.blocking.map((b, i) => (
            <div key={i} className="blocker">
              <div className="blocker-num">{String(i + 1).padStart(2, '0')}</div>
              <div><p className="blocker-body">{b.free}</p></div>
            </div>
          ))}
        </Section>

        <Section rule="muted" rubric="Where this project's home is" title="One direction, no named funders">
          <p className="the-read" style={{ fontSize: 19 }}>{d.homeDirection.free}</p>
        </Section>

        {/* Conversion mechanism — structural tease, no paywall blur */}
        <div className="tease">
          <div className="section-rule section-rule-primary" />
          <div className="section-rubric">The full report</div>
          <h2 className="section-heading">What member access adds.</h2>
          <p className="prs-prose-secondary" style={{ maxWidth: '56ch', marginBottom: 28 }}>
            Your free diagnosis is complete. Membership extends it with named funders, deadlines, and
            specific moves — and lets you save this project and share it with partners and funders. Not blurred
            paywall previews, just a different document.
          </p>

          <div className="tease-card">
            <ul className="tease-list">
              {[
                ['Showcase this project', "List it on the public Projects directory — its logline, format, and what you're seeking, in front of producers, funders, and co-pro partners across the continent. Your score and diagnosis stay private."],
                ['Pathway-scoped scoring', 'Your project against two SA funding lanes — primary and secondary, with a numeric verdict on each.'],
                ['Named funders, programs, and deadlines', "Three live opportunities matched to your project, sorted by deadline. Updated weekly by FRA's scanner."],
                ['Three concrete moves for this quarter', 'Each with a named program, deadline, and a contact you can be introduced to.'],
                ['"What FRA would do"', 'The representation moves FRA would make if this project were on our desk. Each ends with a tracked conversation link.'],
                ['Resubmit any time', 'A journal of point-in-time diagnoses. Your project evolves; the read should evolve with it.'],
              ].map(([t, s]) => (
                <li key={t} className="tease-item">
                  <span className="tease-item-icon"><Check size={14} /></span>
                  <div><strong>{t}</strong><span>{s}</span></div>
                </li>
              ))}
            </ul>

            <div className="tease-cta-wrap">
              <div className="tease-tier-toggle">
                <button className={'tier-pick' + (tier === 'individual' ? ' active' : '')} onClick={() => setTier('individual')}>
                  Individual — ZAR 99/mo<small>Filmmakers · single seat</small>
                </button>
                <button className={'tier-pick' + (tier === 'business' ? ' active' : '')} onClick={() => setTier('business')}>
                  Business — ZAR 225/mo<small>Production companies · 5 seats</small>
                </button>
              </div>
              <Link href="/members" className="prs-btn-primary" style={{ width: '100%', fontSize: 15 }}>
                Become a founding member — ZAR {tier === 'individual' ? '99' : '225'}/mo <ArrowRight size={16} />
              </Link>
              <p className="tease-footnote">
                Founding price locked for life. Cancel any time.
                <br />No paywall mid-report — your free diagnosis above is yours to keep.
              </p>
            </div>
          </div>
        </div>

        <FootMetaRow meta={meta} />
      </div>
    </div>
  );
}

/* ─────────────────────────  MEMBER  ───────────────────────── */

function gradientFor(band: 'primary' | 'amber' | 'green') {
  return {
    primary: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    amber: 'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)',
    green: 'linear-gradient(135deg, #14532d 0%, #22c55e 100%)',
  }[band];
}

const VIS_CHOICES: { value: ProjectVisibility; label: string; sub: string; Icon: typeof Lock }[] = [
  { value: 'private', label: 'Private', sub: 'Only you', Icon: Lock },
  { value: 'members', label: 'Members', sub: 'FRA members', Icon: Users },
  { value: 'public', label: 'Public', sub: 'Anyone', Icon: Globe },
];

const VIS_STATUS: Record<ProjectVisibility, string> = {
  private: 'Only you can see this. It isn’t listed anywhere — your diagnosis stays in your journal.',
  members: 'Visible as a pitch card to logged-in FRA members. Your score and diagnosis stay private.',
  public: 'Live on your profile and the public Projects directory. Your score and diagnosis stay private — only the pitch card (logline, format, readiness tier) is shown.',
};

function NextStepsPanel({
  token, username, initialVisibility,
}: {
  token: string; username: string | null; initialVisibility: ProjectVisibility;
}) {
  const [visibility, setVisibility] = useState<ProjectVisibility>(initialVisibility);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: ProjectVisibility) {
    if (next === visibility || pending) return;
    const prev = visibility;
    setVisibility(next);
    setError(null);
    startTransition(async () => {
      try {
        await setProjectVisibility(token, next);
      } catch {
        setVisibility(prev);
        setError('Couldn’t update visibility — please try again.');
      }
    });
  }

  return (
    <div
      style={{
        marginTop: 40, marginBottom: 8, borderRadius: 18, padding: '26px 24px',
        border: '1px solid var(--color-line)',
        background: 'linear-gradient(180deg, rgba(59,130,246,0.07), transparent 70%), rgba(31,24,19,0.03)',
      }}
    >
      <div className="section-rubric" style={{ marginBottom: 6 }}>What’s next</div>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, lineHeight: 1.15, margin: 0 }}>
        Share your project
      </h3>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--foreground-secondary)', marginTop: 8, maxWidth: 560 }}>
        This diagnosis is saved to your journal automatically. Choose who can discover this project as a pitch card —
        your private score and diagnosis are never shown to anyone but you.
      </p>

      {/* Visibility segmented control */}
      <div
        role="radiogroup"
        aria-label="Project visibility"
        className="grid grid-cols-3 gap-2 mt-[18px] max-w-[460px]"
      >
        {VIS_CHOICES.map(({ value, label, sub, Icon }) => {
          const active = value === visibility;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => change(value)}
              disabled={pending}
              className={`flex flex-col items-center gap-[5px] px-2 py-3 rounded-xl border transition-colors disabled:cursor-default ${
                active
                  ? 'border-primary/60 bg-primary/15 text-primary-text'
                  : 'border-line-mid bg-foreground/[0.04] text-(--foreground-secondary) cursor-pointer'
              }`}
            >
              <Icon size={16} />
              <span className="text-[13px] font-bold">{label}</span>
              <span className="text-[11px] text-(--foreground-tertiary)">{sub}</span>
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--foreground-tertiary)', marginTop: 12, maxWidth: 560 }}>
        {pending ? 'Saving…' : VIS_STATUS[visibility]}
      </p>
      {error && <p className="text-urgent" style={{ fontSize: 12.5, marginTop: 4 }}>{error}</p>}

      {/* Action links */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center', marginTop: 20 }}>
        {username && (
          <Link href={`/members/${username}`} className="prs-link-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            View on your profile <ArrowRight size={13} />
          </Link>
        )}
        <Link href="/projects" className="prs-link-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Browse all projects <ArrowRight size={13} />
        </Link>
        {visibility !== 'private' && (
          <button
            type="button"
            onClick={() => change('private')}
            disabled={pending}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 'auto',
              background: 'none', border: 'none', padding: 0, cursor: pending ? 'default' : 'pointer',
              fontSize: 13, color: 'var(--foreground-tertiary)',
            }}
          >
            <EyeOff size={13} /> Remove from listings
          </button>
        )}
      </div>
    </div>
  );
}

export function ReportMember({
  project, diagnosis, stale, meta, journal, token, username, visibility,
}: {
  project: ProjectHead; diagnosis: Diagnosis; stale: boolean; meta: FootMeta;
  journal: JournalEntry[]; token: string;
  username: string | null; visibility: ProjectVisibility;
}) {
  const d = diagnosis;
  const [requested, setRequested] = useState<Record<string, boolean>>({});

  async function requestIntro(kind: string, subject: string) {
    const key = `${kind}:${subject}`;
    setRequested((r) => ({ ...r, [key]: true }));
    try {
      await fetch('/api/assess/intro', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, kind, subject }),
      });
    } catch { /* optimistic — non-fatal */ }
  }

  return (
    <div className="prs-root">
      <div className="prs-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <CardHead
          project={project}
          right={
            <Link href={`/assess?project=${token}`} className="prs-btn-ghost">
              Submit fresh diagnosis <RefreshCw size={13} />
            </Link>
          }
        />

        {/* Journal */}
        <div style={{ marginBottom: 32 }}>
          <div className="section-rubric" style={{ marginBottom: 10 }}>
            Diagnosis journal · {journal.length} read{journal.length === 1 ? '' : 's'} on this project
          </div>
          <div className="journal">
            {journal.map((e) => {
              const row = (
                <>
                  <div className="journal-dot" />
                  <div>
                    <div className="journal-date">{e.date}</div>
                    <div style={{ fontSize: 11, color: 'var(--foreground-tertiary)', marginTop: 2 }}>{e.age}</div>
                  </div>
                  <div className="journal-meta">
                    <span style={{ textTransform: 'capitalize' }}>{e.tier ? TIER_LABELS[e.tier] : '—'}</span>
                    <span>·</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      {e.score != null ? `${e.score}/25` : '—'}
                    </span>
                    {e.current && <span className="journal-current-tag">Current</span>}
                  </div>
                </>
              );
              return e.current ? (
                <div key={e.token} className="journal-row current">{row}</div>
              ) : (
                <Link key={e.token} href={`/p/${e.token}`} className="journal-row">{row}</Link>
              );
            })}
          </div>
        </div>

        {/* Score block */}
        <div className="score-block">
          <div className="score-headline">
            <div>
              <div className="section-rubric" style={{ marginBottom: 6 }}>Your project is</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <TierBadge tier={d.tier} />
                <div className="score-headline-num">{d.score}<span> / {d.scoreMax}</span></div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, auto)', gap: 14, fontVariantNumeric: 'tabular-nums' }}>
              {d.subScores.map((s) => (
                <div key={s.label} style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--foreground-tertiary)', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>
                    {s.value}<span style={{ color: 'var(--foreground-tertiary)', fontSize: 12 }}> / {s.max}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {d.pathways.map((p) => (
            <div key={p.name} className="score-row">
              <div><div className="score-label">{p.name}</div></div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                <div className="score-value-secondary" style={{ fontStyle: 'italic' }}>{p.verdict}</div>
                <div className="score-value">{p.score}<span style={{ color: 'var(--foreground-tertiary)', fontSize: 13, fontWeight: 500 }}> / {p.max}</span></div>
              </div>
            </div>
          ))}

          <div className="score-row">
            <div className="score-label">Funder-fit verdict</div>
            <div className="score-value-secondary">{d.funderFit}</div>
          </div>
          <div className="score-row">
            <div className="score-label">Budget coherence</div>
            <div className="score-value-secondary">{d.budgetCoherence}</div>
          </div>
        </div>

        {stale && <StaleBanner isMember={true} />}

        <Section rule="primary" rubric="The read" title="A specialist's full assessment">
          <p className="the-read">{d.readMember}</p>
        </Section>

        <Section rule="success" rubric="What's working" title="Strengths visible from the intake">
          {d.working.map((w, i) => (
            <div key={i} className="working-bullet">
              <div className="working-bullet-tick"><Check size={14} /></div>
              <div>{w.member}<span className="evidence">Evidence: {w.evidence}</span></div>
            </div>
          ))}
        </Section>

        <Section rule="accent" rubric="What's blocking" title="Problems — and the specific fix for each">
          {d.blocking.map((b, i) => (
            <div key={i} className="blocker">
              <div className="blocker-num">{String(i + 1).padStart(2, '0')}</div>
              <div>
                <p className="blocker-body">{b.member}</p>
                <div className="blocker-fix"><span className="blocker-fix-label">The fix</span>{b.fix}</div>
              </div>
            </div>
          ))}
        </Section>

        <Section
          rule="accent" rubric="Three moves this quarter" title="What to do in the next 90 days"
          sub="Each move has a named program, a deadline, and a contact we can introduce you to."
        >
          {d.moves.map((m, i) => (
            <div key={i} className="move-card">
              <div className="move-num">{String(i + 1).padStart(2, '0')}</div>
              <div>
                <h3 className="move-title">{m.title}</h3>
                <p className="move-body">{m.rationale}</p>
                <div className="move-meta">
                  <span className="move-meta-item move-meta-deadline"><Calendar size={12} /> {m.deadline}</span>
                  <span className="move-meta-item"><User size={12} /> {m.contact}</span>
                  <span className="move-meta-item"><Film size={12} /> {m.program}</span>
                </div>
              </div>
            </div>
          ))}
        </Section>

        <Section
          rule="urgent" rubric="Live opportunities" title="Matched to this project · scanner-fresh"
          sub="From FRA's funding scanner. Sorted by deadline. Updated weekly."
        >
          <div className="opp-row">
            {d.opportunities.map((o, i) => (
              <div key={i} className={'opp-card ' + (o.bandColor === 'amber' ? 'opp-card-left-amber' : o.bandColor === 'green' ? 'opp-card-left-green' : '')}>
                <div className="opp-card-header img-placeholder" style={{ background: gradientFor(o.bandColor), color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 0, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 8px)' }} />
                  <div style={{ position: 'relative', fontSize: 9, letterSpacing: '0.18em' }}>{o.org.toUpperCase()}</div>
                </div>
                <div className="opp-card-body">
                  <div className={'opp-pill ' + (o.urgency === 'closing' ? 'opp-pill-closing' : 'opp-pill-open')}>
                    {o.urgency === 'closing' ? 'Closing soon' : 'Open'} · {o.bandLabel}
                  </div>
                  <h4 className="opp-title">{o.program}</h4>
                  <div className="opp-org">{o.org}</div>
                  <div className="opp-deadline"><Calendar size={12} /> Deadline {o.deadline}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {d.counterparties.length > 0 && (
        <Section
          rule="muted" rubric="Counterparties" title="People we'd put you in front of"
          sub="Curated from FRA's rolodex. Tap any card to request an introduction."
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {d.counterparties.map((cp, i) => {
              const key = `counterparty:${cp.name}`;
              return (
                <div key={i} className="cp-card">
                  <div className="cp-row">
                    <div className="cp-avatar">{cp.initials}</div>
                    <div style={{ flex: 1 }}>
                      <h4 className="cp-name">{cp.name}</h4>
                      <div className="cp-role">{cp.role} · {cp.region}</div>
                    </div>
                  </div>
                  <div className="cp-fit">{cp.fit}</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="prs-btn-ghost" disabled={requested[key]}
                      onClick={() => requestIntro('counterparty', cp.name)}
                    >
                      {requested[key] ? 'Intro requested ✓' : <>Request intro <Send size={13} /></>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
        )}

        <Section
          rule="primary" rubric="What FRA would do" title="If this were our desk"
          sub="Representation moves FRA would handle on your behalf. Each opens a tracked conversation."
        >
          {d.fraMoves.map((m, i) => {
            const key = `fra_move:${m.title}`;
            return (
              <div key={i} className="fra-move">
                <h4 className="fra-move-title">{m.title}</h4>
                <p className="fra-move-body">{m.body}</p>
                <button
                  className="prs-link-primary" disabled={requested[key]}
                  onClick={() => requestIntro('fra_move', m.title)}
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  {requested[key] ? 'Sent to FRA ✓' : <>Discuss with FRA <ArrowRight size={12} /></>}
                </button>
              </div>
            );
          })}
        </Section>

        <NextStepsPanel token={token} username={username} initialVisibility={visibility} />

        <FootMetaRow meta={meta} />
      </div>
    </div>
  );
}
