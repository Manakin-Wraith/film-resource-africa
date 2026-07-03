'use client';

import { useState } from 'react';
import type { FunderMarketRow, FunderMarketProjectRow } from '@/lib/afx/funderMarketplace';
import { RATING_BAND_LABEL, VISIBILITY_META } from '@/lib/afx/constants';

const mono = 'var(--afx-mono)';

const STATUS_LABEL: Record<FunderMarketProjectRow['packaging'][number]['status'], string> = {
  signed: 'Signed', 'soft-hold': 'Soft-hold', wishlist: 'Wishlist',
};

function VisibilityChip({ visibility }: { visibility: FunderMarketRow['visibility'] }) {
  const m = VISIBILITY_META[visibility];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 10, fontWeight: 700, color: m.tone }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.tone }} />
      {m.label}
    </span>
  );
}

function ProjectRowView({ p }: { p: FunderMarketProjectRow }) {
  const meta = [p.stage, p.format, p.budgetBand, p.fundingSecuredBand, p.commercialPath].filter(Boolean).join(' · ');
  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid var(--afx-border)' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--afx-ink)' }}>{p.title || 'Untitled'}</div>
      <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-faint)', marginTop: 3 }}>{meta || '—'}</div>
      {p.packaging.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
          {p.packaging.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ width: 70, flex: 'none', color: 'var(--afx-faint)' }}>{a.role}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{a.name || '—'}</span>
              <span style={{ fontSize: 10.5, color: 'var(--afx-muted)' }}>{STATUS_LABEL[a.status]}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function FunderMarket({ rows }: { rows: FunderMarketRow[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--afx-ink)', margin: 0 }}>Marketplace</h1>
        <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faint)', marginTop: 4 }}>Live to funders — bands only, ranked by screening signal.</div>
      </div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--afx-faint)', padding: '20px 0' }}>No producers are live to funders yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => {
            const isOpen = !!open[r.producerId];
            return (
              <div key={r.producerId} style={{ border: '1px solid var(--afx-border)', borderRadius: 12, background: '#fff', padding: '13px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--afx-ink)' }}>
                      {r.producerName}{r.company ? <span style={{ color: 'var(--afx-faint)', fontWeight: 400 }}> · {r.company}</span> : null}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: 'var(--afx-ink)', background: '#F6F5F2', border: '1px solid var(--afx-border)', borderRadius: 6, padding: '2px 7px' }}>{r.ratingBand} · {RATING_BAND_LABEL[r.ratingBand]}</span>
                      <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-faint)' }}>{r.careerStage}</span>
                      <VisibilityChip visibility={r.visibility} />
                    </div>
                  </div>
                  <button onClick={() => setOpen((o) => ({ ...o, [r.producerId]: !o[r.producerId] }))}
                    style={{ cursor: 'pointer', background: 'none', border: '1px solid var(--afx-border)', borderRadius: 7, padding: '5px 10px', fontFamily: mono, fontSize: 10, fontWeight: 600, color: 'var(--afx-muted)' }}>
                    {isOpen ? '▾' : '▸'} {r.screenableCount} project{r.screenableCount === 1 ? '' : 's'}
                  </button>
                </div>
                {isOpen ? (
                  <div style={{ marginTop: 8 }}>
                    {r.projects.map((p) => <ProjectRowView key={p.id} p={p} />)}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
