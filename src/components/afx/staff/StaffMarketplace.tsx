'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ReviewRow, ReviewProjectRow } from '@/lib/afx/reviewMarketplace';
import type { DeriskingBreakdown } from '@/lib/afx/derisking';

const mono = 'var(--afx-mono)';

const BREAKDOWN: { key: keyof DeriskingBreakdown; label: string }[] = [
  { key: 'completeness', label: 'cmp' },
  { key: 'packaging', label: 'pkg' },
  { key: 'fundingSecured', label: 'fund' },
  { key: 'documents', label: 'docs' },
  { key: 'softFunding', label: 'soft' },
];

function VerifiedBadge({ label }: { label: string }) {
  return <span style={{ fontFamily: mono, fontSize: 9.5, fontWeight: 700, color: '#2E7D46', background: '#F2FBF4', border: '1px solid #CDEAD5', borderRadius: 999, padding: '2px 8px' }}>{label}</span>;
}

function BreakdownChips({ b }: { b: DeriskingBreakdown }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
      {BREAKDOWN.map((c) => (
        <span key={c.key} style={{ fontFamily: mono, fontSize: 9.5, color: 'var(--afx-muted)', background: '#F6F5F2', border: '1px solid var(--afx-border)', borderRadius: 6, padding: '2px 7px' }}>
          {c.label} {b[c.key]}
        </span>
      ))}
    </div>
  );
}

function ScoreTag({ score }: { score: number }) {
  return <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: 'var(--afx-ink)' }}>{score.toFixed(1)}</span>;
}

function ProjectRowView({ p }: { p: ReviewProjectRow }) {
  const meta = [p.stage, p.format, p.budgetBand, p.fundingSecuredBand].filter(Boolean).join(' · ');
  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid var(--afx-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--afx-ink)' }}>{p.title || 'Untitled'}</span>
        <ScoreTag score={p.score} />
      </div>
      <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-faint)', marginTop: 3 }}>{meta || '—'}</div>
      <BreakdownChips b={p.breakdown} />
    </div>
  );
}

export default function StaffMarketplace({ rows }: { rows: ReviewRow[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href="/afx/staff" style={{ fontFamily: mono, fontSize: 11, color: 'var(--afx-faint)', textDecoration: 'none' }}>← Queue</Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--afx-ink)', margin: 0 }}>Marketplace review</h1>
      </div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--afx-faint)', padding: '20px 0' }}>No producers with live projects yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => {
            const isOpen = !!open[r.producerId];
            const best = r.projects[0];
            return (
              <div key={r.producerId} style={{ border: '1px solid var(--afx-border)', borderRadius: 12, background: '#fff', padding: '13px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--afx-ink)' }}>
                      {r.producerName}{r.company ? <span style={{ color: 'var(--afx-faint)', fontWeight: 400 }}> · {r.company}</span> : null}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                      {r.verifiedIndividual ? <VerifiedBadge label="verified individual" /> : null}
                      {r.verifiedCompany ? <VerifiedBadge label="verified company" /> : null}
                      <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-faint)' }}>{r.liveCount} live</span>
                      {r.bestProjectTitle ? <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-faint)' }}>· strongest: {r.bestProjectTitle}</span> : null}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--afx-faint)' }}>de-risking</div>
                    <ScoreTag score={r.bestScore} />
                  </div>
                  <button onClick={() => setOpen((o) => ({ ...o, [r.producerId]: !o[r.producerId] }))}
                    style={{ cursor: 'pointer', background: 'none', border: '1px solid var(--afx-border)', borderRadius: 7, padding: '5px 10px', fontFamily: mono, fontSize: 10, fontWeight: 600, color: 'var(--afx-muted)' }}>
                    {isOpen ? '▾' : '▸'} {r.liveCount} project{r.liveCount === 1 ? '' : 's'}
                  </button>
                </div>
                {best ? <BreakdownChips b={best.breakdown} /> : null}
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
