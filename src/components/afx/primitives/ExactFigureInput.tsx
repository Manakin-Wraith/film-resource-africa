'use client';

import { useState } from 'react';
import { parseMoney, formatExact } from '@/lib/afx/format';
import type { ExactMoney, AfxCurrency } from '@/lib/afx/types';

const mono = 'var(--afx-mono)';
const accent = 'var(--afx-accent)';

interface ExactFigureInputProps {
  value: ExactMoney | undefined;
  onCommit: (value: ExactMoney | undefined) => void;
  gated: boolean;
  label: string;
  defaultCurrency: AfxCurrency;
  confirmHint?: string;
}

/** NDA-gated inline expander for entering one private exact figure with its own
 *  currency. Renders nothing when `gated` is false (NDA unsigned). */
export default function ExactFigureInput({ value, onCommit, gated, label, defaultCurrency, confirmHint }: ExactFigureInputProps) {
  const hasValue = value != null;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [currency, setCurrency] = useState<AfxCurrency>(value?.currency ?? defaultCurrency);

  if (!gated) return null;

  // Collapsed: committed value (with edit/clear) or the add affordance.
  if (!open) {
    if (hasValue) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: mono, fontSize: 11.5, fontWeight: 600 }}>{formatExact(value)}</span>
          {confirmHint ? (
            <span style={{ fontSize: 10, fontStyle: 'italic', color: 'var(--afx-prov-confirmed)' }}>{confirmHint}</span>
          ) : null}
          <button
            onClick={() => { setText(String(value!.amount)); setCurrency(value!.currency); setOpen(true); }}
            style={linkBtn}
          >
            Edit
          </button>
          <button onClick={() => onCommit(undefined)} style={linkBtn}>Clear</button>
        </div>
      );
    }
    return (
      <button onClick={() => { setText(''); setCurrency(defaultCurrency); setOpen(true); }} style={{ ...linkBtn, color: accent, marginTop: 5 }}>
        + Add exact {label} (NDA)
      </button>
    );
  }

  // Open: currency toggle + amount entry. Commit on Save/Enter; unparseable input
  // keeps the field open so the producer can correct it.
  const commit = () => {
    if (text.trim() === '') { onCommit(undefined); setOpen(false); return; }
    const n = parseMoney(text);
    if (n == null) return; // unparseable — stay open
    onCommit({ amount: n, currency });
    setOpen(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
      <div style={{ display: 'inline-flex', border: '1px solid #E4E2DC', borderRadius: 7, overflow: 'hidden' }}>
        {(['ZAR', 'USD'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCurrency(c)}
            style={{
              cursor: 'pointer', fontFamily: mono, fontSize: 10.5, fontWeight: 600, padding: '5px 9px', border: 'none',
              background: currency === c ? '#1C1D21' : '#fff', color: currency === c ? '#fff' : '#9A9CA3',
            }}
          >
            {c === 'ZAR' ? 'R' : '$'}
          </button>
        ))}
      </div>
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setOpen(false); }}
        placeholder={`exact ${label} — e.g. 1.45m`}
        style={{
          flex: 1, minWidth: 110, fontFamily: mono, fontSize: 12, border: '1px solid #E4E2DC', borderRadius: 7,
          padding: '5px 9px', background: '#fff', outline: 'none',
        }}
      />
      <button onClick={commit} style={solidBtn}>Save</button>
      <button onClick={() => setOpen(false)} style={linkBtn}>Cancel</button>
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  cursor: 'pointer', background: 'none', border: 'none', padding: 0,
  fontFamily: mono, fontSize: 10.5, fontWeight: 600, color: '#9A9CA3', letterSpacing: '0.02em',
};

const solidBtn: React.CSSProperties = {
  cursor: 'pointer', fontFamily: 'var(--afx-body)', fontSize: 11.5, fontWeight: 600,
  padding: '5px 11px', borderRadius: 7, border: '1px solid #1C1D21', background: '#1C1D21', color: '#fff',
};
