'use client';

import { useState } from 'react';
import { useDebouncedAutosave } from './useDebouncedAutosave';
import { persistProfileAction } from './actions';
import type { ProducerProfile, Project, ExactFigures, ExactMoney, AfxCurrency } from '@/lib/afx/types';
import { liveProjects } from '@/lib/afx/aggregates';
import { meetsCorePackaging } from '@/lib/afx/constants';
import AfxTopBar from '@/components/afx/AfxTopBar';
import StatusHeader from '@/components/afx/producer/StatusHeader';
import IdentityPanel from '@/components/afx/producer/IdentityPanel';
import TrackRecordZone from '@/components/afx/producer/TrackRecordZone';
import LiveSlateZone from '@/components/afx/producer/LiveSlateZone';
import AggregatesPanel from '@/components/afx/producer/AggregatesPanel';
import NdaUpgrade from '@/components/afx/producer/NdaUpgrade';
import AccountVisibility from '@/components/afx/producer/AccountVisibility';
import FunderPreview from '@/components/afx/producer/FunderPreview';
import { toFunderView } from '@/lib/afx/funderView';
import CaseStudyDrawer from '@/components/afx/producer/CaseStudyDrawer';
import { newCaseStudy } from '@/lib/afx/caseStudy';

const mono = 'var(--afx-mono)';
type ExactKey = 'budget' | 'fundingSecured' | 'equity' | 'soft' | 'debt' | 'gap';

export default function ProducerProfileClient({ initial }: { initial: ProducerProfile }) {
  const [draft, setDraft] = useState<ProducerProfile>(() => structuredClone(initial));
  const saveStatus = useDebouncedAutosave(draft, persistProfileAction);
  const [previewMode, setPreviewMode] = useState<'data' | 'funder'>('data');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [counter, setCounter] = useState(0);
  const [editing, setEditing] = useState<{ study: Project; isNew: boolean } | null>(null);

  const slate = draft.slate ?? [];

  const onIdentity = (patch: Partial<Pick<ProducerProfile, 'name' | 'company' | 'bio' | 'location'>>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const onAddCaseStudy = () => setEditing({ study: newCaseStudy(), isNew: true });
  const onEditCaseStudy = (id: string) => {
    const found = (draft.slate ?? []).find((p) => p.id === id);
    if (found) setEditing({ study: structuredClone(found), isNew: false });
  };
  const onSaveCaseStudy = (study: Project) => {
    setDraft((d) => {
      const list = d.slate ?? [];
      const exists = list.some((p) => p.id === study.id);
      return { ...d, slate: exists ? list.map((p) => (p.id === study.id ? study : p)) : [...list, study] };
    });
    setEditing(null);
  };
  const onRemoveCaseStudy = (id: string) => {
    setDraft((d) => ({ ...d, slate: (d.slate ?? []).filter((p) => p.id !== id) }));
    setEditing(null);
  };

  const localCurrency: AfxCurrency = (draft.location ?? '').trim().endsWith('ZA') ? 'ZAR' : 'USD';

  const onExact = (projectId: string, field: ExactKey, value: ExactMoney | undefined) => {
    setDraft((d) => ({
      ...d,
      slate: (d.slate ?? []).map((p): Project => {
        if (p.id !== projectId) return p;
        const exact: ExactFigures = { ...p.exact };

        if (field === 'budget' || field === 'fundingSecured') {
          if (value === undefined) delete exact[field];
          else exact[field] = value;
        } else {
          // capital-stack leg
          const cs = { ...exact.capitalStack };
          if (value === undefined) delete cs[field];
          else cs[field] = value;
          exact.capitalStack = Object.keys(cs).length ? cs : undefined;
        }

        // Budget exact raises/lowers the band provenance (Global Constraints).
        let budgetBand = p.budgetBand;
        if (field === 'budget') {
          if (value !== undefined && p.budgetBand.provenance === 'self') budgetBand = { ...p.budgetBand, provenance: 'confirmed' };
          if (value === undefined && p.budgetBand.provenance === 'confirmed') budgetBand = { ...p.budgetBand, provenance: 'self' };
        }

        const cleaned: ExactFigures = {};
        if (exact.budget !== undefined) cleaned.budget = exact.budget;
        if (exact.fundingSecured !== undefined) cleaned.fundingSecured = exact.fundingSecured;
        if (exact.capitalStack) cleaned.capitalStack = exact.capitalStack;

        return { ...p, budgetBand, exact: Object.keys(cleaned).length ? cleaned : undefined };
      }),
    }));
  };

  const onAddProject = () => {
    const n = counter + 1;
    setCounter(n);
    setDraft((d) => ({
      ...d,
      slate: [
        ...(d.slate ?? []),
        {
          id: crypto.randomUUID(), status: 'live', title: `New project ${n}`, format: 'feature', role: 'Producer', jurisdiction: ['ZA'],
          budgetBand: { value: '$0.5–2M', provenance: 'self' },
          ask: { logline: '', stage: 'development', commercialPath: 'Festival-driven', fundingSecuredBand: '<40% secured', capitalStack: { equityPct: 20, softPct: 0, debtPct: 0, gapPct: 80 }, packaging: [{ role: 'Director', name: '—', status: 'wishlist' }, { role: 'Writer', name: '—', status: 'wishlist' }] },
        },
      ],
    }));
  };

  const archiveNow = (id: string) =>
    setDraft((d) => ({ ...d, slate: (d.slate ?? []).map((p) => (p.id === id ? { ...p, status: 'archived' as const } : p)) }));

  const onArchive = (id: string) => {
    const screenable = liveProjects(draft).filter(meetsCorePackaging);
    const target = slate.find((p) => p.id === id);
    if (target && meetsCorePackaging(target) && screenable.length <= 1) setPendingDelete(id);
    else archiveNow(id);
  };

  const toggleNda = () => setDraft((d) => ({ ...d, ndaSigned: !d.ndaSigned }));

  return (
    <div style={{ paddingBottom: 80 }}>
      <AfxTopBar
        subtitle="Producer cockpit"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ textAlign: 'right', lineHeight: 1.1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{draft.name}</div>
              <div style={{ fontFamily: mono, fontSize: 9.5, color: '#9A9CA3' }}>{draft.company}</div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EAE8E3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12.5, color: '#5E6066' }}>
              {draft.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </div>
          </div>
        }
      />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px 0' }}>
        <StatusHeader draft={draft} previewMode={previewMode} onSetPreview={setPreviewMode} />

        {previewMode === 'funder' ? (
          <FunderPreview view={toFunderView(draft)} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <IdentityPanel draft={draft} onIdentity={onIdentity} />
            {/* Two-zone hard requirement: Track Record BEFORE Live Slate (spec §2.1) */}
            <TrackRecordZone draft={draft} onAdd={onAddCaseStudy} onEdit={onEditCaseStudy} />
            <LiveSlateZone draft={draft} onAddProject={onAddProject} onArchive={onArchive} onExact={onExact} ndaSigned={!!draft.ndaSigned} defaultCurrency={localCurrency} />
            <AggregatesPanel draft={draft} />
            <NdaUpgrade signed={!!draft.ndaSigned} onToggle={toggleNda} />
            <AccountVisibility draft={draft} onToggleK2={() => setDraft((d) => ({ ...d, entityK2: !d.entityK2 }))} onToggleK4={() => setDraft((d) => ({ ...d, consentK4: !d.consentK4 }))} />
          </div>
        )}
      </main>

      {pendingDelete ? (
        <ConfirmArchive
          title={slate.find((p) => p.id === pendingDelete)?.title ?? 'this project'}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => { archiveNow(pendingDelete); setPendingDelete(null); }}
        />
      ) : null}

      {editing ? (
        <CaseStudyDrawer
          initial={editing.study}
          isNew={editing.isNew}
          ndaSigned={!!draft.ndaSigned}
          defaultCurrency={localCurrency}
          onSave={onSaveCaseStudy}
          onClose={() => setEditing(null)}
          onRemove={editing.isNew ? undefined : () => onRemoveCaseStudy(editing.study.id)}
        />
      ) : null}

      {saveStatus !== 'idle' && (
        <div role="status" aria-live="polite" style={{
          position: 'fixed', right: 16, bottom: 16, zIndex: 90,
          fontFamily: 'var(--afx-mono)', fontSize: 11, letterSpacing: '0.04em',
          padding: '7px 12px', borderRadius: 8,
          border: '1px solid ' + (saveStatus === 'error' ? '#c0392b' : 'var(--afx-border, #EAE8E3)'),
          background: saveStatus === 'error' ? '#fdecea' : '#fff',
          color: saveStatus === 'error' ? '#c0392b' : '#5E6066',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        }}>
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : "Couldn’t save — your last edit will retry on the next change"}
        </div>
      )}
    </div>
  );
}

function ConfirmArchive({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(28,29,33,0.42)' }} />
      <div role="dialog" aria-modal="true" style={{ position: 'fixed', zIndex: 71, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(440px,92vw)', background: '#FAF9F7', border: '1px solid #EAE8E3', borderRadius: 14, boxShadow: '0 24px 60px rgba(0,0,0,0.28)', padding: '22px 24px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>Archive your last screenable project?</h3>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: '#5E6066', lineHeight: 1.5 }}>
          Archiving <strong>{title}</strong> leaves you with no screenable live project, so your profile becomes
          <strong> hidden from funders</strong> and leaves the Deal Display. Your track record and rating are unaffected.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onCancel} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 15px', borderRadius: 8, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' }}>Keep it</button>
          <button onClick={onConfirm} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 15px', borderRadius: 8, border: '1px solid #7A2E2E', background: '#7A2E2E', color: '#fff' }}>Archive & go hidden</button>
        </div>
      </div>
    </>
  );
}
