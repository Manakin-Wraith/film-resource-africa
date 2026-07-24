'use client';

import { useState } from 'react';
import type { FunderMarketRow, FunderMarketProjectRow, FunderMarketCaseStudyRow, FunderMarketSlateRow } from '@/lib/afx/funderMarketplace';
import type { EvidenceLink, RiskTier, Provenance } from '@/lib/afx/types';
import { RATING_BAND_LABEL, VISIBILITY_META, EVIDENCE_CLAIM_LABELS } from '@/lib/afx/constants';
import ProvenanceBadge from '@/components/afx/primitives/ProvenanceBadge';
import CapitalStackBarPct from '@/components/afx/primitives/CapitalStackBarPct';
import RiskFlag from '@/components/afx/primitives/RiskFlag';

const mono = 'var(--afx-mono)';

const STATUS_LABEL: Record<FunderMarketProjectRow['packaging'][number]['status'], string> = {
  signed: 'Signed', 'soft-hold': 'Soft-hold', wishlist: 'Wishlist',
};

const RISK_TIER_LABEL: Record<RiskTier, string> = {
  low: 'low-risk', mid: 'mid', 'high-upside': 'high-upside',
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

/** Compact "3/4 fully recouped · 2 titles bonded" glance line. Renders nothing
 *  once the producer has zero case studies (both fields stay '—'). */
function TrackRecordLine({ trackRecord }: { trackRecord: FunderMarketRow['trackRecord'] }) {
  if (trackRecord.recoupmentRecord === '—') return null;
  return (
    <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-muted)' }}>
      {trackRecord.recoupmentRecord} · {trackRecord.bondHistory}
    </span>
  );
}

function EvidenceLinks({ evidence }: { evidence: EvidenceLink[] }) {
  if (evidence.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
      {evidence.map((e) => (
        <a key={e.id} href={e.url} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, color: 'var(--afx-accent, #3D46C9)', textDecoration: 'none' }}>
          {EVIDENCE_CLAIM_LABELS[e.supports]} ↗
        </a>
      ))}
    </div>
  );
}

function AboutRow({ r }: { r: FunderMarketRow }) {
  if (!r.bio && !r.location) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--afx-faint)', marginBottom: 6 }}>About</div>
      {r.bio ? <div style={{ fontSize: 12.5, color: 'var(--afx-ink)', lineHeight: 1.5 }}>{r.bio}</div> : null}
      {r.location ? <div style={{ fontFamily: mono, fontSize: 10.5, color: 'var(--afx-faint)', marginTop: 4 }}>{r.location}</div> : null}
    </div>
  );
}

function TeamRow({ relationships }: { relationships: FunderMarketRow['relationships'] }) {
  if (relationships.length === 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--afx-faint)', marginBottom: 6 }}>Team & relationships</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {relationships.map((rel) => (
          <div key={rel.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ flex: 1, fontWeight: 600 }}>{rel.name}</span>
            <span style={{ fontFamily: mono, fontSize: 10.5, color: 'var(--afx-faint)' }}>{rel.role}</span>
            <ProvenanceBadge provenance={rel.provenance} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CaseStudyRowView({ s }: { s: FunderMarketCaseStudyRow }) {
  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid var(--afx-border)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--afx-ink)' }}>{s.title || 'Untitled'}</span>
        <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-faint)' }}>{[s.format, s.budgetBand].filter(Boolean).join(' · ')}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ width: 78, flex: 'none', color: 'var(--afx-faint)' }}>Recoupment</span>
          <span style={{ flex: 1, fontWeight: 600 }}>{s.recoupment.value}</span>
          <ProvenanceBadge provenance={s.recoupment.provenance} size="sm" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ width: 78, flex: 'none', color: 'var(--afx-faint)' }}>Bond</span>
          <span style={{ flex: 1, fontWeight: 600 }}>{s.bondUsed.value}</span>
          <ProvenanceBadge provenance={s.bondUsed.provenance} size="sm" />
        </div>
        {s.distribution.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ width: 78, flex: 'none', color: 'var(--afx-faint)' }}>Distribution</span>
            <span style={{ flex: 1, fontWeight: 600 }}>{d.name} · {d.type}</span>
            <ProvenanceBadge provenance={d.provenance} size="sm" />
          </div>
        ))}
      </div>
      {s.festivalsAwards.length > 0 ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {s.festivalsAwards.map((f, i) => (
            <span key={i} style={{ fontSize: 10.5, color: 'var(--afx-muted)', background: '#F6F5F2', border: '1px solid var(--afx-border)', borderRadius: 6, padding: '2px 7px' }}>{f}</span>
          ))}
        </div>
      ) : null}
      <EvidenceLinks evidence={s.evidence} />
    </div>
  );
}

function RiskSpreadLine({ riskSpread }: { riskSpread: FunderMarketSlateRow['riskSpread'] }) {
  const parts = (['low', 'mid', 'high-upside'] as const)
    .filter((tier) => riskSpread[tier] > 0)
    .map((tier) => `${riskSpread[tier]} ${RISK_TIER_LABEL[tier]}`);
  if (parts.length === 0) return null;
  return <span style={{ fontSize: 12, color: 'var(--afx-muted)' }}>{parts.join(' / ')}</span>;
}

function SlateEconRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 12 }}>
      <span style={{ width: 110, flex: 'none', color: 'var(--afx-faint)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--afx-ink)' }}>{value || '—'}</span>
    </div>
  );
}

function SlateEconRowProvenanced({ label, field }: { label: string; field: { value: string; provenance: Provenance } }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <span style={{ width: 110, flex: 'none', color: 'var(--afx-faint)' }}>{label}</span>
      <span style={{ flex: 1, fontWeight: 600, color: 'var(--afx-ink)' }}>{field.value || '—'}</span>
      <ProvenanceBadge provenance={field.provenance} size="sm" />
    </div>
  );
}

function SlateRowView({ s }: { s: FunderMarketSlateRow }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid var(--afx-border)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--afx-faint)' }}>Slate</span>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--afx-ink)', marginTop: 2 }}>{s.name}</div>
          <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-faint)', marginTop: 2 }}>{[s.genreStrategy, `${s.volume} film${s.volume === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}</div>
        </div>
        <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: 'var(--afx-ink)', background: '#F6F5F2', border: '1px solid var(--afx-border)', borderRadius: 6, padding: '2px 7px' }}>{s.stage}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        <SlateEconRowProvenanced label="Budget" field={s.totalBudgetBand} />
        <SlateEconRow label="Secured" value={s.securedBand} />
        <SlateEconRowProvenanced label="Ask" field={s.askBand} />
        <SlateEconRowProvenanced label="Target IRR" field={s.targetIRR} />
        <SlateEconRowProvenanced label="Portfolio ROI" field={s.portfolioROI} />
      </div>
      <div style={{ marginTop: 6 }}>
        <RiskSpreadLine riskSpread={s.riskSpread} />
      </div>
      {s.distributionStrategy ? (
        <div style={{ fontSize: 12, color: 'var(--afx-muted)', marginTop: 6 }}>{s.distributionStrategy}</div>
      ) : null}
      <EvidenceLinks evidence={s.evidence} />
      <button onClick={() => setOpen((o) => !o)}
        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, marginTop: 8, fontFamily: mono, fontSize: 10.5, fontWeight: 600, color: 'var(--afx-muted)' }}>
        {open ? '▾' : '▸'} {s.volume} project{s.volume === 1 ? '' : 's'}
      </button>
      {open ? (
        <div>
          {s.projects.map((p) => <ProjectRowView key={p.id} p={p} />)}
        </div>
      ) : null}
    </div>
  );
}

function ProjectRowView({ p }: { p: FunderMarketProjectRow }) {
  const meta = [p.stage, p.format, p.budgetBand, p.fundingSecuredBand, p.commercialPath].filter(Boolean).join(' · ');
  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid var(--afx-border)' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--afx-ink)' }}>{p.title || 'Untitled'}</div>
      <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--afx-faint)', marginTop: 3 }}>{meta || '—'}</div>
      {p.logline ? (
        <div style={{ fontSize: 12, color: 'var(--afx-muted)', fontStyle: 'italic', marginTop: 6 }}>{p.logline}</div>
      ) : null}
      <div style={{ marginTop: 8 }}>
        <CapitalStackBarPct stack={p.capitalStack} />
      </div>
      {p.packaging.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 8 }}>
          {p.packaging.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ width: 70, flex: 'none', color: 'var(--afx-faint)' }}>{a.role}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{a.name || '—'}</span>
              <span style={{ fontSize: 10.5, color: 'var(--afx-muted)' }}>{STATUS_LABEL[a.status]}</span>
            </div>
          ))}
        </div>
      ) : null}
      {p.comps.length > 0 ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {p.comps.map((c, i) => (
            <span key={i} title={c.note} style={{ fontSize: 10.5, color: 'var(--afx-muted)', background: '#F6F5F2', border: '1px solid var(--afx-border)', borderRadius: 6, padding: '2px 7px' }}>{c.title}</span>
          ))}
        </div>
      ) : null}
      <EvidenceLinks evidence={p.evidence} />
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
                      <TrackRecordLine trackRecord={r.trackRecord} />
                    </div>
                  </div>
                  <button onClick={() => setOpen((o) => ({ ...o, [r.producerId]: !o[r.producerId] }))}
                    style={{ cursor: 'pointer', background: 'none', border: '1px solid var(--afx-border)', borderRadius: 7, padding: '5px 10px', fontFamily: mono, fontSize: 10, fontWeight: 600, color: 'var(--afx-muted)' }}>
                    {isOpen ? '▾' : '▸'} {r.screenableCount} project{r.screenableCount === 1 ? '' : 's'}
                  </button>
                </div>
                {isOpen ? (
                  <div style={{ marginTop: 8 }}>
                    {r.visibility === 'one-away' ? (
                      <div style={{ marginBottom: 10 }}>
                        <RiskFlag label="Single-project slate — higher risk, sorts lower" />
                      </div>
                    ) : null}
                    <AboutRow r={r} />
                    <TeamRow relationships={r.relationships} />
                    {r.caseStudies.length > 0 ? (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--afx-faint)', marginTop: 6 }}>Track record</div>
                        {r.caseStudies.map((s) => <CaseStudyRowView key={s.id} s={s} />)}
                      </div>
                    ) : null}
                    {r.slates.length > 0 ? (
                      <div style={{ marginBottom: 10 }}>
                        {r.slates.map((s) => <SlateRowView key={s.id} s={s} />)}
                      </div>
                    ) : null}
                    {r.projects.length > 0 ? (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--afx-faint)', marginTop: 6 }}>Live slate</div>
                        {r.projects.map((p) => <ProjectRowView key={p.id} p={p} />)}
                      </div>
                    ) : null}
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
