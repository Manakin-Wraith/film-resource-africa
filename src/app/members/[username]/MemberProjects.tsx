'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { setProjectVisibility, type ProjectCard, type ProjectVisibility } from '@/app/actions';

const TIER_BADGE: Record<NonNullable<ProjectCard['tier']>, { label: string; color: string; bg: string }> = {
  early: { label: 'Early Concept', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  developing: { label: 'Developing', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  ready: { label: 'Funding Ready', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
};

const VIS_OPTIONS: { value: ProjectVisibility; label: string; hint: string }[] = [
  { value: 'private', label: 'Private', hint: 'Only you' },
  { value: 'members', label: 'Members', hint: 'Logged-in members' },
  { value: 'public', label: 'Public', hint: 'Anyone' },
];

function meta(p: ProjectCard): string {
  return [p.format, p.genre, p.stage].filter(Boolean).join(' · ');
}

function VisibilityToggle({ project }: { project: ProjectCard }) {
  const [current, setCurrent] = useState<ProjectVisibility>(project.visibility);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: ProjectVisibility) {
    if (next === current || pending) return;
    const prev = current;
    setCurrent(next);
    setError(null);
    startTransition(async () => {
      try {
        await setProjectVisibility(project.token, next);
      } catch {
        setCurrent(prev);
        setError('Could not update');
      }
    });
  }

  return (
    <div style={{ marginTop: '14px' }}>
      <div style={{
        fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'rgba(250,250,250,0.4)', marginBottom: '6px',
      }}>
        Visibility{pending ? ' · saving…' : ''}
      </div>
      <div style={{ display: 'inline-flex', gap: '4px', padding: '4px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {VIS_OPTIONS.map((o) => {
          const active = o.value === current;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => change(o.value)}
              disabled={pending}
              title={o.hint}
              style={{
                padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: pending ? 'default' : 'pointer',
                fontSize: '12px', fontWeight: 600,
                background: active ? '#3b82f6' : 'transparent',
                color: active ? '#fff' : 'rgba(250,250,250,0.6)',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {error && <span style={{ marginLeft: '10px', fontSize: '12px', color: '#ef4444' }}>{error}</span>}
    </div>
  );
}

function ProjectCardView({ project, isOwner }: { project: ProjectCard; isOwner: boolean }) {
  const badge = project.tier ? TIER_BADGE[project.tier] : null;
  const m = meta(project);

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px',
      padding: '20px', background: 'rgba(255,255,255,0.02)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          {m && (
            <div style={{ fontSize: '12px', color: 'rgba(250,250,250,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              {m}
            </div>
          )}
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '21px', lineHeight: '1.15', margin: 0 }}>
            {project.title}
          </h3>
        </div>
        {badge && (
          <span style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 11px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
            color: badge.color, background: badge.bg, border: `1px solid ${badge.color}33`,
            whiteSpace: 'nowrap',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badge.color }} />
            {badge.label}
          </span>
        )}
      </div>

      {project.logline && (
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'rgba(250,250,250,0.72)', marginTop: '12px' }}>
          {project.logline}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
        {project.country && (
          <span style={{ fontSize: '12px', color: 'rgba(250,250,250,0.5)' }}>📍 {project.country}</span>
        )}
        {project.seeking.length > 0 && project.seeking.map((s) => (
          <span key={s} style={{
            fontSize: '11px', fontWeight: 600, padding: '4px 9px', borderRadius: '7px',
            color: 'rgba(250,250,250,0.7)', background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.2)',
          }}>
            {s}
          </span>
        ))}
      </div>

      {isOwner && (
        <>
          <VisibilityToggle project={project} />
          <div style={{ marginTop: '12px' }}>
            <Link href={`/p/${project.token}`} style={{ fontSize: '13px', color: '#93c5fd', borderBottom: '1px dashed rgba(147,197,253,0.4)' }}>
              View private diagnosis ↗
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function MemberProjects({
  projects,
  isOwner,
}: {
  projects: ProjectCard[];
  isOwner: boolean;
}) {
  // Non-owners with nothing visible: render nothing.
  if (!isOwner && projects.length === 0) return null;

  return (
    <div style={{ marginTop: '48px' }}>
      <div className="section-rule section-rule-accent" />
      <div className="section-rubric" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span>Projects · {projects.length}</span>
        {isOwner && (
          <Link href="/assess" style={{ fontSize: '12px', color: '#93c5fd', textTransform: 'none', letterSpacing: 0 }}>
            + Add a project
          </Link>
        )}
      </div>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '30px', marginBottom: '18px', lineHeight: '1.08' }}>
        {isOwner ? 'Your projects' : 'Projects'}
      </h2>

      {projects.length === 0 ? (
        <div style={{
          border: '1px dashed rgba(255,255,255,0.14)', borderRadius: '16px',
          padding: '28px', textAlign: 'center', color: 'rgba(250,250,250,0.6)', fontSize: '14px',
        }}>
          You haven&apos;t shared any projects yet. Run a{' '}
          <Link href="/assess" style={{ color: '#93c5fd', textDecoration: 'underline' }}>Project Readiness</Link>{' '}
          assessment, then choose who can see it.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {projects.map((p) => (
            <ProjectCardView key={p.token} project={p} isOwner={isOwner} />
          ))}
        </div>
      )}
    </div>
  );
}
