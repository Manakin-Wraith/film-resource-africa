'use client';

import { useMemo, useState } from 'react';
import type { DealEntity, EntityKind, SignalStyle } from '@/lib/afx/types';
import { afxSeed } from '@/lib/afx/seed';
import { RATING_RANK } from '@/lib/afx/format';
import { ENTITY_TABS, SIGNAL_TABS, SORT_COLUMNS, FILTER_GROUPS } from '@/lib/afx/constants';
import { ACCENT } from '@/components/afx/primitives/bands';
import AfxTopBar from '@/components/afx/AfxTopBar';
import DealTableRow from '@/components/afx/marketplace/DealTableRow';
import DrillDownOverlay from '@/components/afx/marketplace/DrillDownOverlay';
import CompareOverlay from '@/components/afx/marketplace/CompareOverlay';
import { ROW_GRID } from '@/components/afx/marketplace/grid';

const mono = 'var(--afx-mono)';

type Filters = { band: string; conf: string; juris: string };
type Sort = { key: string; dir: 'asc' | 'desc' };

const sortVal = (d: DealEntity, key: string): number | string => {
  switch (key) {
    case 'score': return d.score;
    case 'budget': return d.budgetUSD;
    case 'funding': return d.fundingPct;
    case 'rebate': return d.rebatePct == null ? -1 : d.rebatePct;
    case 'rating': return RATING_RANK[d.ratingBand];
    case 'stage': return d.stage;
    case 'name': return d.name;
    default: return d.score;
  }
};

export default function DealDisplayClient() {
  const [entity, setEntity] = useState<EntityKind>('producers');
  const [signalStyle, setSignalStyle] = useState<SignalStyle>('ring');
  const [filters, setFilters] = useState<Filters>({ band: 'All', conf: 'All', juris: 'All' });
  const [sort, setSort] = useState<Sort>({ key: 'score', dir: 'desc' });
  const [selected, setSelected] = useState<string[]>([]);
  const [drillId, setDrillId] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const current = afxSeed[entity];

  const rows = useMemo(() => {
    const filtered = current.filter((d) => {
      if (filters.band !== 'All' && d.ratingBand !== filters.band) return false;
      if (filters.conf !== 'All') {
        if (filters.conf === 'Missing') { if (d.rebatePct != null) return false; }
        else if (d.rebateConf !== filters.conf) return false;
      }
      if (filters.juris !== 'All' && !d.juris.includes(filters.juris)) return false;
      return true;
    });
    const m = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = sortVal(a, sort.key);
      const vb = sortVal(b, sort.key);
      if (typeof va === 'string' || typeof vb === 'string') return String(va).localeCompare(String(vb)) * m;
      return (va - vb) * m;
    });
  }, [current, filters, sort]);

  const counts = { producers: afxSeed.producers.length, slates: afxSeed.slates.length, projects: afxSeed.projects.length };
  const hasActiveFilters = filters.band !== 'All' || filters.conf !== 'All' || filters.juris !== 'All';
  const compareEnabled = selected.length >= 2;

  const setFilter = (key: keyof Filters, v: string) => setFilters((f) => ({ ...f, [key]: v }));
  const setSortKey = (key: string) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));
  const switchEntity = (e: EntityKind) => { setEntity(e); setSelected([]); setDrillId(null); setFilters({ band: 'All', conf: 'All', juris: 'All' }); };
  const toggleSelect = (id: string) =>
    setSelected((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : sel.length >= 4 ? sel : [...sel, id]));

  const entityWord = entity;
  const drillEntity = drillId ? current.find((d) => d.id === drillId) ?? null : null;
  const compareItems = compareOpen ? selected.map((id) => current.find((d) => d.id === id)).filter((d): d is DealEntity => !!d) : [];

  return (
    <div>
      <AfxTopBar
        subtitle="Deal screening"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A9CA3' }}>Signal view</span>
            <div style={{ display: 'flex', background: '#F1EFEA', border: '1px solid #EAE8E3', borderRadius: 9, padding: 3, gap: 2 }}>
              {SIGNAL_TABS.map((t) => {
                const active = signalStyle === t.key;
                return (
                  <button key={t.key} onClick={() => setSignalStyle(t.key)} style={{ border: 'none', cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 7, background: active ? '#fff' : 'transparent', color: active ? '#1C1D21' : '#7C7E84', boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.12s' }}>{t.label}</button>
                );
              })}
            </div>
          </div>
        }
      />

      <main style={{ maxWidth: 1380, margin: '0 auto', padding: '30px 28px 80px' }}>
        {/* title + entity toggle */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-0.8px' }}>Deal Screening</h1>
            <p style={{ margin: '7px 0 0', fontSize: 13.5, color: '#5E6066', maxWidth: 560 }}>
              {rows.length} {entityWord} · ranked by Deal Signal. Click any row to drill in; select 2–4 to compare.
            </p>
          </div>
          <div style={{ display: 'flex', background: '#fff', border: '1px solid #EAE8E3', borderRadius: 11, padding: 4, gap: 3, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            {ENTITY_TABS.map((t) => {
              const active = entity === t.key;
              return (
                <button key={t.key} onClick={() => switchEntity(t.key)} style={{ display: 'flex', alignItems: 'center', gap: 7, border: 'none', cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 13.5, fontWeight: 600, padding: '8px 14px', borderRadius: 8, background: active ? '#1C1D21' : 'transparent', color: active ? '#fff' : '#5E6066', transition: 'all 0.12s' }}>
                  <span>{t.label}</span>
                  <span style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 5, background: active ? 'rgba(255,255,255,0.18)' : '#ECEAE4', color: active ? '#fff' : '#9A9CA3' }}>{counts[t.key]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* toolbar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
          {FILTER_GROUPS.map((g) => (
            <div key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A7A99F', paddingLeft: 2 }}>{g.label}</span>
              <div style={{ display: 'flex', gap: 5 }}>
                {g.options.map((o) => {
                  const active = filters[g.key] === o.v;
                  return (
                    <button key={o.v} onClick={() => setFilter(g.key, o.v)} style={{ border: `1px solid ${active ? '#1C1D21' : '#E4E2DC'}`, cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 12, fontWeight: active ? 600 : 500, padding: '6px 11px', borderRadius: 8, background: active ? '#1C1D21' : '#fff', color: active ? '#fff' : '#5E6066', transition: 'all 0.12s' }}>{o.l}</button>
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          {hasActiveFilters ? (
            <button onClick={() => setFilters({ band: 'All', conf: 'All', juris: 'All' })} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: ACCENT, fontFamily: 'var(--afx-body)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: '8px 4px' }}>Clear filters</button>
          ) : null}
          <button
            onClick={() => { if (compareEnabled) setCompareOpen(true); }}
            disabled={!compareEnabled}
            style={{ alignSelf: 'flex-end', cursor: compareEnabled ? 'pointer' : 'not-allowed', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 9, border: `1px solid ${compareEnabled ? '#1C1D21' : '#E4E2DC'}`, background: compareEnabled ? '#1C1D21' : '#F4F2ED', color: compareEnabled ? '#fff' : '#B8BAB0', transition: 'all 0.12s' }}
          >
            {selected.length > 0 ? `Compare selected (${selected.length})` : 'Compare selected'}
          </button>
        </div>

        {/* table */}
        <div className="afx-scroll" style={{ background: '#fff', border: '1px solid #EAE8E3', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflowX: 'auto' }}>
          <div style={{ minWidth: 1240 }}>
            {/* column header */}
            <div style={{ display: 'grid', gridTemplateColumns: ROW_GRID, alignItems: 'center', padding: '0 22px', height: 46, borderBottom: '1px solid #EAE8E3', background: '#FCFBF9' }}>
              <div />
              {SORT_COLUMNS.map((c) => {
                const active = sort.key === c.key;
                return (
                  <button key={c.key} onClick={() => setSortKey(c.key)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: mono, fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: active ? '#1C1D21' : '#A7A99F', fontWeight: active ? 600 : 500 }}>
                    <span>{c.label}</span>
                    <span style={{ fontFamily: mono, fontSize: 9, color: ACCENT }}>{active ? (sort.dir === 'desc' ? '↓' : '↑') : ''}</span>
                  </button>
                );
              })}
            </div>

            {rows.length === 0 ? (
              <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#5E6066' }}>No deals match these filters</div>
                <div style={{ fontSize: 13, color: '#9A9CA3', marginTop: 6 }}>Loosen a filter to widen the field.</div>
                <button onClick={() => setFilters({ band: 'All', conf: 'All', juris: 'All' })} style={{ marginTop: 16, background: '#1C1D21', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontFamily: 'var(--afx-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Clear all filters</button>
              </div>
            ) : (
              rows.map((d) => (
                <DealTableRow key={d.id} d={d} entity={entity} signalStyle={signalStyle} selected={selected.includes(d.id)} onToggleSelect={() => toggleSelect(d.id)} onOpen={() => setDrillId(d.id)} />
              ))
            )}
          </div>
        </div>

        {/* legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', marginTop: 16, padding: '0 4px' }}>
          <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A7A99F' }}>Confidence</span>
          <LegendDot swatch={<span style={{ width: 9, height: 9, borderRadius: 2, background: '#1C1D21', display: 'inline-block' }} />} label="Confirmed" />
          <LegendDot swatch={<span style={{ width: 9, height: 9, borderRadius: 2, background: 'linear-gradient(135deg,#1C1D21 0 50%,#fff 50% 100%)', border: '1px solid #C9C6BE', display: 'inline-block' }} />} label="Likely" />
          <LegendDot swatch={<span style={{ width: 9, height: 9, borderRadius: 2, background: '#fff', border: '1px dashed #B0ADA5', display: 'inline-block' }} />} label="Aspirational" />
          <span style={{ width: 1, height: 14, background: '#EAE8E3' }} />
          <LegendDot swatch={<span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1C1D21', display: 'inline-block' }} />} label="Current (<21d)" />
          <LegendDot swatch={<span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', border: '1px solid #B0ADA5', display: 'inline-block' }} />} label="Stale — re-verify" />
        </div>
      </main>

      {drillEntity ? <DrillDownOverlay d={drillEntity} entity={entity} onClose={() => setDrillId(null)} /> : null}
      {compareOpen && compareItems.length >= 2 ? <CompareOverlay items={compareItems} entity={entity} onClose={() => setCompareOpen(false)} /> : null}
    </div>
  );
}

function LegendDot({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {swatch}
      <span style={{ fontSize: 11.5, color: '#5E6066' }}>{label}</span>
    </div>
  );
}
