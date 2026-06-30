'use client';

import { useState } from 'react';
import type { ProducerProfile, Provenance, FilmographyRow, ProducerBands } from '@/lib/afx/types';
import AfxTopBar from '@/components/afx/AfxTopBar';
import StatusHeader from '@/components/afx/producer/StatusHeader';
import OperatorProfile from '@/components/afx/producer/OperatorProfile';
import SlateProjects from '@/components/afx/producer/SlateProjects';
import BandsPanel from '@/components/afx/producer/BandsPanel';
import AccountVisibility from '@/components/afx/producer/AccountVisibility';
import FunderPreview from '@/components/afx/producer/FunderPreview';

const mono = 'var(--afx-mono)';

/** An edit always reverts a field's provenance to self-reported. Returns
 *  whether the change was a downgrade (verified/confirmed → self). */
function isDowngrade(prev: Provenance): boolean {
  return prev === 'verified' || prev === 'confirmed';
}

export default function ProducerProfileClient({ initial }: { initial: ProducerProfile }) {
  const [draft, setDraft] = useState<ProducerProfile>(() => structuredClone(initial));
  const [previewMode, setPreviewMode] = useState<'data' | 'funder'>('data');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [reverted, setReverted] = useState<Record<string, boolean>>({});
  const [projCounter, setProjCounter] = useState(0);

  const flagRevert = (key: string) => setReverted((r) => ({ ...r, [key]: true }));

  const onIdentity = (patch: Partial<Pick<ProducerProfile, 'name' | 'company' | 'bio'>>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const onFilmographyField = (rowId: string, field: 'budgetBand' | 'recoupmentBand', value: string) => {
    setDraft((d) => ({
      ...d,
      filmography: d.filmography.map((f): FilmographyRow => {
        if (f.id !== rowId) return f;
        if (isDowngrade(f[field].provenance)) flagRevert(`${rowId}:${field}`);
        return { ...f, [field]: { value, provenance: 'self' } };
      }),
    }));
  };

  const onBand = (key: keyof ProducerBands, value: string) => {
    setDraft((d) => {
      if (isDowngrade(d.bands[key].provenance)) flagRevert(`band:${key}`);
      return { ...d, bands: { ...d.bands, [key]: { value, provenance: 'self' } } };
    });
  };

  const onAddProject = () => {
    const n = projCounter + 1;
    setProjCounter(n);
    setDraft((d) => ({
      ...d,
      projects: [
        ...d.projects,
        { id: `np${n}`, title: `New project ${n}`, format: 'Feature', stage: 'Development', securedPctBand: '<40% secured', prsBand: 'C', riskFlag: undefined, provenance: 'self' },
      ],
    }));
  };

  const archiveNow = (id: string) =>
    setDraft((d) => ({ ...d, projects: d.projects.map((p) => (p.id === id ? { ...p, archived: true } : p)) }));

  const onArchive = (id: string) => {
    const active = draft.projects.filter((p) => !p.archived);
    if (active.length <= 1) {
      setPendingDelete(id); // last active project — confirm first
    } else {
      archiveNow(id);
    }
  };

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
            <OperatorProfile draft={draft} onIdentity={onIdentity} onFilmographyField={onFilmographyField} reverted={reverted} />
            <SlateProjects draft={draft} onAddProject={onAddProject} onArchive={onArchive} />
            <BandsPanel draft={draft} onBand={onBand} reverted={reverted} />
            <AccountVisibility draft={draft} onToggleK2={() => setDraft((d) => ({ ...d, entityK2: !d.entityK2 }))} onToggleK4={() => setDraft((d) => ({ ...d, consentK4: !d.consentK4 }))} />
          </div>
        )}
      </main>

      {pendingDelete ? (
        <ConfirmArchive
          title={draft.projects.find((p) => p.id === pendingDelete)?.title ?? 'this project'}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            archiveNow(pendingDelete);
            setPendingDelete(null);
          }}
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
        <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>Archive your last active project?</h3>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: '#5E6066', lineHeight: 1.5 }}>
          Archiving <strong>{title}</strong> drops your slate to zero active projects, so your profile will
          become <strong>hidden from funders</strong> and leave the Deal Display. You can un-archive at any time.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onCancel} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 15px', borderRadius: 8, border: '1px solid #E4E2DC', background: '#fff', color: '#5E6066' }}>Keep it</button>
          <button onClick={onConfirm} style={{ cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 15px', borderRadius: 8, border: '1px solid #7A2E2E', background: '#7A2E2E', color: '#fff' }}>Archive & go hidden</button>
        </div>
      </div>
    </>
  );
}
