'use client';

import { useEffect, useState } from 'react';
import type { Project, AfxCurrency, EvidenceClaim, VettingSubmission } from '@/lib/afx/types';
import { isVettingReady } from '@/lib/afx/documents';
import { VETTING_STATUS_META } from '@/lib/afx/vetting';
import {
  isCaseStudySavable, toggleJurisdiction, setBudgetBand, setOutcome, setExactBudget,
  addDistribution, updateDistribution, removeDistribution,
  addFestival, updateFestival, removeFestival,
  addEvidence, updateEvidence, removeEvidence,
  addDocument, updateDocument, removeDocument,
} from '@/lib/afx/caseStudy';
import AfxDocumentUpload from './AfxDocumentUpload';
import {
  CASE_STUDY_FORMATS, RECOUPMENT_OPTIONS, BOND_OPTIONS, DISTRIBUTION_TYPES,
  JURISDICTION_OPTIONS, EVIDENCE_CLAIM_LABELS,
} from '@/lib/afx/constants';
import { InlineEdit, GhostButton } from './cockpitUi';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import ExactFigureInput from '@/components/afx/primitives/ExactFigureInput';

const mono = 'var(--afx-mono)';

interface CaseStudyDrawerProps {
  initial: Project;
  isNew: boolean;
  ndaSigned: boolean;
  defaultCurrency: AfxCurrency;
  submission?: VettingSubmission;
  locked: boolean;
  busy?: boolean;
  onSave: (study: Project) => void;
  onClose: () => void;
  onRemove?: () => void;
  onSubmit?: (study: Project) => void;
  onWithdraw?: () => void;
}

export default function CaseStudyDrawer({ initial, isNew, ndaSigned, defaultCurrency, submission, locked, busy, onSave, onClose, onRemove, onSubmit, onWithdraw }: CaseStudyDrawerProps) {
  const [study, setStudy] = useState<Project>(() => structuredClone(initial));
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const o = study.outcomes;
  const savable = isCaseStudySavable(study);
  const ready = isVettingReady(study.docs);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 88, background: 'rgba(28,29,33,0.42)' }} />
      <aside role="dialog" aria-modal="true" aria-label={isNew ? 'Add case study' : 'Edit case study'}
        style={{ position: 'fixed', zIndex: 89, top: 0, right: 0, height: '100vh', width: 'min(560px,94vw)', background: '#FAF9F7', borderLeft: '1px solid #EAE8E3', boxShadow: '-24px 0 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }}>

        <header style={{ display: 'flex', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #EAE8E3', background: 'linear-gradient(180deg,#FCFBF9,#fff)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>{isNew ? 'Add case study' : 'Edit case study'}</h2>
          <button onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto', cursor: 'pointer', background: 'none', border: 'none', fontSize: 20, lineHeight: 1, color: '#9A9CA3' }}>×</button>
        </header>

        {submission && submission.status !== 'withdrawn' ? (
          <div style={{ margin: '0 22px 4px', padding: '10px 12px', borderRadius: 10,
            background: VETTING_STATUS_META[submission.status].bg, border: `1px solid ${VETTING_STATUS_META[submission.status].border}`,
            color: VETTING_STATUS_META[submission.status].ink, fontSize: 12.5 }}>
            <strong style={{ fontWeight: 700 }}>{VETTING_STATUS_META[submission.status].label}</strong>
            {locked ? ' — read-only while FRA reviews. Withdraw to edit.' : ''}
            {submission.status === 'changes_requested' && submission.reviewerNotes ? <div style={{ marginTop: 4 }}>{submission.reviewerNotes}</div> : null}
          </div>
        ) : null}

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18, pointerEvents: locked ? 'none' : 'auto', opacity: locked ? 0.65 : 1 }}>
          {/* Identity */}
          <InlineEdit label="Title" value={study.title} placeholder="Project title" onChange={(v) => setStudy((s) => ({ ...s, title: v }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Format">
              <Select value={study.format} options={CASE_STUDY_FORMATS} onChange={(v) => setStudy((s) => ({ ...s, format: v }))} />
            </Field>
            <InlineEdit label="Year" value={study.year != null ? String(study.year) : ''} placeholder="e.g. 2021"
              onChange={(v) => setStudy((s) => ({ ...s, year: v.trim() === '' ? undefined : Number(v.replace(/[^0-9]/g, '')) || undefined }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InlineEdit label="Your role" value={study.role} placeholder="e.g. Producer" onChange={(v) => setStudy((s) => ({ ...s, role: v }))} />
            <InlineEdit label="Genre" value={study.genre ?? ''} placeholder="e.g. Drama" onChange={(v) => setStudy((s) => ({ ...s, genre: v.trim() === '' ? undefined : v }))} />
          </div>
          <Field label="Jurisdiction">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {JURISDICTION_OPTIONS.map((code) => {
                const on = study.jurisdiction.includes(code);
                return (
                  <button key={code} onClick={() => setStudy((s) => toggleJurisdiction(s, code))}
                    style={{ cursor: 'pointer', fontFamily: mono, fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 999, border: `1px solid ${on ? '#1C1D21' : '#E4E2DC'}`, background: on ? '#1C1D21' : '#fff', color: on ? '#fff' : '#9A9CA3' }}>
                    {code}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Budget */}
          <Field label="Budget band">
            <input value={study.budgetBand.value} placeholder="e.g. $1–2M" onChange={(e) => setStudy((s) => setBudgetBand(s, e.target.value))} style={inputStyle} />
            <div style={{ marginTop: 6 }}><ProvenanceBadge provenance={study.budgetBand.provenance} size="sm" /></div>
            <ExactFigureInput value={study.exact?.budget} onCommit={(v) => setStudy((s) => setExactBudget(s, v))} gated={ndaSigned} label="budget" defaultCurrency={defaultCurrency}
              confirmHint={study.budgetBand.provenance === 'confirmed' ? '→ confirmed' : undefined} />
          </Field>

          {/* Outcomes */}
          <Field label="Recoupment">
            <Select value={o?.recoupment.value ?? ''} options={RECOUPMENT_OPTIONS} placeholder="—" onChange={(v) => setStudy((s) => setOutcome(s, 'recoupment', v))} />
          </Field>
          <Field label="Completion bond">
            <Select value={o?.bondUsed.value ?? ''} options={BOND_OPTIONS} placeholder="—" onChange={(v) => setStudy((s) => setOutcome(s, 'bondUsed', v))} />
          </Field>

          {/* Distribution rows */}
          <Field label="Distribution">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(o?.distribution ?? []).map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={d.name} placeholder="Partner / platform" onChange={(e) => setStudy((s) => updateDistribution(s, i, { name: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                  <Select value={d.type} options={DISTRIBUTION_TYPES} onChange={(v) => setStudy((s) => updateDistribution(s, i, { type: v }))} />
                  <RemoveBtn onClick={() => setStudy((s) => removeDistribution(s, i))} />
                </div>
              ))}
              <GhostButton onClick={() => setStudy((s) => addDistribution(s))} tone="accent">+ Add distribution</GhostButton>
            </div>
          </Field>

          {/* Festivals / awards */}
          <Field label="Festivals / awards">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(o?.festivalsAwards ?? []).map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={f} placeholder="e.g. Toronto 2021 — Official Selection" onChange={(e) => setStudy((s) => updateFestival(s, i, e.target.value))} style={{ ...inputStyle, flex: 1 }} />
                  <RemoveBtn onClick={() => setStudy((s) => removeFestival(s, i))} />
                </div>
              ))}
              <GhostButton onClick={() => setStudy((s) => addFestival(s))} tone="accent">+ Add festival / award</GhostButton>
            </div>
          </Field>

          {/* Tagged evidence */}
          <Field label="Evidence & links">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(study.evidence ?? []).map((e) => (
                <div key={e.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={e.url} placeholder="https://…" onChange={(ev) => setStudy((s) => updateEvidence(s, e.id, { url: ev.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                  <Select value={e.supports} options={Object.keys(EVIDENCE_CLAIM_LABELS) as EvidenceClaim[]} labelFor={(k) => EVIDENCE_CLAIM_LABELS[k as EvidenceClaim]}
                    onChange={(v) => setStudy((s) => updateEvidence(s, e.id, { supports: v as EvidenceClaim }))} />
                  <RemoveBtn onClick={() => setStudy((s) => removeEvidence(s, e.id))} />
                </div>
              ))}
              <GhostButton onClick={() => setStudy((s) => addEvidence(s))} tone="accent">+ Add link</GhostButton>
            </div>
          </Field>

          {/* Confidential documents — NDA-gated */}
          <Field label="Confidential documents">
            {ndaSigned ? (
              <AfxDocumentUpload
                caseStudyId={study.id}
                docs={study.docs ?? []}
                onAdd={(doc) => setStudy((s) => addDocument(s, doc))}
                onUpdate={(id, patch) => setStudy((s) => updateDocument(s, id, patch))}
                onRemove={(id) => setStudy((s) => removeDocument(s, id))}
              />
            ) : (
              <div style={{ fontSize: 12.5, color: '#9A9CA3', border: '1px dashed #DAD7D0', borderRadius: 8, padding: '12px 14px' }}>
                Sign the FRA NDA to attach confidential documents (budget, chain of title, waterfall, agreements). A case study can&rsquo;t be made vetting-ready until its required proof is attached.
              </div>
            )}
          </Field>
        </div>

        <footer style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 22px', borderTop: '1px solid #EAE8E3', background: '#fff' }}>
          {confirmingRemove ? (
            <>
              <span style={{ fontFamily: 'var(--afx-body)', fontSize: 13, color: '#5E6066', flex: 1 }}>Remove this case study? This can't be undone.</span>
              <button onClick={() => setConfirmingRemove(false)} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' }}>Cancel</button>
              <button onClick={onRemove} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #7A2E2E', background: '#7A2E2E', color: '#fff' }}>Remove</button>
            </>
          ) : (
            <>
              {!isNew && onRemove && !locked ? (
                <button onClick={() => setConfirmingRemove(true)} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #E3B6AE', background: '#fff', color: '#7A2E2E' }}>Remove</button>
              ) : null}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 15px', borderRadius: 8, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' }}>Close</button>
                {locked ? (
                  <button onClick={onWithdraw} disabled={busy} style={{ cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 17px', borderRadius: 8, border: '1px solid #9A6B1E', background: '#fff', color: '#9A6B1E', opacity: busy ? 0.6 : 1 }}>Withdraw</button>
                ) : (
                  <>
                    <button onClick={() => onSave(study)} disabled={!savable}
                      style={{ cursor: savable ? 'pointer' : 'not-allowed', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 17px', borderRadius: 8, border: '1px solid #1C1D21', background: savable ? '#1C1D21' : '#C9C7C1', color: '#fff', opacity: savable ? 1 : 0.8 }}>
                      {isNew ? 'Add case study' : 'Save'}
                    </button>
                    {!isNew && onSubmit ? (
                      <button onClick={() => onSubmit?.(study)} disabled={busy || !ready} title={ready ? '' : 'Attach all required proof documents first'}
                        style={{ cursor: busy ? 'wait' : ready ? 'pointer' : 'not-allowed', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 700, padding: '9px 17px', borderRadius: 8, border: '1px solid #1C4E80', background: ready ? '#1C4E80' : '#A8B6C8', color: '#fff' }}>
                        Submit for vetting
                      </button>
                    ) : null}
                  </>
                )}
              </div>
            </>
          )}
        </footer>
      </aside>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--afx-body)', fontSize: 13, color: '#1C1D21',
  border: '1px solid #E4E2DC', borderRadius: 8, padding: '8px 11px', background: '#fff', outline: 'none',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function Select<T extends string>({ value, options, onChange, placeholder, labelFor }: { value: string; options: readonly T[]; onChange: (v: string) => void; placeholder?: string; labelFor?: (v: T) => string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', minWidth: 120 }}>
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((opt) => <option key={opt} value={opt}>{labelFor ? labelFor(opt) : opt}</option>)}
    </select>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} aria-label="Remove" style={{ cursor: 'pointer', background: 'none', border: '1px solid #E4E2DC', borderRadius: 7, width: 30, height: 30, color: '#9A9CA3', fontSize: 15, lineHeight: 1 }}>×</button>;
}
