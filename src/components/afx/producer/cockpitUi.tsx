'use client';

import { useState } from 'react';

const mono = 'var(--afx-mono)';

export function SectionCard({
  title,
  hint,
  children,
  action,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section style={{ background: 'var(--afx-surface)', border: '1px solid #EAE8E3', borderRadius: 14, overflow: 'hidden' }}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); }
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px 22px', borderBottom: open ? '1px solid #F2F0EB' : 'none', background: 'linear-gradient(180deg,#FCFBF9,#fff)', cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--afx-accent)' }} />
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>{title}</h2>
        {hint ? <span style={{ fontSize: 11.5, color: '#9A9CA3' }}>{hint}</span> : null}
        {action ? (
          <div style={{ marginLeft: 'auto' }} onClick={(e) => { e.stopPropagation(); setOpen(true); }}>{action}</div>
        ) : null}
        <span aria-hidden style={{ marginLeft: action ? 10 : 'auto', fontFamily: mono, fontSize: 12, color: '#9A9CA3', transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none', lineHeight: 1 }}>▸</span>
      </div>
      <div style={{ padding: '18px 22px', display: open ? 'block' : 'none' }}>{children}</div>
    </section>
  );
}

/** Inline editable text field. */
export function InlineEdit({
  value,
  onChange,
  label,
  multiline,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  const baseStyle: React.CSSProperties = {
    width: '100%', fontFamily: 'var(--afx-body)', fontSize: 13.5, color: '#1C1D21',
    border: '1px solid #E4E2DC', borderRadius: 8, padding: '8px 11px', background: '#fff',
    outline: 'none',
  };
  return (
    <label style={{ display: 'block' }}>
      {label ? (
        <span style={{ display: 'block', fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 6 }}>{label}</span>
      ) : null}
      {multiline ? (
        <textarea value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} rows={3} style={{ ...baseStyle, resize: 'vertical', lineHeight: 1.5 }} />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={baseStyle} />
      )}
    </label>
  );
}

/** Inline labelled dropdown, styled to match InlineEdit. */
export function InlineSelect({
  value,
  onChange,
  label,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  options: readonly { code: string; name: string }[];
  placeholder?: string;
}) {
  const baseStyle: React.CSSProperties = {
    width: '100%', fontFamily: 'var(--afx-body)', fontSize: 13.5, color: value ? '#1C1D21' : '#9A9CA3',
    border: '1px solid #E4E2DC', borderRadius: 8, padding: '8px 11px', background: '#fff', outline: 'none', cursor: 'pointer',
  };
  return (
    <label style={{ display: 'block' }}>
      {label ? (
        <span style={{ display: 'block', fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7A99F', marginBottom: 6 }}>{label}</span>
      ) : null}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={baseStyle}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
      </select>
    </label>
  );
}

export function GhostButton({ onClick, children, tone = 'neutral' }: { onClick: () => void; children: React.ReactNode; tone?: 'neutral' | 'danger' | 'accent' }) {
  const color = tone === 'danger' ? '#7A2E2E' : tone === 'accent' ? 'var(--afx-accent)' : '#5E6066';
  const border = tone === 'danger' ? '#E3B6AE' : tone === 'accent' ? '#D6D8F5' : '#E4E2DC';
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        fontFamily: 'var(--afx-body)', fontSize: 12.5, fontWeight: 600, padding: '7px 13px',
        borderRadius: 8, border: `1px solid ${border}`, background: '#fff', color,
      }}
    >
      {children}
    </button>
  );
}
