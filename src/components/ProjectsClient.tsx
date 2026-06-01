'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { PublicProjectCard } from '@/app/actions';

const TIER_BADGE: Record<NonNullable<PublicProjectCard['tier']>, { label: string; color: string; bg: string }> = {
  early: { label: 'Early Concept', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  developing: { label: 'Developing', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  ready: { label: 'Funding Ready', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
};

function ProjectCard({ p }: { p: PublicProjectCard }) {
  const badge = p.tier ? TIER_BADGE[p.tier] : null;
  const meta = [p.format, p.genre, p.stage].filter(Boolean).join(' · ');
  const href = `/projects/${p.token}`;

  const body = (
    <div
      className="h-full flex flex-col rounded-2xl p-5 transition-colors"
      style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {meta && (
            <div className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'rgba(250,250,250,0.5)' }}>
              {meta}
            </div>
          )}
          <h3 className="font-heading font-bold text-lg leading-tight">{p.title}</h3>
        </div>
        {badge && (
          <span
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap"
            style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.color}33` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.color }} />
            {badge.label}
          </span>
        )}
      </div>

      {p.logline && (
        <p className="text-sm leading-relaxed mt-3 line-clamp-3" style={{ color: 'rgba(250,250,250,0.72)' }}>
          {p.logline}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3.5">
        {p.country && <span className="text-xs" style={{ color: 'rgba(250,250,250,0.5)' }}>📍 {p.country}</span>}
        {p.seeking.map((s) => (
          <span
            key={s}
            className="text-[11px] font-semibold rounded-md px-2 py-1"
            style={{ color: 'rgba(250,250,250,0.7)', background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            {s}
          </span>
        ))}
      </div>

      {p.member_name && (
        <div className="mt-auto pt-4 text-[13px]" style={{ color: 'rgba(250,250,250,0.55)' }}>
          by <span style={{ color: '#93c5fd' }}>{p.member_name}</span> →
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full hover:opacity-95">{body}</Link>
  ) : (
    body
  );
}

export default function ProjectsClient({ initialData }: { initialData: PublicProjectCard[] }) {
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<string>('all');

  const formats = useMemo(() => {
    const set = new Set<string>();
    initialData.forEach((p) => p.format && set.add(p.format));
    return ['all', ...Array.from(set).sort()];
  }, [initialData]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialData.filter((p) => {
      if (format !== 'all' && p.format !== format) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.logline ?? '').toLowerCase().includes(q) ||
        (p.genre ?? '').toLowerCase().includes(q) ||
        (p.member_name ?? '').toLowerCase().includes(q) ||
        p.seeking.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [initialData, query, format]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, loglines, or filmmakers…"
          className="w-full rounded-xl px-4 py-3 text-[15px] outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--foreground)' }}
        />
        {formats.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {formats.map((f) => {
              const active = f === format;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className="rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
                  style={{
                    background: active ? '#3b82f6' : 'rgba(255,255,255,0.04)',
                    color: active ? '#fff' : 'rgba(250,250,250,0.65)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {f === 'all' ? 'All formats' : f}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center text-sm"
          style={{ border: '1px dashed rgba(255,255,255,0.14)', color: 'rgba(250,250,250,0.6)' }}
        >
          {initialData.length === 0
            ? 'No public projects yet — members can share their projects from their profile.'
            : 'No projects match your filters.'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.token} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
