'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  setProjectVisibility, updateProjectDetails, deleteProject,
  type ProjectCard, type ProjectVisibility,
} from '@/app/actions';

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

// Mirror the intake options (questions.ts) for the lightweight edit form.
const FORMAT_OPTIONS = ['Feature film', 'Short film', 'Documentary feature', 'Documentary short', 'TV series', 'Web series', 'Commercial', 'Branded content'];
const STAGE_OPTIONS = ['Idea', 'Treatment', 'First draft script', 'Revised draft', 'Locked script', 'In development', 'Pre-production', 'Post-Production'];
const SEEKING_OPTIONS = ['Development funding', 'Production funding', 'Co-production partner', 'Distribution deal', 'Mentorship', 'Just feedback'];

function meta(p: ProjectCard): string {
  return [p.format, p.genre, p.stage].filter(Boolean).join(' · ');
}

const linkBtn: React.CSSProperties = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  fontSize: '13px', color: '#93c5fd', display: 'inline-flex', alignItems: 'center', gap: '4px',
};
const inputStyle: React.CSSProperties = {
  width: '100%', borderRadius: '8px', padding: '9px 11px', fontSize: '14px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--foreground)',
};
const labelStyle: React.CSSProperties = {
  fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em',
  color: 'rgba(250,250,250,0.45)', marginBottom: '5px', display: 'block',
};

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

function EditForm({ project, onClose }: { project: ProjectCard; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(project.title);
  const [logline, setLogline] = useState(project.logline ?? '');
  const [format, setFormat] = useState(project.format ?? '');
  const [genre, setGenre] = useState(project.genre ?? '');
  const [stage, setStage] = useState(project.stage ?? '');
  const [country, setCountry] = useState(project.country ?? '');
  const [seeking, setSeeking] = useState<string[]>(project.seeking ?? []);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleSeeking(s: string) {
    setSeeking((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await updateProjectDetails(project.token, {
          title, logline, format: format || null, genre: genre || null,
          stage: stage || null, country: country || null, seeking,
        });
        router.refresh();
        onClose();
      } catch {
        setError('Could not save changes.');
      }
    });
  }

  return (
    <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', display: 'grid', gap: '12px' }}>
      <div>
        <label style={labelStyle}>Title</label>
        <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Logline</label>
        <textarea style={{ ...inputStyle, minHeight: '64px', resize: 'vertical' }} value={logline} onChange={(e) => setLogline(e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Format</label>
          <select style={inputStyle} value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="">—</option>
            {FORMAT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Genre</label>
          <input style={inputStyle} value={genre} onChange={(e) => setGenre(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Stage</label>
          <select style={inputStyle} value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="">—</option>
            {STAGE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Location</label>
          <input style={inputStyle} value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Seeking</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SEEKING_OPTIONS.map((s) => {
            const active = seeking.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSeeking(s)}
                style={{
                  fontSize: '12px', fontWeight: 600, padding: '6px 10px', borderRadius: '8px', cursor: 'pointer',
                  background: active ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.03)',
                  color: active ? '#fff' : 'rgba(250,250,250,0.6)',
                  border: `1px solid ${active ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
      {error && <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>}
      <p style={{ fontSize: '12px', color: 'rgba(250,250,250,0.45)', margin: 0 }}>
        Editing updates how this project appears. To change your readiness score, re-assess.
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button" onClick={save} disabled={pending}
          style={{ padding: '9px 16px', borderRadius: '9px', border: 'none', cursor: pending ? 'default' : 'pointer', fontSize: '14px', fontWeight: 700, background: '#3b82f6', color: '#fff' }}
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button" onClick={onClose} disabled={pending}
          style={{ padding: '9px 16px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: 'transparent', color: 'rgba(250,250,250,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function DeleteControl({ project }: { project: ProjectCard }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteProject(project.token);
        router.refresh();
      } catch {
        setError('Could not delete.');
        setConfirming(false);
      }
    });
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} style={{ ...linkBtn, color: 'rgba(248,113,113,0.85)', marginLeft: 'auto' }}>
        🗑 Delete
      </button>
    );
  }
  return (
    <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
      <span style={{ color: 'rgba(250,250,250,0.7)' }}>
        Delete all {project.versions} version{project.versions === 1 ? '' : 's'}?
      </span>
      <button type="button" onClick={remove} disabled={pending} style={{ ...linkBtn, color: '#ef4444', fontWeight: 700 }}>
        {pending ? 'Deleting…' : 'Yes, delete'}
      </button>
      <button type="button" onClick={() => setConfirming(false)} disabled={pending} style={{ ...linkBtn, color: 'rgba(250,250,250,0.5)' }}>
        Cancel
      </button>
      {error && <span style={{ color: '#ef4444' }}>{error}</span>}
    </span>
  );
}

function ProjectCardView({ project, isOwner }: { project: ProjectCard; isOwner: boolean }) {
  const badge = project.tier ? TIER_BADGE[project.tier] : null;
  const m = meta(project);
  const [editing, setEditing] = useState(false);

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

          {editing ? (
            <EditForm project={project} onClose={() => setEditing(false)} />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button type="button" onClick={() => setEditing(true)} style={linkBtn}>✎ Edit</button>
              <Link href={`/assess?project=${project.token}`} style={linkBtn}>↻ Re-assess</Link>
              <Link href={`/p/${project.token}`} style={linkBtn}>
                Diagnosis{project.versions > 1 ? ` · ${project.versions} reads` : ''} ↗
              </Link>
              {project.visibility === 'public' && (
                <Link href={`/projects/${project.token}`} style={linkBtn}>Public page ↗</Link>
              )}
              <DeleteControl project={project} />
            </div>
          )}
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
            <ProjectCardView key={p.group} project={p} isOwner={isOwner} />
          ))}
        </div>
      )}
    </div>
  );
}
