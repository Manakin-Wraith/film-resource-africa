'use client';

import { useEffect, useRef, useState } from 'react';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: 'rgba(250,250,250,0.45)', marginBottom: '6px',
};

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — keep in sync with /api/members/upload-image

type Shape = 'circle' | 'rect' | 'wide';
type Toast = { kind: 'success' | 'error'; message: string } | null;

export default function ImageUpload({
  label,
  hint,
  value,
  onChange,
  shape,
  aspectRatio,
  uploadToken,
  prefilled,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  shape: Shape;
  aspectRatio?: string;
  /** Onboarding token — sent when there is no session yet. */
  uploadToken?: string;
  /** True when the current value came from a directory_listings prefill. */
  prefilled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const type = shape === 'wide' ? 'cover' : 'avatar';

  function reject(reason: string) {
    setUploadError(reason);
    setToast({ kind: 'error', message: reason });
  }

  async function upload(file: File) {
    /* Pre-flight client validation — surface failures immediately. */
    if (!ALLOWED_MIME.includes(file.type)) {
      reject('Only JPEG, PNG, WebP or GIF images are allowed');
      return;
    }
    if (file.size > MAX_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      reject(`File is ${mb} MB — max is 8 MB. Try compressing first.`);
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);
      if (uploadToken) fd.append('onboarding_token', uploadToken);
      const res = await fetch('/api/members/upload-image', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        reject(json.error ?? `Upload failed (${res.status})`);
      } else {
        onChange(json.url);
        setToast({ kind: 'success', message: shape === 'wide' ? 'Cover uploaded' : 'Image uploaded' });
      }
    } catch (e) {
      reject(e instanceof Error ? `Upload failed: ${e.message}` : 'Upload failed — check your connection');
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  const previewStyle: React.CSSProperties =
    shape === 'wide'
      ? { width: '100%', height: '100px', borderRadius: '10px', objectFit: 'cover' }
      : shape === 'circle'
      ? { width: '80px', height: '80px', borderRadius: '999px', objectFit: 'cover' }
      : { width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' };

  const zoneStyle: React.CSSProperties = {
    width: shape === 'wide' ? '100%' : '80px',
    height: shape === 'wide' ? '100px' : '80px',
    borderRadius: shape === 'circle' ? '999px' : shape === 'wide' ? '10px' : '12px',
    border: `1.5px dashed ${dragOver ? 'rgba(59,130,246,0.7)' : 'rgba(255,255,255,0.18)'}`,
    background: dragOver ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    cursor: uploading ? 'wait' : 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
    aspectRatio,
  };

  return (
    <div>
      <label style={labelStyle}>
        {label}
        {hint && <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(250,250,250,0.25)', marginLeft: '6px' }}>{hint}</span>}
        {prefilled && value && (
          <span style={{
            display: 'inline-block', marginLeft: '8px',
            padding: '2px 8px', borderRadius: '999px',
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
            background: 'rgba(34,197,94,0.12)', color: '#86efac',
            border: '1px solid rgba(34,197,94,0.3)',
            textTransform: 'none',
          }}>
            ✓ already on file
          </span>
        )}
      </label>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flexWrap: shape === 'wide' ? 'wrap' : undefined }}>
        <div
          style={value ? {} : zoneStyle}
          onClick={() => !uploading && !value && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {value ? (
            <img src={value} alt="" style={previewStyle} />
          ) : (
            <>
              <span style={{ fontSize: shape === 'wide' ? '20px' : '18px', opacity: 0.35 }}>
                {uploading ? '…' : '↑'}
              </span>
              {shape === 'wide' && (
                <span style={{ fontSize: '11px', color: 'rgba(250,250,250,0.3)', marginTop: '4px' }}>
                  {uploading ? 'Uploading…' : 'Click or drag to upload'}
                </span>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center', alignSelf: 'center' }}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.04)',
              color: uploading ? 'rgba(250,250,250,0.3)' : 'rgba(250,250,250,0.7)',
              cursor: uploading ? 'wait' : 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {uploading ? 'Uploading…' : value ? 'Change photo' : 'Upload photo'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={uploading}
              style={{
                padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                border: '1px solid rgba(239,68,68,0.2)', background: 'transparent',
                color: '#f87171', cursor: 'pointer',
              }}
            >
              Remove
            </button>
          )}
          {uploadError && (
            <span style={{ fontSize: '11px', color: '#fca5a5' }}>{uploadError}</span>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            background: toast.kind === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${toast.kind === 'success' ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
            color: toast.kind === 'success' ? '#86efac' : '#fca5a5',
            display: 'inline-block',
          }}
        >
          {toast.kind === 'success' ? '✓ ' : '⚠ '}{toast.message}
        </div>
      )}
    </div>
  );
}
