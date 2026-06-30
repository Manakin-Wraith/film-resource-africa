'use client';

import { useEffect } from 'react';
import type { DealEntity, EntityKind } from '@/lib/afx/types';
import { fmtUSD, bandLabel, RATING_RANK } from '@/lib/afx/format';
import { ACCENT, chipStyle } from '@/components/afx/primitives/bands';

const mono = 'var(--afx-mono)';

interface RowDef {
  label: string;
  get: (d: DealEntity) => { value: string; sub: string; n: number; hi: boolean };
}

export default function CompareOverlay({ items, entity, onClose }: { items: DealEntity[]; entity: EntityKind; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rowDefs: RowDef[] = [
    { label: 'Deal signal', get: (d) => ({ value: `${d.band} ${bandLabel(entity, d.band)}`, sub: `score ${d.score}`, n: d.score, hi: true }) },
    { label: 'Rating', get: (d) => ({ value: `${d.ratingBand} · ${d.careerStage.split(' ')[0]}`, sub: d.careerStage, n: RATING_RANK[d.ratingBand], hi: true }) },
    { label: 'Budget', get: (d) => ({ value: fmtUSD(d.budgetUSD), sub: d.budgetLocal, n: d.budgetUSD, hi: false }) },
    { label: 'Funding secured', get: (d) => ({ value: `${d.fundingPct}%`, sub: `gap ${fmtUSD(d.gapUSD)}`, n: d.fundingPct, hi: true }) },
    { label: 'Blended rebate', get: (d) => ({ value: d.rebatePct == null ? '— n/a' : `${d.rebatePct}%`, sub: d.rebatePct == null ? 'not provided' : (d.rebateConf ?? ''), n: d.rebatePct == null ? -1 : d.rebatePct, hi: true }) },
    { label: 'Unfunded gap', get: (d) => ({ value: fmtUSD(d.gapUSD), sub: 'the ask', n: -d.gapUSD, hi: true }) },
  ];

  const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: `130px repeat(${items.length},1fr)`, gap: 10, alignItems: 'stretch' };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(28,29,33,0.5)' }} />
      <div className="afx-scroll" style={{ position: 'fixed', inset: 24, zIndex: 61, background: '#FAF9F7', borderRadius: 16, boxShadow: '0 24px 70px rgba(0,0,0,0.3)', overflow: 'auto' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 5, background: '#FAF9F7', borderBottom: '1px solid #EAE8E3', padding: '18px 26px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.4px' }}>Compare</h2>
          <span style={{ fontFamily: mono, fontSize: 11, color: '#9A9CA3' }}>{items.length} of 4 selected · best value per row marked</span>
          <button onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto', width: 34, height: 34, borderRadius: 9, border: '1px solid #EAE8E3', background: '#fff', cursor: 'pointer', fontSize: 16, color: '#5E6066' }}>✕</button>
        </div>

        <div style={{ padding: '22px 26px 40px' }}>
          <div style={gridStyle}>
            <div />
            {items.map((d) => (
              <div key={d.id} style={{ background: '#fff', border: '1px solid #EAE8E3', borderRadius: 11, padding: 15, textAlign: 'center' }}>
                <div style={{ ...chipStyle(d.band), margin: '0 auto' }}>{d.band}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 9, letterSpacing: '-0.3px' }}>{d.name}</div>
                <div style={{ fontFamily: mono, fontSize: 10.5, color: '#9A9CA3', marginTop: 3 }}>{d.juris.join(' · ')}</div>
              </div>
            ))}

            {rowDefs.map((rd) => {
              const cells = items.map((d) => rd.get(d));
              let bestN = -Infinity;
              cells.forEach((c) => { if (c.hi && c.n > bestN) bestN = c.n; });
              return (
                <Row key={rd.label} label={rd.label} cells={cells} bestN={bestN} count={items.length} />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, cells, bestN, count }: { label: string; cells: { value: string; sub: string; n: number; hi: boolean }[]; bestN: number; count: number }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', fontFamily: mono, fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A7A99F', paddingRight: 10 }}>{label}</div>
      {cells.map((c, i) => {
        const best = c.hi && c.n === bestN && count > 1;
        return (
          <div key={i} style={{ background: '#fff', border: best ? `1.5px solid ${ACCENT}` : '1px solid #EAE8E3', borderRadius: 10, padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{c.value}</span>
            <span style={{ fontSize: 11, color: '#9A9CA3' }}>{c.sub}</span>
            {best ? <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: ACCENT, display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>▲ best</span> : null}
          </div>
        );
      })}
    </>
  );
}
