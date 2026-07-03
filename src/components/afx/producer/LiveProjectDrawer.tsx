'use client';

import { useEffect, useState } from 'react';
import type { Project, AfxCurrency, SoftFundingStatus, ExactMoney } from '@/lib/afx/types';
import {
  isLiveProjectSavable,
  addSoftFunding, updateSoftFunding, removeSoftFunding,
  addPackaging, updatePackaging, removePackaging,
  addDocument, updateDocument, removeDocument,
} from '@/lib/afx/liveProject';
import { LIVE_DOCUMENT_CATEGORIES } from '@/lib/afx/documents';
import { LIVE_STAGE_OPTIONS, FUNDING_SECURED_BANDS, SOFT_FUNDING_STATUS_LABELS, CASE_STUDY_FORMATS, JURISDICTION_OPTIONS } from '@/lib/afx/constants';
import AfxDocumentUpload from './AfxDocumentUpload';
import { InlineEdit, GhostButton } from './cockpitUi';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import ExactFigureInput from '@/components/afx/primitives/ExactFigureInput';

const mono = 'var(--afx-mono)';

interface LiveProjectDrawerProps {
  initial: Project;
  ndaSigned: boolean;
  defaultCurrency: AfxCurrency;
  onSave: (project: Project) => void;
  onClose: () => void;
  onRemove?: () => void;
}

export default function LiveProjectDrawer({ initial, ndaSigned, defaultCurrency, onSave, onClose, onRemove }: LiveProjectDrawerProps) {
  const [proj, setProj] = useState<Project>(() => structuredClone(initial));
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ask = proj.ask;
  const savable = isLiveProjectSavable(proj);
  const setAsk = (patch: Partial<NonNullable<Project['ask']>>) =>
    setProj((p) => (p.ask ? { ...p, ask: { ...p.ask, ...patch } } : p));
  const setLeg = (leg: 'equityPct' | 'softPct' | 'debtPct' | 'gapPct', v: number) =>
    setProj((p) => (p.ask ? { ...p, ask: { ...p.ask, capitalStack: { ...p.ask.capitalStack, [leg]: v } } } : p));
  const setExactBudget = (v: ExactMoney | undefined) =>
    setProj((p) => {
      const exact = { ...p.exact };
      if (v === undefined) delete exact.budget; else exact.budget = v;
      let budgetBand = p.budgetBand;
      if (v !== undefined && p.budgetBand.provenance === 'self') budgetBand = { ...p.budgetBand, provenance: 'confirmed' };
      if (v === undefined && p.budgetBand.provenance === 'confirmed') budgetBand = { ...p.budgetBand, provenance: 'self' };
      const hasExact = exact.budget || exact.fundingSecured || exact.capitalStack;
      return { ...p, budgetBand, exact: hasExact ? exact : undefined };
    });

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 88, background: 'rgba(28,29,33,0.42)' }} />
      <aside role="dialog" aria-modal="true" aria-label="Package live project"
        style={{ position: 'fixed', zIndex: 89, top: 0, right: 0, height: '100vh', width: 'min(560px,94vw)', background: '#FAF9F7', borderLeft: '1px solid #EAE8E3', boxShadow: '-24px 0 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }}>

        <header style={{ display: 'flex', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #EAE8E3', background: 'linear-gradient(180deg,#FCFBF9,#fff)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>Package project</h2>
          <button onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto', cursor: 'pointer', background: 'none', border: 'none', fontSize: 20, lineHeight: 1, color: '#9A9CA3' }}>×</button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Identity */}
          <InlineEdit label="Title" value={proj.title} placeholder="Project title" onChange={(v) => setProj((p) => ({ ...p, title: v }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Format">
              <Select value={proj.format} options={CASE_STUDY_FORMATS} onChange={(v) => setProj((p) => ({ ...p, format: v }))} />
            </Field>
            <InlineEdit label="Genre" value={proj.genre ?? ''} placeholder="e.g. Drama" onChange={(v) => setProj((p) => ({ ...p, genre: v.trim() === '' ? undefined : v }))} />
          </div>
          <Field label="Jurisdiction">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {JURISDICTION_OPTIONS.map((code) => {
                const on = proj.jurisdiction.includes(code);
                return (
                  <button key={code} onClick={() => setProj((p) => ({ ...p, jurisdiction: on ? p.jurisdiction.filter((j) => j !== code) : [...p.jurisdiction, code] }))}
                    style={{ cursor: 'pointer', fontFamily: mono, fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 999, border: `1px solid ${on ? '#1C1D21' : '#E4E2DC'}`, background: on ? '#1C1D21' : '#fff', color: on ? '#fff' : '#9A9CA3' }}>
                    {code}
                  </button>
                );
              })}
            </div>
          </Field>

          {ask ? (
            <>
              {/* Stage */}
              <Field label="Current stage">
                <Select value={ask.stage} options={LIVE_STAGE_OPTIONS} placeholder="—" onChange={(v) => setAsk({ stage: v })} />
              </Field>

              {/* The ask */}
              <Field label="Logline">
                <textarea value={ask.logline} placeholder="One-line pitch" onChange={(e) => setAsk({ logline: e.target.value })}
                  style={{ ...inputStyle, width: '100%', minHeight: 60, resize: 'vertical' }} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <InlineEdit label="Commercial path" value={ask.commercialPath} placeholder="e.g. Streamer-first" onChange={(v) => setAsk({ commercialPath: v })} />
                <Field label="Funding secured">
                  <Select value={ask.fundingSecuredBand} options={FUNDING_SECURED_BANDS} placeholder="—" onChange={(v) => setAsk({ fundingSecuredBand: v })} />
                </Field>
              </div>

              {/* Budget band + NDA exact */}
              <Field label="Budget band">
                <input value={proj.budgetBand.value} placeholder="e.g. $1–2M" onChange={(e) => setProj((p) => ({ ...p, budgetBand: { value: e.target.value, provenance: 'self' } }))} style={inputStyle} />
                <div style={{ marginTop: 6 }}><ProvenanceBadge provenance={proj.budgetBand.provenance} size="sm" /></div>
                <ExactFigureInput value={proj.exact?.budget} onCommit={setExactBudget} gated={ndaSigned} label="budget" defaultCurrency={defaultCurrency}
                  confirmHint={proj.budgetBand.provenance === 'confirmed' ? '→ confirmed' : undefined} />
              </Field>

              {/* Capital stack % */}
              <Field label="Capital stack %">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
                  {(['equityPct', 'softPct', 'debtPct', 'gapPct'] as const).map((leg) => (
                    <div key={leg}>
                      <span style={{ fontSize: 11, color: '#9A9CA3' }}>{leg.replace('Pct', '')}</span>
                      <input type="number" min={0} max={100} value={ask.capitalStack[leg]} onChange={(e) => setLeg(leg, Number(e.target.value) || 0)} style={{ ...inputStyle, width: '100%' }} />
                    </div>
                  ))}
                </div>
              </Field>

              {/* Packaging */}
              <Field label="Packaging">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ask.packaging.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input value={a.role} placeholder="Role" onChange={(e) => setProj((p) => updatePackaging(p, i, { role: e.target.value }))} style={{ ...inputStyle, width: 90 }} />
                      <input value={a.name} placeholder="Name" onChange={(e) => setProj((p) => updatePackaging(p, i, { name: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                      <Select value={a.status} options={['signed', 'soft-hold', 'wishlist'] as const} onChange={(v) => setProj((p) => updatePackaging(p, i, { status: v as 'signed' | 'soft-hold' | 'wishlist' }))} />
                      <RemoveBtn onClick={() => setProj((p) => removePackaging(p, i))} />
                    </div>
                  ))}
                  <GhostButton onClick={() => setProj((p) => addPackaging(p))} tone="accent">+ Add attachment</GhostButton>
                </div>
              </Field>

              {/* Soft-funding applications */}
              <Field label="Soft-funding & grant applications">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(proj.softFunding ?? []).map((s) => (
                    <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input value={s.body} placeholder="Fund / body" onChange={(e) => setProj((p) => updateSoftFunding(p, s.id, { body: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                      <div style={{ width: 150 }}>
                        <ExactFigureInput value={s.amount} onCommit={(v) => setProj((p) => updateSoftFunding(p, s.id, { amount: v }))} gated={ndaSigned} label="amount" defaultCurrency={defaultCurrency} />
                      </div>
                      <Select value={s.status} options={Object.keys(SOFT_FUNDING_STATUS_LABELS) as SoftFundingStatus[]} labelFor={(k) => SOFT_FUNDING_STATUS_LABELS[k as SoftFundingStatus]}
                        onChange={(v) => setProj((p) => updateSoftFunding(p, s.id, { status: v as SoftFundingStatus }))} />
                      <RemoveBtn onClick={() => setProj((p) => removeSoftFunding(p, s.id))} />
                    </div>
                  ))}
                  <GhostButton onClick={() => setProj((p) => addSoftFunding(p))} tone="accent">+ Add application</GhostButton>
                </div>
              </Field>
            </>
          ) : null}

          {/* Supporting documents — NDA-gated, all optional, no readiness banner */}
          <Field label="Supporting documents">
            {ndaSigned ? (
              <AfxDocumentUpload
                caseStudyId={proj.id}
                docs={proj.docs ?? []}
                categories={LIVE_DOCUMENT_CATEGORIES}
                onAdd={(doc) => setProj((p) => addDocument(p, doc))}
                onUpdate={(id, patch) => setProj((p) => updateDocument(p, id, patch))}
                onRemove={(id) => setProj((p) => removeDocument(p, id))}
              />
            ) : (
              <div style={{ fontSize: 12.5, color: '#9A9CA3', border: '1px dashed #DAD7D0', borderRadius: 8, padding: '12px 14px' }}>
                Sign the FRA NDA to attach confidential documents (budget, financing agreements, talent deals, script, deck) that strengthen this project&rsquo;s viability.
              </div>
            )}
          </Field>
        </div>

        <footer style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 22px', borderTop: '1px solid #EAE8E3', background: '#fff' }}>
          {confirmingRemove ? (
            <>
              <span style={{ fontFamily: 'var(--afx-body)', fontSize: 13, color: '#5E6066', flex: 1 }}>Archive this project?</span>
              <button onClick={() => setConfirmingRemove(false)} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' }}>Cancel</button>
              <button onClick={onRemove} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #7A2E2E', background: '#7A2E2E', color: '#fff' }}>Archive</button>
            </>
          ) : (
            <>
              {onRemove ? (
                <button onClick={() => setConfirmingRemove(true)} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #E3B6AE', background: '#fff', color: '#7A2E2E' }}>Archive</button>
              ) : null}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 15px', borderRadius: 8, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' }}>Close</button>
                <button onClick={() => onSave(proj)} disabled={!savable}
                  style={{ cursor: savable ? 'pointer' : 'not-allowed', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 17px', borderRadius: 8, border: '1px solid #1C1D21', background: savable ? '#1C1D21' : '#C9C7C1', color: '#fff', opacity: savable ? 1 : 0.8 }}
                  title={savable ? '' : 'A title and current stage are required'}>
                  Save
                </button>
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
