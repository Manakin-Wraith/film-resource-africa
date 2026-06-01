'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, ArrowLeft, Send, Check } from 'lucide-react';
import { SECTIONS, wordCount, type Question, type IntakeAnswers } from '@/lib/prs/questions';

function Field({
  q, value, onChange,
}: {
  q: Question;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  const label = (
    <label className="form-label" htmlFor={`q${q.id}`}>
      <span className="q-num">Q{q.id}.</span>
      {q.q}
      {q.required && <span className="req">●</span>}
    </label>
  );
  const helper = q.helper ? <div className="form-helper">{q.helper}</div> : null;

  if (q.type === 'text' || q.type === 'url') {
    return (
      <div className="form-field">
        {label}{helper}
        <input
          id={`q${q.id}`} className="form-input"
          type={q.type === 'url' ? 'url' : 'text'}
          placeholder={q.placeholder || ''}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (q.type === 'textarea') {
    const wc = wordCount(value as string);
    const over = q.maxWords ? wc > q.maxWords : false;
    return (
      <div className="form-field">
        {label}{helper}
        <textarea
          id={`q${q.id}`} className="form-textarea" rows={q.rows || 4}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {q.maxWords && (
          <div className={'char-counter' + (over ? ' over' : '')}>{wc} / {q.maxWords} words</div>
        )}
      </div>
    );
  }

  if (q.type === 'select') {
    return (
      <div className="form-field">
        {label}{helper}
        <select
          id={`q${q.id}`} className="form-select"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>Select…</option>
          {q.options!.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  if (q.type === 'checkbox') {
    const arr = Array.isArray(value) ? value : [];
    const toggle = (opt: string) =>
      onChange(arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt]);
    return (
      <div className="form-field">
        {label}{helper}
        <div className="checkbox-group">
          {q.options!.map((o) => {
            const on = arr.includes(o);
            return (
              <div key={o} className={'check-option' + (on ? ' checked' : '')} onClick={() => toggle(o)}>
                <div className="check-box">{on && <Check size={12} />}</div>
                <div>{o}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (q.type === 'radio') {
    return (
      <div className="form-field">
        {label}{helper}
        <div className="checkbox-group">
          {q.options!.map((o) => {
            const on = value === o;
            return (
              <div key={o} className={'check-option' + (on ? ' checked' : '')} onClick={() => onChange(o)}>
                <div className="check-box check-radio">
                  {on && <div style={{ width: 8, height: 8, background: 'white', borderRadius: 999 }} />}
                </div>
                <div>{o}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

export default function IntakeForm() {
  const router = useRouter();
  const initial = useMemo<IntakeAnswers>(() => {
    const a: IntakeAnswers = {};
    SECTIONS.forEach((s) => s.questions.forEach((q) => { a[q.id] = q.type === 'checkbox' ? [] : ''; }));
    return a;
  }, []);

  const [answers, setAnswers] = useState<IntakeAnswers>(initial);
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [step, setStep] = useState(0); // 0 = intro, 1..7 = sections
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-assessment: ?project=<token> prefills from a prior diagnosis the member owns.
  const searchParams = useSearchParams();
  const reassessToken = searchParams.get('project');
  const [reassessTitle, setReassessTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!reassessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/assess/load?token=${encodeURIComponent(reassessToken)}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled || !data?.answers) return;
        // Merge onto the blank template so any newly-added questions stay initialised.
        setAnswers((prev) => ({ ...prev, ...(data.answers as IntakeAnswers) }));
        setReassessTitle(typeof data.project_title === 'string' ? data.project_title : null);
      } catch { /* prefill is best-effort */ }
    })();
    return () => { cancelled = true; };
  }, [reassessToken]);

  const total = SECTIONS.length;
  const section = step >= 1 && step <= total ? SECTIONS[step - 1] : null;
  const sectionIdx = step - 1;
  const setAnswer = (id: number, v: string | string[]) => setAnswers((p) => ({ ...p, [id]: v }));

  async function submit() {
    setError(null);
    if (!email || !/.+@.+\..+/.test(email)) { setError('Please enter a valid email — your report link goes here.'); return; }
    if (answers[25] !== 'Yes') { setError('Please consent (Q25) before submitting.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/assess/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answers, honeypot, reassessToken: reassessToken ?? undefined }),
      });
      const data = await res.json();
      if (res.status === 409 && data.token) {
        router.push(`/p/${data.token}`);
        return;
      }
      if (!res.ok) { setError(data.error || 'Something went wrong. Please try again.'); setSubmitting(false); return; }
      router.push(`/assess/processing?token=${data.token}`);
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  if (step === 0) {
    return (
      <div className="prs-container prs-intake-shell">
        <div className="section-rule section-rule-primary" />
        <div className="section-rubric">FRA Project Readiness Score · v1</div>
        {reassessToken && (
          <div
            style={{
              marginTop: 12, marginBottom: 4, borderRadius: 12, padding: '12px 16px',
              border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)',
              fontSize: 14, color: 'var(--foreground-secondary)',
            }}
          >
            Re-assessing{reassessTitle ? <> <strong style={{ color: 'var(--foreground)' }}>{reassessTitle}</strong></> : ' your project'} — your previous answers are pre-filled. Update them for a fresh diagnosis; it becomes the new current version of this project.
          </div>
        )}
        <h1 className="intake-section-title" style={{ marginTop: 8 }}>
          {reassessToken ? 'Re-assess your film project.' : 'A diagnosis of your film project.'}
        </h1>
        <p className="intake-section-sub" style={{ marginTop: 16, fontSize: 17 }}>
          Twenty-five questions, seven sections, about ten minutes. In return: a written diagnostic, scored
          across concept, market, commercial logic, South African alignment, and execution readiness — plus
          the SA funding pathways your project might fit.
        </p>

        <div className="intake-intro" style={{ marginTop: 32 }}>
          <strong>Be honest.</strong> Vague answers produce a vague score. The feedback will tell you what&rsquo;s{' '}
          <em>missing</em>, not what&rsquo;s great. That&rsquo;s the point.
          <br /><br />
          You can complete this in one sitting. Your answers are private to FRA; the report is yours.
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="prs-btn-primary" onClick={() => setStep(1)}>
            Begin intake <ArrowRight size={16} />
          </button>
          <div style={{ color: 'var(--foreground-tertiary)', fontSize: 12 }}>
            ~10 min · 25 questions · no save-and-resume in v1
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="prs-container prs-intake-shell">
      <div style={{ marginBottom: 32 }}>
        <div className="section-pip-row">
          {SECTIONS.map((_, i) => (
            <div key={i} className={'section-pip' + (i < sectionIdx ? ' done' : i === sectionIdx ? ' active' : '')} />
          ))}
        </div>
        <div className="intake-section-num">
          Section {step} of {total} · {section!.questions.length} question{section!.questions.length === 1 ? '' : 's'}
        </div>
        <h1 className="intake-section-title">{section!.title}</h1>
        <p className="intake-section-sub">{section!.sub}</p>
      </div>

      {/* Email capture — lives in the first section, like the pilot form's auto-collected email. */}
      {step === 1 && (
        <div className="form-field">
          <label className="form-label" htmlFor="prs-email">
            <span className="q-num">—</span>Your email<span className="req">●</span>
          </label>
          <div className="form-helper">Your report link is sent here. Private to FRA.</div>
          <input
            id="prs-email" className="form-input" type="email" inputMode="email"
            placeholder="you@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {/* honeypot — visually hidden; opted out of autofill + browser extensions */}
          <input
            type="text"
            name="fra_hp_field"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            value={honeypot} onChange={(e) => setHoneypot(e.target.value)}
            // display:none is skipped by password managers / autofill far more
            // reliably than off-screen positioning, which still trips real users.
            style={{ display: 'none' }}
          />
        </div>
      )}

      <div>
        {section!.questions.map((q) => (
          <Field key={q.id} q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
        ))}
      </div>

      {error && (
        <div className="stale-banner" style={{ color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)' }}>
          {error}
        </div>
      )}

      <div className="intake-foot">
        <button
          className="prs-btn-ghost" onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 1} style={step === 1 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="intake-foot-left">
          {step === total ? 'Final section' : `${total - step} section${total - step === 1 ? '' : 's'} remaining`}
        </div>
        {step === total ? (
          <button className="prs-btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit for diagnosis'} <Send size={14} />
          </button>
        ) : (
          <button
            className="prs-btn-primary"
            onClick={() => { setStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            Continue <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
