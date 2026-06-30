'use client';

import { useEffect, useState } from 'react';
import type { DealEntity, EntityKind, LiveStatus, AttachmentProv } from '@/lib/afx/types';
import { fmtUSD, bandLabel, confMarkerStyle } from '@/lib/afx/format';
import { ACCENT } from '@/components/afx/primitives/bands';
import CapitalStackBar from '@/components/afx/primitives/CapitalStackBar';

const mono = 'var(--afx-mono)';

function statusStyle(live: LiveStatus): React.CSSProperties {
  if (live === 'Active') return { fontFamily: mono, fontSize: 11, fontWeight: 600, color: '#1C1D21' };
  if (live === 'Provisional' || live === 'Under review') return { fontFamily: mono, fontSize: 11, fontWeight: 600, color: '#8A6D00', background: '#FBF3D9', border: '1px solid #EAD9A0', padding: '2px 7px', borderRadius: 5, justifySelf: 'start' };
  return { fontFamily: mono, fontSize: 11, fontWeight: 600, color: '#7A2E2E', background: '#F6E4E1', border: '1px solid #E3B6AE', padding: '2px 7px', borderRadius: 5, justifySelf: 'start' };
}

const PROV_TO_CONF: Record<AttachmentProv, 'Confirmed' | 'Likely' | 'Aspirational'> = {
  signed: 'Confirmed', 'soft-hold': 'Likely', wishlist: 'Aspirational',
};
const PROV_LABEL: Record<AttachmentProv, string> = { signed: 'Signed', 'soft-hold': 'Soft-hold', wishlist: 'Wishlist' };

export default function DrillDownOverlay({ d, entity, onClose }: { d: DealEntity; entity: EntityKind; onClose: () => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setExpanded((e) => ({ ...e, [k]: !e[k] }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const inc = d.detail.incentive;
  const gap = d.detail.stack.find((s) => s.label === 'Gap');
  const headerMetrics = [
    { label: 'Deal signal', value: `${d.band} · ${bandLabel(entity, d.band)}`, sub: `score ${d.score} (med ${d.benchmark})` },
    { label: 'Total budget', value: fmtUSD(d.budgetUSD), sub: d.budgetLocal, mono: true },
    { label: 'Funding secured', value: `${d.fundingPct}%`, sub: `gap ${fmtUSD(d.gapUSD)}`, mono: true },
    { label: 'Stage', value: d.stage, sub: d.juris.join(' · ') },
    { label: 'As of', value: d.asOf, sub: d.stale ? 'stale — re-verify' : 'current', mono: true, stale: d.stale },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(28,29,33,0.42)' }} />
      <div className="afx-scroll" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 51, width: 'min(900px,94vw)', background: '#FAF9F7', boxShadow: '-12px 0 40px rgba(0,0,0,0.16)', overflowY: 'auto' }}>
        {/* header strip */}
        <div style={{ position: 'sticky', top: 0, zIndex: 5, background: '#FAF9F7', borderBottom: '1px solid #EAE8E3', padding: '20px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.6px' }}>{d.name}</h2>
                <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#5E6066', background: '#F1EFEA', border: '1px solid #EAE8E3', padding: '3px 7px', borderRadius: 6 }}>{d.formatLabel}</span>
              </div>
              <div style={{ fontFamily: mono, fontSize: 12, color: '#9A9CA3' }}>{d.sub} · {d.commercialPath}</div>
            </div>
            <button onClick={onClose} aria-label="Close" style={{ flex: 'none', width: 34, height: 34, borderRadius: 9, border: '1px solid #EAE8E3', background: '#fff', cursor: 'pointer', fontSize: 17, color: '#5E6066', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          <div style={{ display: 'flex', marginTop: 18, border: '1px solid #EAE8E3', borderRadius: 11, background: '#fff', overflow: 'hidden' }}>
            {headerMetrics.map((m, i) => (
              <div key={i} style={{ flex: 1, padding: '13px 16px', borderRight: i < headerMetrics.length - 1 ? '1px solid #F2F0EB' : 'none' }}>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: m.mono ? 16 : 15, fontWeight: m.mono ? 600 : 700, fontFamily: m.mono ? mono : 'inherit', color: m.stale ? '#A7A99F' : '#1C1D21' }}>{m.value}</div>
                <div style={{ fontSize: 10.5, color: '#9A9CA3', marginTop: 2 }}>{m.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '26px 30px 60px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* INCENTIVE HERO */}
          <div style={{ background: '#fff', border: '1.5px solid #E4E2DC', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #F2F0EB', display: 'flex', alignItems: 'center', gap: 11, background: 'linear-gradient(180deg,#FCFBF9,#fff)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT }} />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>Incentive & Rebate</h3>
              <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT, background: 'var(--afx-accent-soft)', padding: '3px 7px', borderRadius: 5 }}>Hero signal</span>
              {inc.asOf ? <span style={{ marginLeft: 'auto', fontFamily: mono, fontSize: 10.5, color: '#9A9CA3' }}>as of {inc.asOf}</span> : null}
            </div>
            <div style={{ padding: '20px 22px' }}>
              {inc.blended == null ? (
                <div style={{ border: '1px dashed #CFCCC4', borderRadius: 10, padding: '18px 20px', background: 'repeating-linear-gradient(135deg,#FBFAF7,#FBFAF7 6px,#F4F2ED 6px,#F4F2ED 12px)' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#5E6066' }}>No incentive on file</div>
                  <div style={{ fontSize: 12.5, color: '#9A9CA3', marginTop: 4 }}>Absence is a screening signal — this is not the same as a 0% rebate. No national scheme is recorded for this jurisdiction.</div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
                    <div style={{ background: '#FAF9F7', border: '1px solid #EFEDE8', borderRadius: 10, padding: 15 }}>
                      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 8 }}>Value · blended</div>
                      <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 600, letterSpacing: '-1px' }}>{inc.blended}%</div>
                      <div style={{ fontFamily: mono, fontSize: 11, color: '#5E6066', marginTop: 4 }}>≈ {fmtUSD(inc.valueUSD)}</div>
                    </div>
                    <div style={{ background: '#FAF9F7', border: '1px solid #EFEDE8', borderRadius: 10, padding: 15 }}>
                      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 8 }}>Certainty</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span style={confMarkerStyle(inc.confidence, 16)} />
                        <span style={{ fontSize: 18, fontWeight: 700 }}>{inc.confidence}</span>
                      </div>
                      {inc.confNote ? <div style={{ fontSize: 10.5, color: '#9A9CA3', marginTop: 6 }}>{inc.confNote}</div> : null}
                    </div>
                    <div style={{ background: '#FAF9F7', border: '1px solid #EFEDE8', borderRadius: 10, padding: 15 }}>
                      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 8 }}>Payout timing</div>
                      <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>{inc.payout}</div>
                      {inc.payoutNote ? <div style={{ fontSize: 10.5, color: '#9A9CA3', marginTop: 6 }}>{inc.payoutNote}</div> : null}
                    </div>
                  </div>

                  <div style={{ border: '1px solid #EFEDE8', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.7fr 1.3fr 1fr 0.9fr', padding: '9px 14px', background: '#FCFBF9', borderBottom: '1px solid #F2F0EB' }}>
                      {['Jurisdiction', 'Rebate', 'Scheme', 'Live status', 'As of'].map((h) => (
                        <span key={h} style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A7A99F' }}>{h}</span>
                      ))}
                    </div>
                    {(inc.lines ?? []).map((ln, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.7fr 1.3fr 1fr 0.9fr', padding: '12px 14px', borderBottom: '1px solid #F5F3EE', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{ln.country}</span>
                        <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600 }}>{ln.pct}%</span>
                        <span style={{ fontSize: 12, color: '#5E6066' }}>{ln.scheme}</span>
                        <span style={statusStyle(ln.status)}>{ln.status}</span>
                        <span style={{ fontFamily: mono, fontSize: 11, color: '#9A9CA3' }}>{ln.as}</span>
                      </div>
                    ))}
                  </div>
                  {inc.qsape ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 13 }}>
                      <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F' }}>QSAPE / equiv.</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{inc.qsape}</span>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          {/* CAPITAL STACK */}
          <div style={{ background: '#fff', border: '1px solid #EAE8E3', borderRadius: 14, padding: '20px 22px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>Capital Stack</h3>
            <CapitalStackBar stack={d.detail.stack} showAsk={!!gap} />
          </div>

          {/* expandable blocks */}
          <Blocks d={d} entity={entity} expanded={expanded} toggle={toggle} />
        </div>
      </div>
    </>
  );
}

function BlockShell({ title, summary, open, onToggle, children }: { title: string; summary: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #EAE8E3', borderRadius: 14, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--afx-body)' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px', flex: 1 }}>{title}</h3>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#5E6066' }}>{summary}</span>
        <span style={{ fontSize: 18, color: '#9A9CA3', transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>⌄</span>
      </button>
      {open ? <div style={{ padding: '4px 22px 22px' }}>{children}</div> : null}
    </div>
  );
}

function Blocks({ d, expanded, toggle }: { d: DealEntity; entity: EntityKind; expanded: Record<string, boolean>; toggle: (k: string) => void }) {
  const det = d.detail;
  const out: React.ReactNode[] = [];

  if (det.confidence) {
    const c = det.confidence;
    out.push(
      <BlockShell key="confidence" title="Producer Confidence" summary={`${d.ratingBand} · ${d.careerStage}`} open={!!expanded.confidence} onToggle={() => toggle('confidence')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
          {c.subscores.map((s, i) => (
            <div key={i} style={{ background: '#FAF9F7', border: '1px solid #EFEDE8', borderRadius: 9, padding: 12 }}>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 7 }}>{s.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontFamily: mono, fontSize: 19, fontWeight: 600 }}>{s.v}</span>
                <span style={{ fontSize: 10, color: '#9A9CA3' }}>/100</span>
              </div>
              <div style={{ height: 4, background: '#EAE8E3', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.v}%`, background: '#1C1D21', borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[['Completed projects', String(c.completed)], ['Capital raised (lifetime)', fmtUSD(c.raisedUSD)], ['Bond history', c.bond], ['Distribution', c.distribution.join(', ')]].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: '1px solid #F2F0EB' }}>
              <span style={{ fontSize: 12.5, color: '#5E6066' }}>{r[0]}</span>
              <span style={{ fontFamily: mono, fontSize: 12.5, fontWeight: 600, textAlign: 'right' }}>{r[1]}</span>
            </div>
          ))}
        </div>
      </BlockShell>
    );
  }

  if (det.packaging) {
    const signed = det.packaging.filter((p) => p.prov === 'signed').length;
    out.push(
      <BlockShell key="packaging" title="Packaging Strength" summary={`score ${det.packagingScore ?? '—'} · ${signed} signed`} open={!!expanded.packaging} onToggle={() => toggle('packaging')}>
        {det.packaging.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F2F0EB' }}>
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A7A99F', width: 92, flex: 'none' }}>{p.role}</span>
            <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1 }}>{p.name}</span>
            <span style={confMarkerStyle(PROV_TO_CONF[p.prov], 9)} />
            <span style={{ fontSize: 11.5, color: '#5E6066', width: 78, textAlign: 'right' }}>{PROV_LABEL[p.prov]}</span>
          </div>
        ))}
      </BlockShell>
    );
  }

  if (det.market) {
    const mk = det.market;
    out.push(
      <BlockShell key="market" title="Market & Monetization" summary={mk.path} open={!!expanded.market} onToggle={() => toggle('market')}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
          {mk.tags.map((t) => (
            <span key={t} style={{ fontSize: 11.5, color: '#5E6066', background: '#F7F5F1', border: '1px solid #ECEAE4', padding: '4px 10px', borderRadius: 20 }}>{t}</span>
          ))}
        </div>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 10 }}>Comparable titles</div>
        {mk.comps.map((cp, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid #F2F0EB' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{cp.title}</span>
            <span style={{ fontSize: 12, color: '#5E6066', textAlign: 'right', maxWidth: '58%' }}>{cp.note}</span>
          </div>
        ))}
      </BlockShell>
    );
  }

  if (det.risk) {
    const rk = det.risk;
    const items: [string, number][] = [['Execution', rk.execution], ['Market', rk.market], ['Capital gap', rk.gap], ['Incentive timing', rk.timing]];
    const avg = Math.round(items.reduce((a, x) => a + x[1], 0) / items.length);
    out.push(
      <BlockShell key="risk" title="Risk Profile" summary={`blended ${avg}/100`} open={!!expanded.risk} onToggle={() => toggle('risk')}>
        <div style={{ fontSize: 11.5, color: '#9A9CA3', marginBottom: 14 }}>Decomposed, not collapsed. Lower is better. Bars benchmarked against the comparable-deal median (50).</div>
        {items.map((r, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{r[0]}</span>
              <span style={{ fontFamily: mono, fontSize: 12, color: '#5E6066' }}>{r[1]}/100</span>
            </div>
            <div style={{ position: 'relative', height: 7, background: '#EFEDE8', borderRadius: 4 }}>
              <div style={{ height: '100%', width: `${r[1]}%`, background: r[1] > 60 ? ACCENT : '#1C1D21', borderRadius: 4 }} />
              <div title="median" style={{ position: 'absolute', left: '50%', top: -3, width: 2, height: 13, background: '#C2C4BA' }} />
            </div>
          </div>
        ))}
      </BlockShell>
    );
  }

  return <>{out}</>;
}
