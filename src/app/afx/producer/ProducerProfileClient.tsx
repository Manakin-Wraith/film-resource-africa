'use client';

import { useState } from 'react';
import type { ProducerProfile, Provenance, Project } from '@/lib/afx/types';
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

const mono = 'var(--afx-mono)';
const isDowngrade = (p: Provenance) => p === 'verified' || p === 'confirmed';

export default function ProducerProfileClient({ initial }: { initial: ProducerProfile }) {
  const [draft, setDraft] = useState<ProducerProfile>(() => structuredClone(initial));
  const [previewMode, setPreviewMode] = useState<'data' | 'funder'>('data');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [reverted, setReverted] = useState<Record<string, Provenance>>({});
  const [counter, setCounter] = useState(0);

  const flagRevert = (k: string, from: Provenance) => setReverted((r) => ({ ...r, [k]: from }));
  const slate = draft.slate ?? [];

  const onIdentity = (patch: Partial<Pick<ProducerProfile, 'name' | 'company' | 'bio' | 'location'>>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const onOutcomeField = (projectId: string, field: 'recoupment' | 'bondUsed' | 'budget', value: string) => {
    setDraft((d) => ({
      ...d,
      slate: (d.slate ?? []).map((p): Project => {
        if (p.id !== projectId) return p;
        if (field === 'budget') {
          if (isDowngrade(p.budgetBand.provenance)) flagRevert(`${projectId}:budget`, p.budgetBand.provenance);
          return { ...p, budgetBand: { value, provenance: 'self' } };
        }
        if (!p.outcomes) return p;
        if (isDowngrade(p.outcomes[field].provenance)) flagRevert(`${projectId}:${field}`, p.outcomes[field].provenance);
        return { ...p, outcomes: { ...p.outcomes, [field]: { value, provenance: 'self' } } };
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
          id: `np${n}`, status: 'live', title: `New project ${n}`, format: 'feature', role: 'Producer', jurisdiction: ['ZA'],
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
          <FunderPreview draft={draft} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <IdentityPanel draft={draft} onIdentity={onIdentity} />
            {/* Two-zone hard requirement: Track Record BEFORE Live Slate (spec §2.1) */}
            <TrackRecordZone draft={draft} onOutcomeField={onOutcomeField} reverted={reverted} />
            <LiveSlateZone draft={draft} onAddProject={onAddProject} onArchive={onArchive} />
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
