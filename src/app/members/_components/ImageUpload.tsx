'use client';

import { useRef, useState } from 'react';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: 'rgba(250,250,250,0.45)', marginBottom: '6px',
};

type Shape = 'circle' | 'rect' | 'wide';

export default function ImageUpload({
  label,
  hint,
  value,
  onChange,
  shape,
  aspectRatio,
  uploadToken,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  shape: Shape;
  aspectRatio?: string;
  /** Onboarding token — sent when there is no session yet. */
  uploadToken?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const type = shape === 'wide' ? 'cover' : 'avatar';

  async function upload(file: File) {
    setUploading(true);
    setUploadError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    if (uploadToken) fd.append('onboarding_token', uploadToken);
    const res = await fetch('/api/members/upload-image', { method: 'POST', body: fd });
    const json = await res.json();
    if (!res.ok) {
      setUploadError(json.error ?? 'Upload failed');
    } else {
      onChange(json.url);
    }
    setUploading(false);
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
    </div>
  );
}
