'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';

export type DirectoryMember = {
  id: string;
  username: string;
  full_name: string;
  tagline: string | null;
  tier: 'individual' | 'business';
  availability: string | null;
  disciplines: string[];
  company_specialisms: string[];
  company_name: string | null;
  company_tagline: string | null;
  company_founded_year: number | null;
  company_logo_url: string | null;
  avatar_url: string | null;
  location_city: string | null;
  country: string | null;
  joined_at: string;
  founding_member_lock: boolean;
};

const AVAIL_COLOR: Record<string, string> = {
  available: '#22c55e',
  selective: '#f59e0b',
  busy: '#ef4444',
};

const PAGE_SIZE = 12;

function joinedShort(joinedAt: string) {
  return `'${new Date(joinedAt).getFullYear().toString().slice(2)}`;
}

/* ── Member card ─────────────────────────────────────────────────────── */
function MemberCard({ m, wide }: { m: DirectoryMember; wide?: boolean }) {
  const isBiz = m.tier === 'business';
  const name = isBiz ? (m.company_name ?? m.full_name) : m.full_name;
  const tagline = isBiz ? m.company_tagline : m.tagline;
  const disciplines = (isBiz ? m.company_specialisms : m.disciplines) ?? [];
  const photoUrl = isBiz ? m.company_logo_url : m.avatar_url;
  const avail = m.availability ?? 'available';
  const dotColor = AVAIL_COLOR[avail] ?? '#22c55e';

  return (
    <Link href={`/members/${m.username}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', height: '100%' }}>
      <div
        className="fra-card"
        style={{
          flex: 1,
          background: 'var(--surface)',
          border: `1px solid rgba(255,255,255,0.08)`,
          borderRadius: '12px',
          padding: wide ? '22px' : '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'relative',
          cursor: 'pointer',
        }}
        data-biz={isBiz ? '' : undefined}
      >
        {/* Founding mark */}
        {m.founding_member_lock && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            fontSize: '12px', color: '#f59e0b', lineHeight: 1, pointerEvents: 'none',
          }}>★</span>
        )}

        {/* Top row: avatar · badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{
            width: 48, height: 48, flexShrink: 0,
            borderRadius: isBiz ? '10px' : '999px',
            overflow: 'hidden',
            border: `1px solid ${isBiz ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)'}`,
            background: isBiz ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {photoUrl
              ? <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', color: isBiz ? '#fcd34d' : '#93c5fd' }}>
                  {name.charAt(0)}
                </span>
            }
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
              padding: '2px 8px', borderRadius: '6px',
              background: isBiz ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
              border: `1px solid ${isBiz ? 'rgba(245,158,11,0.25)' : 'rgba(59,130,246,0.25)'}`,
              color: isBiz ? '#fcd34d' : '#93c5fd',
              fontFamily: 'var(--font-mono, monospace)',
            }}>
              {isBiz ? 'Business' : 'Individual'}
            </span>
            {!isBiz && (
              <span style={{ width: 8, height: 8, borderRadius: '999px', background: dotColor, display: 'inline-block', flexShrink: 0 }} />
            )}
          </div>
        </div>

        {/* Name + tagline */}
        <div>
          <div style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700,
            fontSize: wide ? '21px' : '18px', lineHeight: 1.1,
          }}>{name}</div>
          {tagline && (
            <div style={{
              fontSize: '12px', fontStyle: 'italic', color: 'rgba(250,250,250,0.55)',
              marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: wide ? 'normal' : 'nowrap',
            }}>{tagline}</div>
          )}
        </div>

        {/* Discipline pills */}
        {disciplines.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {disciplines.slice(0, 3).map((d, i) => (
              <span key={i} style={{
                fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '3px 8px', borderRadius: '6px',
                background: isBiz ? 'rgba(245,158,11,0.07)' : 'rgba(59,130,246,0.07)',
                border: `1px solid ${isBiz ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)'}`,
                color: isBiz ? 'rgba(252,211,77,0.75)' : 'rgba(147,197,253,0.75)',
              }}>{d}</span>
            ))}
            {disciplines.length > 3 && (
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(250,250,250,0.35)',
              }}>+{disciplines.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '4px' }}>
          <span style={{
            fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'rgba(250,250,250,0.3)', fontFamily: 'var(--font-mono, monospace)',
          }}>
            {[m.location_city, m.country].filter(Boolean).join(', ')}
          </span>
          {isBiz ? (
            <span style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#86efac' }}>
              <span style={{ width: 6, height: 6, borderRadius: '999px', background: '#22c55e', display: 'inline-block' }} />
              Open to projects
            </span>
          ) : (
            <span style={{
              fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'rgba(250,250,250,0.3)', fontFamily: 'var(--font-mono, monospace)',
            }}>
              Since {joinedShort(m.joined_at)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── Skeleton card ───────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="animate-pulse" style={{ width: 48, height: 48, borderRadius: '999px', background: 'rgba(255,255,255,0.07)' }} />
        <div className="animate-pulse" style={{ width: 72, height: 20, borderRadius: '6px', background: 'rgba(255,255,255,0.07)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="animate-pulse" style={{ width: '65%', height: 20, borderRadius: '6px', background: 'rgba(255,255,255,0.07)' }} />
        <div className="animate-pulse" style={{ width: '85%', height: 13, borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }} />
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[56, 64, 48].map((w, i) => (
          <div key={i} className="animate-pulse" style={{ width: w, height: 22, borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="animate-pulse" style={{ width: 80, height: 12, borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }} />
        <div className="animate-pulse" style={{ width: 90, height: 12, borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }} />
      </div>
    </div>
  );
}

/* ── Asymmetric grid (V2 broadsheet rhythm) ──────────────────────────── */
const COL_TEMPLATES = ['2fr 1fr 1fr', '1fr 1fr 1fr', '1fr 2fr 1fr'];

function MemberGrid({ members }: { members: DirectoryMember[] }) {
  const rows: DirectoryMember[][] = [];
  for (let i = 0; i < members.length; i += 3) rows.push(members.slice(i, i + 3));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} className="fra-grid">
      {rows.map((row, ri) => {
        const tmpl = COL_TEMPLATES[ri % 3];
        const wideIndex = ri % 3 === 0 ? 0 : ri % 3 === 2 ? 1 : -1;
        return (
          <div key={ri} style={{ display: 'grid', gridTemplateColumns: tmpl, gap: '14px' }} className="fra-row">
            {row.map((m, ci) => <MemberCard key={m.id} m={m} wide={ci === wideIndex} />)}
          </div>
        );
      })}
    </div>
  );
}

/* ── Mobile filter sheet ─────────────────────────────────────────────── */
function FilterSheet({
  open, onClose, tier, setTier, availability, setAvailability,
  activeDisciplines, toggleDiscipline, activeCountries, toggleCountry,
  allDisciplines, allCountries, count, onClear,
}: {
  open: boolean; onClose: () => void;
  tier: string; setTier: (t: string) => void;
  availability: string[]; setAvailability: (a: string[]) => void;
  activeDisciplines: string[]; toggleDiscipline: (d: string) => void;
  activeCountries: string[]; toggleCountry: (c: string) => void;
  allDisciplines: string[]; allCountries: string[];
  count: number; onClear: () => void;
}) {
  function toggleAvail(v: string) {
    const next = availability.includes(v) ? availability.filter(x => x !== v) : [...availability, v];
    setAvailability(next);
  }

  return (
    <>
      {/* backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(9,9,11,0.7)', zIndex: 40, backdropFilter: 'blur(2px)' }}
        />
      )}
      {/* sheet */}
      <div style={{
        position: 'fixed', left: 8, right: 8, bottom: 8,
        maxHeight: '80vh', overflow: 'auto',
        background: 'var(--surface-raised)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '16px 16px 20px 20px',
        padding: '20px 20px 28px', zIndex: 50,
        transform: open ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.25s cubic-bezier(0.32,0,0.67,0)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '22px' }}>Filter</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(250,250,250,0.5)', cursor: 'pointer', fontSize: '20px', padding: '4px' }}>✕</button>
        </div>

        {/* Tier */}
        <div className="section-rule section-rule-muted" />
        <span className="section-rubric" style={{ marginTop: '10px' }}>Tier</span>
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          {['all', 'individual', 'business'].map(t => (
            <button key={t} onClick={() => setTier(t)} style={{
              padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              border: `1px solid ${tier === t ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.12)'}`,
              background: tier === t ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: tier === t ? '#93c5fd' : 'rgba(250,250,250,0.6)', cursor: 'pointer',
              textTransform: 'capitalize',
            }}>{t === 'all' ? 'All' : t}</button>
          ))}
        </div>

        {/* Availability */}
        <div className="section-rule section-rule-muted" style={{ marginTop: '18px' }} />
        <span className="section-rubric" style={{ marginTop: '10px' }}>Availability</span>
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          {[['available', '● Available', '#22c55e'], ['selective', '◐ Selective', '#f59e0b'], ['busy', '○ Unavailable', '#ef4444']].map(([v, label, color]) => (
            <button key={v} onClick={() => toggleAvail(v)} style={{
              padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              border: `1px solid ${availability.includes(v) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
              background: availability.includes(v) ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: availability.includes(v) ? color as string : 'rgba(250,250,250,0.5)', cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>

        {/* Discipline */}
        <div className="section-rule section-rule-muted" style={{ marginTop: '18px' }} />
        <span className="section-rubric" style={{ marginTop: '10px' }}>Discipline</span>
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
          {allDisciplines.map(d => (
            <button key={d} onClick={() => toggleDiscipline(d)} style={{
              padding: '5px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
              border: `1px solid ${activeDisciplines.includes(d) ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
              background: activeDisciplines.includes(d) ? 'rgba(59,130,246,0.12)' : 'transparent',
              color: activeDisciplines.includes(d) ? '#93c5fd' : 'rgba(250,250,250,0.5)', cursor: 'pointer',
            }}>{d}</button>
          ))}
        </div>

        {/* Country */}
        <div className="section-rule section-rule-muted" style={{ marginTop: '18px' }} />
        <span className="section-rubric" style={{ marginTop: '10px' }}>Country</span>
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
          {allCountries.map(c => (
            <button key={c} onClick={() => toggleCountry(c)} style={{
              padding: '5px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
              border: `1px solid ${activeCountries.includes(c) ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
              background: activeCountries.includes(c) ? 'rgba(59,130,246,0.12)' : 'transparent',
              color: activeCountries.includes(c) ? '#93c5fd' : 'rgba(250,250,250,0.5)', cursor: 'pointer',
            }}>{c}</button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button onClick={onClear} style={{
            flex: 1, padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
            color: 'rgba(250,250,250,0.6)', cursor: 'pointer',
          }}>Reset</button>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
            border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer',
          }}>Show {count} {count === 1 ? 'member' : 'members'}</button>
        </div>
      </div>
    </>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */
export default function DirectoryClient({ members }: { members: DirectoryMember[] }) {
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('all');
  const [activeDisciplines, setActiveDisciplines] = useState<string[]>([]);
  const [activeCountries, setActiveCountries] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const allDisciplines = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => {
      const d = m.tier === 'business' ? m.company_specialisms : m.disciplines;
      d?.forEach(x => set.add(x));
    });
    return Array.from(set).sort();
  }, [members]);

  const allCountries = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => { if (m.country) set.add(m.country); });
    return Array.from(set).sort();
  }, [members]);

  const filtered = useMemo(() => {
    return members.filter(m => {
      const name = m.tier === 'business' ? (m.company_name ?? m.full_name) : m.full_name;
      const discs = (m.tier === 'business' ? m.company_specialisms : m.disciplines) ?? [];
      const loc = [m.location_city, m.country].filter(Boolean).join(' ');

      if (search) {
        const q = search.toLowerCase();
        if (!name.toLowerCase().includes(q) && !discs.some(d => d.toLowerCase().includes(q)) && !loc.toLowerCase().includes(q)) return false;
      }
      if (tier !== 'all' && m.tier !== tier) return false;
      if (activeDisciplines.length > 0 && !activeDisciplines.some(d => discs.includes(d))) return false;
      if (activeCountries.length > 0 && !activeCountries.includes(m.country ?? '')) return false;
      if (availability.length > 0 && m.tier === 'individual' && !availability.includes(m.availability ?? 'available')) return false;

      return true;
    });
  }, [members, search, tier, activeDisciplines, activeCountries, availability]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > visible.length;
  const hasFilters = !!(search || tier !== 'all' || activeDisciplines.length || activeCountries.length || availability.length);

  const indCount = members.filter(m => m.tier === 'individual').length;
  const bizCount = members.filter(m => m.tier === 'business').length;
  const countryCount = allCountries.length;

  function toggleDiscipline(d: string) {
    setActiveDisciplines(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
    setPage(1);
  }
  function toggleCountry(c: string) {
    setActiveCountries(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
    setPage(1);
  }
  function clearAll() {
    setSearch(''); setTier('all');
    setActiveDisciplines([]); setActiveCountries([]); setAvailability([]);
    setPage(1);
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', paddingBottom: '80px' }}>

      {/* ── Page header (V2 broadsheet) ─────────────────────────────── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 0' }}>

        {/* Dateline strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'rgba(250,250,250,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            The Register · {new Date().getFullYear()}
          </span>
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'rgba(250,250,250,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Members directory — restricted
          </span>
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.16)', marginBottom: '20px' }} />

        {/* Masthead */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'flex-end', marginBottom: '20px' }}
          className="fra-masthead">
          <div>
            <h1 style={{
              fontFamily: 'var(--font-heading)', fontWeight: 800,
              fontSize: 'clamp(72px, 10vw, 128px)', lineHeight: 0.88,
              letterSpacing: '-0.03em', margin: 0,
            }}>
              The<br />Room.
            </h1>
          </div>
          <div style={{ paddingBottom: '8px' }}>
            <div className="section-rubric">Issue notes</div>
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '14px', color: 'rgba(250,250,250,0.55)' }}>{members.length} members.</span>
              <span style={{ fontSize: '14px', color: 'rgba(250,250,250,0.55)' }}>{countryCount} countries.</span>
              <span style={{ fontSize: '14px', color: 'rgba(250,250,250,0.55)' }}>{indCount} individuals, {bizCount} businesses.</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '14px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '4px 10px', borderRadius: '8px',
                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd',
              }}>{members.length} members</span>
              <span style={{
                fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '4px 10px', borderRadius: '8px',
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fcd34d',
              }}>{bizCount} businesses</span>
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.16)' }} />

        {/* ── Type-rail filter (desktop) ──────────────────────────────── */}
        <div style={{ padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'baseline', gap: '18px', flexWrap: 'wrap' }}
          className="fra-type-rail">
          <span className="section-rubric" style={{ marginBottom: 0, flexShrink: 0 }}>Filter</span>

          {(['all', 'individual', 'business'] as const).map(t => (
            <button key={t} onClick={() => { setTier(t); setPage(1); }} style={{
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: 'var(--foreground)',
              opacity: tier === t ? 1 : 0.35,
              textDecoration: tier === t ? 'underline wavy' : 'none',
              textDecorationColor: '#f59e0b',
              textUnderlineOffset: '5px',
              textTransform: 'capitalize',
              transition: 'opacity 0.15s',
            }}>
              {t === 'all' ? 'All' : t === 'individual' ? 'Individual' : 'Business'}
            </button>
          ))}

          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '20px', lineHeight: 1, flexShrink: 0 }}>·</span>

          <span className="section-rubric" style={{ marginBottom: 0, flexShrink: 0 }}>Discipline</span>

          {allDisciplines.slice(0, 7).map(d => (
            <button key={d} onClick={() => { toggleDiscipline(d); }} style={{
              fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: activeDisciplines.includes(d) ? 600 : 400,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: 'var(--foreground)',
              opacity: activeDisciplines.includes(d) ? 1 : 0.45,
              textDecoration: activeDisciplines.includes(d) ? 'underline' : 'none',
              textUnderlineOffset: '3px',
              transition: 'opacity 0.15s',
            }}>{d}</button>
          ))}

          {allDisciplines.length > 7 && (
            <span style={{ fontSize: '13px', color: 'rgba(250,250,250,0.35)', cursor: 'default' }}>
              +{allDisciplines.length - 7}
            </span>
          )}

          {/* Search — pushed to right */}
          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <input
              ref={searchRef}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="⌕  Search…"
              style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', padding: '7px 14px', fontSize: '13px',
                color: 'var(--foreground)', outline: 'none', width: '180px',
                fontFamily: 'inherit', transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.5)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />
          </div>
        </div>

        {/* ── Mobile filter pill row ──────────────────────────────────── */}
        <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px', overflowX: 'auto' }}
          className="fra-pill-rail">
          {(['all', 'individual', 'business'] as const).map(t => (
            <button key={t} onClick={() => { setTier(t); setPage(1); }} style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              border: `1px solid ${tier === t ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.12)'}`,
              background: tier === t ? 'rgba(59,130,246,0.12)' : 'transparent',
              color: tier === t ? '#93c5fd' : 'rgba(250,250,250,0.6)', cursor: 'pointer',
              textTransform: 'capitalize', whiteSpace: 'nowrap',
            }}>{t === 'all' ? 'All' : t}</button>
          ))}
          <button onClick={() => setSheetOpen(true)} style={{
            flexShrink: 0, padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            border: `1px solid ${hasFilters && tier === 'all' ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.12)'}`,
            background: hasFilters && tier === 'all' ? 'rgba(59,130,246,0.12)' : 'transparent',
            color: 'rgba(250,250,250,0.6)', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>+ Filters</button>
        </div>

        {/* ── Active filter chips ─────────────────────────────────────── */}
        {hasFilters && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', padding: '12px 0 0' }}>
            <span style={{ fontSize: '11px', color: 'rgba(250,250,250,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active:</span>
            {tier !== 'all' && (
              <button onClick={() => { setTier('all'); setPage(1); }} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
                borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
                color: '#93c5fd', cursor: 'pointer',
              }}>{tier} ✕</button>
            )}
            {activeDisciplines.map(d => (
              <button key={d} onClick={() => toggleDiscipline(d)} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
                borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(250,250,250,0.7)', cursor: 'pointer',
              }}>{d} ✕</button>
            ))}
            {activeCountries.map(c => (
              <button key={c} onClick={() => toggleCountry(c)} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
                borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(250,250,250,0.7)', cursor: 'pointer',
              }}>{c} ✕</button>
            ))}
            <button onClick={clearAll} style={{
              fontSize: '12px', color: 'rgba(250,250,250,0.4)', background: 'none',
              border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px', padding: 0,
            }}>Clear all</button>
          </div>
        )}
      </div>

      {/* ── Grid area ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 24px 0' }}>

        {filtered.length === 0 ? (
          <div style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '12px' }}>
            {members.length === 0 ? (
              <>
                <span style={{ fontSize: '32px', opacity: 0.25, fontFamily: 'var(--font-heading)' }}>—</span>
                <p style={{ fontSize: '15px', color: 'rgba(250,250,250,0.4)' }}>No members yet — check back soon.</p>
              </>
            ) : (
              <>
                <span style={{ fontSize: '24px', opacity: 0.4 }}>⌕</span>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', margin: 0 }}>Nobody matching that filter</p>
                <p style={{ fontSize: '14px', color: 'rgba(250,250,250,0.45)', margin: 0 }}>Try broadening your search or clearing a filter.</p>
                <button onClick={clearAll} style={{
                  marginTop: '8px', padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                  background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer',
                }}>Clear all</button>
              </>
            )}
          </div>
        ) : (
          <>
            <MemberGrid members={visible} />

            {hasMore && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '36px' }}>
                <button
                  onClick={() => setPage(p => p + 1)}
                  style={{
                    padding: '12px 32px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.16)', background: 'transparent',
                    color: 'rgba(250,250,250,0.7)', cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  Load more
                </button>
                <span style={{ fontSize: '12px', color: 'rgba(250,250,250,0.3)', fontFamily: 'var(--font-mono, monospace)' }}>
                  {visible.length} of {filtered.length}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Mobile filter sheet ───────────────────────────────────────── */}
      <FilterSheet
        open={sheetOpen} onClose={() => setSheetOpen(false)}
        tier={tier} setTier={t => { setTier(t); setPage(1); }}
        availability={availability} setAvailability={setAvailability}
        activeDisciplines={activeDisciplines} toggleDiscipline={toggleDiscipline}
        activeCountries={activeCountries} toggleCountry={toggleCountry}
        allDisciplines={allDisciplines} allCountries={allCountries}
        count={filtered.length} onClear={clearAll}
      />

      {/* ── Responsive overrides ─────────────────────────────────────── */}
      <style>{`
        .fra-type-rail { display: flex !important; }
        .fra-pill-rail  { display: none !important; }
        .fra-masthead   { grid-template-columns: 2fr 1fr !important; }

        .fra-card { transition: border-color 0.15s, background 0.15s; }
        .fra-card:hover { border-color: rgba(255,255,255,0.18) !important; background: var(--surface-raised) !important; }
        .fra-card[data-biz]:hover { border-color: rgba(245,158,11,0.25) !important; }

        @media (max-width: 1024px) {
          .fra-row { grid-template-columns: 1fr 1fr !important; }
          .fra-row > *:nth-child(3) { display: none; }
        }
        @media (max-width: 640px) {
          .fra-type-rail  { display: none !important; }
          .fra-pill-rail  { display: flex !important; }
          .fra-masthead   { grid-template-columns: 1fr !important; }
          .fra-masthead > *:last-child { display: none; }
          .fra-row { grid-template-columns: 1fr !important; }
          .fra-row > *:nth-child(n) { display: flex !important; }
        }
      `}</style>
    </main>
  );
}
