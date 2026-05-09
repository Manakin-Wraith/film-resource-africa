'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MemberProfile, Credit, Recognition } from '../page';
import ImageUpload from '@/app/members/_components/ImageUpload';

type CreditDraft = Credit & { _key: string };

function uid() { return Math.random().toString(36).slice(2); }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
  color: 'var(--foreground)', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: 'rgba(250,250,250,0.45)', marginBottom: '6px',
};
const sectionHeadStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '18px', marginBottom: '16px',
};

export default function EditProfileClient({ member }: { member: MemberProfile }) {
  const router = useRouter();
  const isBusiness = member.tier === 'business';

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  /* ── Form state ── */
  const [tagline, setTagline] = useState(isBusiness ? (member.company_tagline ?? '') : (member.tagline ?? ''));
  const [bio, setBio] = useState(isBusiness ? (member.company_description ?? '') : (member.bio ?? ''));
  const [avatarUrl, setAvatarUrl] = useState(isBusiness ? (member.company_logo_url ?? '') : (member.avatar_url ?? ''));
  const [coverUrl, setCoverUrl] = useState(member.cover_url ?? '');
  const [coverBackdrop, setCoverBackdrop] = useState<boolean>(member.cover_backdrop ?? false);
  const [logoBackdrop, setLogoBackdrop] = useState<boolean>(member.logo_backdrop ?? false);
  const [availability, setAvailability] = useState(member.availability ?? 'available');
  const [disciplines, setDisciplines] = useState((member.disciplines ?? []).join(', '));
  const [languages, setLanguages] = useState((member.languages ?? []).join(', '));
  const [travelWillingness, setTravelWillingness] = useState(member.travel_willingness ?? '');
  const [guilds, setGuilds] = useState(member.guilds ?? '');
  const [reelUrl, setReelUrl] = useState(member.reel_url ?? '');
  const [website, setWebsite] = useState(member.website ?? '');
  const [locationCity, setLocationCity] = useState(member.location_city ?? '');
  const [country, setCountry] = useState(member.country ?? '');
  // business
  const [companyName, setCompanyName] = useState(member.company_name ?? '');
  const [companyFoundedYear, setCompanyFoundedYear] = useState(member.company_founded_year ? String(member.company_founded_year) : '');
  const [companySpecialisms, setCompanySpecialisms] = useState((member.company_specialisms ?? []).join(', '));
  const [companyLookingFor, setCompanyLookingFor] = useState(member.company_looking_for ?? '');

  /* ── Credits ── */
  const [credits, setCredits] = useState<CreditDraft[]>(
    (Array.isArray(member.credits) ? member.credits : []).map(c => ({ ...c, _key: uid() }))
  );

  /* ── Recognition (business) ── */
  const [recognition, setRecognition] = useState<(Recognition & { _key: string })[]>(
    (Array.isArray(member.recognition) ? member.recognition : []).map(r => ({ ...r, _key: uid() }))
  );

  function addCredit() {
    setCredits(prev => [...prev, { _key: uid(), year: new Date().getFullYear(), title: '', role: '', type: 'feature' }]);
  }
  function removeCredit(key: string) { setCredits(prev => prev.filter(c => c._key !== key)); }
  function updateCredit(key: string, field: keyof Credit, value: string | number) {
    setCredits(prev => prev.map(c => c._key === key ? { ...c, [field]: value } : c));
  }

  function addRecognition() { setRecognition(prev => [...prev, { _key: uid(), year: new Date().getFullYear(), award: '' }]); }
  function removeRecognition(key: string) { setRecognition(prev => prev.filter(r => r._key !== key)); }
  function updateRecognition(key: string, field: 'year' | 'award', value: string | number) {
    setRecognition(prev => prev.map(r => r._key === key ? { ...r, [field]: value } : r));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError('');

    const payload = {
      tagline,
      bio,
      avatar_url: avatarUrl,
      cover_url: coverUrl,
      cover_backdrop: coverBackdrop,
      logo_backdrop: logoBackdrop,
      website,
      location_city: locationCity,
      country,
      credits: credits.map(({ _key, ...rest }) => rest),
      ...(isBusiness ? {
        company_name: companyName,
        company_tagline: tagline,
        company_description: bio,
        company_logo_url: avatarUrl,
        company_founded_year: companyFoundedYear ? parseInt(companyFoundedYear) : null,
        company_specialisms: companySpecialisms.split(',').map(s => s.trim()).filter(Boolean),
        company_looking_for: companyLookingFor,
        recognition: recognition.map(({ _key, ...rest }) => rest),
      } : {
        availability,
        disciplines: disciplines.split(',').map(s => s.trim()).filter(Boolean),
        languages: languages.split(',').map(s => s.trim()).filter(Boolean),
        travel_willingness: travelWillingness,
        guilds,
        reel_url: reelUrl,
      }),
    };

    const res = await fetch('/api/members/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'Save failed. Try again.');
      setSaving(false);
    } else {
      setSaved(true);
      setTimeout(() => router.push(`/members/${member.username}`), 800);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', paddingBottom: '80px' }}>

      {/* Sticky top bar */}
      <div style={{
        position: 'sticky', top: '64px', zIndex: 20,
        background: 'var(--surface)', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href={`/members/${member.username}`} style={{ fontSize: '13px', color: 'rgba(250,250,250,0.45)', textDecoration: 'none' }}>
            ← {member.tier === 'business' ? (member.company_name ?? member.full_name) : member.full_name}
          </Link>
          <span style={{ fontSize: '13px', color: 'rgba(250,250,250,0.2)' }}>/</span>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Edit profile</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '13px', color: '#86efac' }}>Saved ✓</span>}
          {error && <span style={{ fontSize: '13px', color: '#fca5a5' }}>{error}</span>}
          <Link
            href={`/members/${member.username}`}
            style={{
              padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(250,250,250,0.6)', textDecoration: 'none',
            }}
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
              background: saving ? 'rgba(59,130,246,0.5)' : '#3b82f6',
              color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '48px' }}>

        {/* ── Identity ── */}
        <div>
          <div className="section-rule section-rule-accent" />
          <p style={sectionHeadStyle}>Identity</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Username (your public URL — not editable)</label>
              <div style={{ ...inputStyle, color: 'rgba(250,250,250,0.3)', cursor: 'default' }}>
                film-resource-africa.com/members/<strong style={{ color: 'rgba(250,250,250,0.5)' }}>{member.username}</strong>
              </div>
            </div>
            {isBusiness && (
              <div>
                <label style={labelStyle}>Company name</label>
                <input style={inputStyle} value={companyName} onChange={e => setCompanyName(e.target.value)} />
              </div>
            )}
            <div>
              <label style={labelStyle}>{isBusiness ? 'Company tagline' : 'Tagline'}</label>
              <input style={inputStyle} value={tagline} onChange={e => setTagline(e.target.value)} placeholder="One line, shown under your name" />
            </div>
            {!isBusiness && (
              <div>
                <label style={labelStyle}>Availability</label>
                <select style={{ ...inputStyle }} value={availability} onChange={e => setAvailability(e.target.value as 'available' | 'busy' | 'selective')}>
                  <option value="available">Available for work</option>
                  <option value="selective">Selective engagements</option>
                  <option value="busy">Currently unavailable</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── Images ── */}
        <div>
          <div className="section-rule section-rule-muted" />
          <p style={sectionHeadStyle}>Images</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <ImageUpload
                label={isBusiness ? 'Logo' : 'Headshot'}
                value={avatarUrl}
                onChange={setAvatarUrl}
                shape={isBusiness ? 'rect' : 'circle'}
              />
              <BackdropToggle
                label={isBusiness ? 'Logo backdrop' : 'Headshot backdrop'}
                hint="Place the image on a light card. Use this if your logo is dark or transparent and disappears on the page background."
                checked={logoBackdrop}
                onChange={setLogoBackdrop}
              />
            </div>
            <div>
              <ImageUpload
                label="Cover image"
                hint="— optional, 1600×440"
                value={coverUrl}
                onChange={setCoverUrl}
                shape="wide"
              />
              <BackdropToggle
                label="Banner backdrop"
                hint="Place the banner on a light card. Use this if your banner is a dark logo or wordmark on a transparent background."
                checked={coverBackdrop}
                onChange={setCoverBackdrop}
              />
            </div>
          </div>
        </div>

        {/* ── Bio / About ── */}
        <div>
          <div className="section-rule section-rule-accent" />
          <p style={sectionHeadStyle}>{isBusiness ? 'About the company' : 'Bio'}</p>
          <textarea
            style={{ ...inputStyle, minHeight: '180px', resize: 'vertical', lineHeight: 1.6 }}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Separate paragraphs with a blank line."
          />
        </div>

        {/* ── Skills & Info (individual) ── */}
        {!isBusiness && (
          <div>
            <div className="section-rule section-rule-primary" />
            <p style={sectionHeadStyle}>Skills &amp; info</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Disciplines / Roles <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(250,250,250,0.25)' }}>— comma-separated</span></label>
                <input style={inputStyle} value={disciplines} onChange={e => setDisciplines(e.target.value)} placeholder="Writer, Director, Producer" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input style={inputStyle} value={locationCity} onChange={e => setLocationCity(e.target.value)} placeholder="Nairobi" />
                </div>
                <div>
                  <label style={labelStyle}>Country</label>
                  <input style={inputStyle} value={country} onChange={e => setCountry(e.target.value)} placeholder="Kenya" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Languages <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(250,250,250,0.25)' }}>— comma-separated</span></label>
                <input style={inputStyle} value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English, Swahili, Zulu" />
              </div>
              <div>
                <label style={labelStyle}>Travel</label>
                <input style={inputStyle} value={travelWillingness} onChange={e => setTravelWillingness(e.target.value)} placeholder="Open · East & West Africa" />
              </div>
              <div>
                <label style={labelStyle}>Guilds / Associations</label>
                <input style={inputStyle} value={guilds} onChange={e => setGuilds(e.target.value)} placeholder="WGSA, DGNSA…" />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input style={inputStyle} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" />
              </div>
              <div>
                <label style={labelStyle}>Reel URL <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(250,250,250,0.25)' }}>— paste a YouTube, Vimeo or Google Drive link</span></label>
                <input style={inputStyle} value={reelUrl} onChange={e => setReelUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=… , https://vimeo.com/… , or https://drive.google.com/file/d/…" />
              </div>
            </div>
          </div>
        )}

        {/* ── Business info ── */}
        {isBusiness && (
          <div>
            <div className="section-rule section-rule-accent" />
            <p style={sectionHeadStyle}>Company info</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input style={inputStyle} value={locationCity} onChange={e => setLocationCity(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Country</label>
                  <input style={inputStyle} value={country} onChange={e => setCountry(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Founded year</label>
                  <input style={inputStyle} type="number" value={companyFoundedYear} onChange={e => setCompanyFoundedYear(e.target.value)} placeholder="2017" />
                </div>
                <div>
                  <label style={labelStyle}>Website</label>
                  <input style={inputStyle} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://…" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Specialisms <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(250,250,250,0.25)' }}>— comma-separated</span></label>
                <input style={inputStyle} value={companySpecialisms} onChange={e => setCompanySpecialisms(e.target.value)} placeholder="Drama, Documentary, Long-form series" />
              </div>
              <div>
                <label style={labelStyle}>Currently looking for</label>
                <input style={inputStyle} value={companyLookingFor} onChange={e => setCompanyLookingFor(e.target.value)} placeholder="Writers, DoPs, Co-production partners" />
              </div>
            </div>
          </div>
        )}

        {/* ── Credits ── */}
        <div>
          <div className="section-rule section-rule-muted" />
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ ...sectionHeadStyle, margin: 0 }}>Credits</p>
            <button
              onClick={addCredit}
              style={{ fontSize: '13px', fontWeight: 600, color: '#93c5fd', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
            >
              + Add credit
            </button>
          </div>
          {credits.length === 0 && (
            <p style={{ fontSize: '14px', color: 'rgba(250,250,250,0.3)', marginBottom: '12px' }}>No credits yet. Add your first one.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {credits.map(credit => (
              <div key={credit._key} style={{
                padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)',
                background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr auto', gap: '10px', alignItems: 'start' }}>
                  <div>
                    <label style={labelStyle}>Year</label>
                    <input style={inputStyle} type="number" value={credit.year} onChange={e => updateCredit(credit._key, 'year', parseInt(e.target.value))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Title</label>
                    <input style={inputStyle} value={credit.title} onChange={e => updateCredit(credit._key, 'title', e.target.value)} placeholder="Project title" />
                  </div>
                  <div>
                    <label style={labelStyle}>Your role</label>
                    <input style={inputStyle} value={credit.role} onChange={e => updateCredit(credit._key, 'role', e.target.value)} placeholder="Writer, Director…" />
                  </div>
                  <div>
                    <label style={labelStyle}>Type</label>
                    <select style={inputStyle} value={credit.type} onChange={e => updateCredit(credit._key, 'type', e.target.value)}>
                      <option value="feature">Feature</option>
                      <option value="series">Series</option>
                      <option value="short">Short</option>
                      <option value="doc">Doc</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>IMDb URL <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(250,250,250,0.25)' }}>— optional</span></label>
                    <input style={inputStyle} value={credit.imdb_url ?? ''} onChange={e => updateCredit(credit._key, 'imdb_url', e.target.value)} placeholder="https://imdb.com/title/…" />
                  </div>
                  <div>
                    <label style={labelStyle}>Trailer URL <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(250,250,250,0.25)' }}>— optional</span></label>
                    <input style={inputStyle} value={credit.trailer_url ?? ''} onChange={e => updateCredit(credit._key, 'trailer_url', e.target.value)} placeholder="https://…" />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => removeCredit(credit._key)} style={{ fontSize: '12px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recognition (business only) ── */}
        {isBusiness && (
          <div>
            <div className="section-rule section-rule-muted" />
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ ...sectionHeadStyle, margin: 0 }}>Recognition &amp; awards</p>
              <button onClick={addRecognition} style={{ fontSize: '13px', fontWeight: 600, color: '#fcd34d', background: 'none', border: 'none', cursor: 'pointer' }}>
                + Add award
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recognition.map(r => (
                <div key={r._key} style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: '10px', alignItems: 'end' }}>
                  <div>
                    <label style={labelStyle}>Year</label>
                    <input style={inputStyle} type="number" value={r.year} onChange={e => updateRecognition(r._key, 'year', parseInt(e.target.value))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Award / recognition</label>
                    <input style={inputStyle} value={r.award} onChange={e => updateRecognition(r._key, 'award', e.target.value)} placeholder="FESPACO — Étalon de Bronze" />
                  </div>
                  <button onClick={() => removeRecognition(r._key)} style={{ height: '42px', fontSize: '12px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', paddingBottom: '2px' }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom save */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {error && <span style={{ fontSize: '13px', color: '#fca5a5', alignSelf: 'center' }}>{error}</span>}
          <Link href={`/members/${member.username}`} style={{
            padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(250,250,250,0.6)', textDecoration: 'none',
          }}>Cancel</Link>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
              background: saving ? 'rgba(59,130,246,0.5)' : '#3b82f6',
              color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
          </button>
        </div>

      </div>
    </main>
  );
}

function BackdropToggle({
  label, hint, checked, onChange,
}: {
  label: string; hint: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px',
      marginTop: '10px', padding: '10px 12px',
      borderRadius: '10px', background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <span style={{ display: 'block', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(250,250,250,0.85)' }}>{label}</span>
        <span style={{ display: 'block', fontSize: '11px', color: 'rgba(250,250,250,0.45)', marginTop: '2px' }}>{hint}</span>
      </span>
      <select
        value={checked ? 'light' : 'off'}
        onChange={e => onChange(e.target.value === 'light')}
        style={{
          padding: '7px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
          border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.04)',
          color: 'var(--foreground)', fontFamily: 'inherit', cursor: 'pointer',
        }}
      >
        <option value="off">Off</option>
        <option value="light">Light backdrop</option>
      </select>
    </div>
  );
}
