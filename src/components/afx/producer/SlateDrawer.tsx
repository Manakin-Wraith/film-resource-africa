'use client';

import { useEffect, useState } from 'react';
import type { Slate, RiskTier, Project, EvidenceClaim } from '@/lib/afx/types';
import {
  isSlateSavable, toggleSlateProject, setSlateRiskTier,
  setSlateBand, setSlateSecuredBand,
  addSlateEvidence, updateSlateEvidence, removeSlateEvidence,
} from '@/lib/afx/slate';
import { FUNDING_SECURED_BANDS, EVIDENCE_CLAIM_LABELS } from '@/lib/afx/constants';
import { InlineEdit, GhostButton } from './cockpitUi';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';

const mono = 'var(--afx-mono)';

const SLATE_STAGE_OPTIONS = ['packaging', 'financing', 'ready'] as const;
const RISK_TIER_OPTIONS = ['low', 'mid', 'high-upside'] as const;
const RISK_TIER_LABEL: Record<RiskTier, string> = { low: 'Low risk', mid: 'Mid', 'high-upside': 'High-upside' };

interface SlateDrawerProps {
  initial: Slate;
  isNew: boolean;
  liveProjects: Project[];
  otherSlates: Slate[];
  onSave: (slate: Slate) => void;
  onClose: () => void;
  onRemove?: () => void;
}

export default function SlateDrawer({ initial, isNew, liveProjects, otherSlates, onSave, onClose, onRemove }: SlateDrawerProps) {
  const [slate, setSlate] = useState<Slate>(() => structuredClone(initial));
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const savable = isSlateSavable(slate);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 88, background: 'rgba(28,29,33,0.42)' }} />
      <aside role="dialog" aria-modal="true" aria-label={isNew ? 'Add portfolio' : 'Edit portfolio'}
        style={{ position: 'fixed', zIndex: 89, top: 0, right: 0, height: '100vh', width: 'min(560px,94vw)', background: '#FAF9F7', borderLeft: '1px solid #EAE8E3', boxShadow: '-24px 0 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }}>

        <header style={{ display: 'flex', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #EAE8E3', background: 'linear-gradient(180deg,#FCFBF9,#fff)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>{isNew ? 'Add portfolio' : 'Edit portfolio'}</h2>
          <button onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto', cursor: 'pointer', background: 'none', border: 'none', fontSize: 20, lineHeight: 1, color: '#9A9CA3' }}>×</button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <InlineEdit label="Name" value={slate.name} placeholder="e.g. 5 Mid-Budget African Thrillers" onChange={(v) => setSlate((s) => ({ ...s, name: v }))} />
          <InlineEdit label="Genre strategy" value={slate.genreStrategy} placeholder="e.g. Commercial thrillers" onChange={(v) => setSlate((s) => ({ ...s, genreStrategy: v }))} />

          <Field label="Stage">
            <Select value={slate.stage} options={SLATE_STAGE_OPTIONS} onChange={(v) => setSlate((s) => ({ ...s, stage: v as Slate['stage'] }))} />
          </Field>

          <Field label="Total budget band">
            <input value={slate.totalBudgetBand.value} placeholder="e.g. R50–100M" onChange={(e) => setSlate((s) => setSlateBand(s, 'totalBudgetBand', e.target.value))} style={inputStyle} />
            <div style={{ marginTop: 6 }}><ProvenanceBadge provenance={slate.totalBudgetBand.provenance} size="sm" /></div>
          </Field>

          <Field label="Secured">
            <Select value={slate.securedBand} options={FUNDING_SECURED_BANDS} placeholder="—" onChange={(v) => setSlate((s) => setSlateSecuredBand(s, v))} />
          </Field>

          <Field label="Investor ask band">
            <input value={slate.askBand.value} placeholder="e.g. R25–50M" onChange={(e) => setSlate((s) => setSlateBand(s, 'askBand', e.target.value))} style={inputStyle} />
            <div style={{ marginTop: 6 }}><ProvenanceBadge provenance={slate.askBand.provenance} size="sm" /></div>
          </Field>

          <Field label="Target IRR">
            <input value={slate.targetIRR.value} placeholder="e.g. 20–30%" onChange={(e) => setSlate((s) => setSlateBand(s, 'targetIRR', e.target.value))} style={inputStyle} />
            <div style={{ marginTop: 6 }}><ProvenanceBadge provenance={slate.targetIRR.provenance} size="sm" /></div>
          </Field>

          <Field label="Portfolio ROI">
            <input value={slate.portfolioROI.value} placeholder="e.g. 2–2.5x" onChange={(e) => setSlate((s) => setSlateBand(s, 'portfolioROI', e.target.value))} style={inputStyle} />
            <div style={{ marginTop: 6 }}><ProvenanceBadge provenance={slate.portfolioROI.provenance} size="sm" /></div>
          </Field>

          <InlineEdit label="Distribution strategy" value={slate.distributionStrategy} placeholder="e.g. Pre-aligned with streamer + sales agent" onChange={(v) => setSlate((s) => ({ ...s, distributionStrategy: v }))} />

          <Field label="Evidence & links">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(slate.evidence ?? []).map((e) => (
                <div key={e.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={e.url} placeholder="https://…" onChange={(ev) => setSlate((s) => updateSlateEvidence(s, e.id, { url: ev.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                  <Select value={e.supports} options={Object.keys(EVIDENCE_CLAIM_LABELS) as EvidenceClaim[]} labelFor={(k) => EVIDENCE_CLAIM_LABELS[k as EvidenceClaim]}
                    onChange={(v) => setSlate((s) => updateSlateEvidence(s, e.id, { supports: v as EvidenceClaim }))} />
                  <RemoveBtn onClick={() => setSlate((s) => removeSlateEvidence(s, e.id))} />
                </div>
              ))}
              <GhostButton onClick={() => setSlate((s) => addSlateEvidence(s))} tone="accent">+ Add link</GhostButton>
            </div>
          </Field>

          <Field label="Member projects">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {liveProjects.length === 0 ? (
                <span style={{ fontSize: 12.5, color: '#9A9CA3' }}>No live projects yet — add one in Live Slate first.</span>
              ) : liveProjects.map((p) => {
                const claimedBy = otherSlates.find((s) => s.projectIds.includes(p.id));
                const checked = slate.projectIds.includes(p.id);
                const disabled = !!claimedBy && !checked;
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={checked} disabled={disabled}
                      onChange={() => setSlate((s) => toggleSlateProject(s, p.id))} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: checked ? 600 : 400, color: disabled ? '#C9C7C1' : '#1C1D21' }}>{p.title || 'Untitled'}</span>
                    {claimedBy ? <span style={{ fontSize: 10.5, color: '#9A9CA3' }}>Already in {claimedBy.name || 'another slate'}</span> : null}
                    {checked ? (
                      <Select value={slate.riskTiers[p.id] ?? 'mid'} options={RISK_TIER_OPTIONS} labelFor={(t) => RISK_TIER_LABEL[t]}
                        onChange={(v) => setSlate((s) => setSlateRiskTier(s, p.id, v as RiskTier))} />
                    ) : null}
                  </div>
                );
              })}
            </div>
            {slate.projectIds.length < 2 ? (
              <div style={{ fontSize: 11, color: '#9A9CA3', marginTop: 8 }}>Select at least 2 projects to save this portfolio.</div>
            ) : null}
          </Field>
        </div>

        <footer style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 22px', borderTop: '1px solid #EAE8E3', background: '#fff' }}>
          {confirmingRemove ? (
            <>
              <span style={{ fontFamily: 'var(--afx-body)', fontSize: 13, color: '#5E6066', flex: 1 }}>Delete this portfolio?</span>
              <button onClick={() => setConfirmingRemove(false)} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' }}>Cancel</button>
              <button onClick={onRemove} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #7A2E2E', background: '#7A2E2E', color: '#fff' }}>Delete</button>
            </>
          ) : (
            <>
              {onRemove ? (
                <button onClick={() => setConfirmingRemove(true)} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8, border: '1px solid #E3B6AE', background: '#fff', color: '#7A2E2E' }}>Delete</button>
              ) : null}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 15px', borderRadius: 8, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' }}>Close</button>
                <button onClick={() => onSave(slate)} disabled={!savable}
                  style={{ cursor: savable ? 'pointer' : 'not-allowed', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 17px', borderRadius: 8, border: '1px solid #1C1D21', background: savable ? '#1C1D21' : '#C9C7C1', color: '#fff', opacity: savable ? 1 : 0.8 }}
                  title={savable ? '' : 'A name and at least 2 projects are required'}>
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
