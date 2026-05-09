'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/app/members/_components/ImageUpload';

const MOU_TEXT = `MEMORANDUM OF UNDERSTANDING
Film Resource Africa (FRA) — Individual Member Agreement

This Memorandum of Understanding ("MOU") is entered into between Film Resource Africa ("FRA") and the individual identified as a member ("Member").

1. REPRESENTATION & COMMISSION
FRA agrees to represent the Member's work to potential funders, broadcasters, and industry partners. In return, the Member agrees that for any placement directly facilitated by FRA, FRA will receive a commission of 10% of the gross placement value.

2. SCOPE
This MOU covers placement of the Member's creative work (scripts, projects, participation in productions) where FRA has made the introduction or facilitated the deal. It does not apply to deals the Member initiates independently.

3. FOUNDING MEMBER PRICING
Members who join during the founding period (first 100 members) will have their membership rate locked for life at the rate applicable at the time of joining.

4. DIRECTORY LISTING
FRA will build and maintain a directory listing for the Member based on information provided during onboarding. The Member is responsible for keeping their profile information current and accurate.

5. CONDUCT
Members agree to represent FRA's values of professionalism, integrity, and the advancement of African filmmaking. FRA reserves the right to suspend or terminate membership for conduct that is harmful to the organisation or its members.

6. TERM & TERMINATION
This MOU remains in effect while the Member's subscription is active. Either party may terminate with 30 days written notice. FRA's commission rights survive termination for placements introduced during the active membership period.

7. GOVERNING LAW
This MOU is governed by the laws of the Republic of South Africa.

By accepting below, the Member agrees to the terms of this MOU.`;

type Props = {
  memberId: string;
  token: string;
  fullName: string;
  email: string;
  tier: 'individual' | 'business';
  companyName: string | null;
};

type FormData = {
  username: string;
  tagline: string;
  bio: string;
  avatar_url: string;
  cover_url: string;
  availability: string;
  disciplines: string;
  languages: string;
  travel_willingness: string;
  guilds: string;
  reel_url: string;
  website: string;
  location_city: string;
  country: string;
  // business
  company_name: string;
  company_tagline: string;
  company_description: string;
  company_founded_year: string;
  company_specialisms: string;
  company_looking_for: string;
  company_logo_url: string;
};

export default function OnboardingClient({ memberId, token, fullName, email, tier, companyName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(tier === 'individual' ? 1 : 2);
  const [mouAccepted, setMouAccepted] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const defaultUsername = fullName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const [form, setForm] = useState<FormData>({
    username: defaultUsername,
    tagline: '',
    bio: '',
    avatar_url: '',
    cover_url: '',
    availability: 'available',
    disciplines: '',
    languages: '',
    travel_willingness: '',
    guilds: '',
    reel_url: '',
    website: '',
    location_city: '',
    country: '',
    company_name: companyName ?? '',
    company_tagline: '',
    company_description: '',
    company_founded_year: '',
    company_specialisms: '',
    company_looking_for: '',
    company_logo_url: '',
  });

  /* Tracks which fields were populated from a directory_listings prefill
   * (Item 4, 2026-05-08 sprint). Pill clears as soon as the user edits. */
  const [prefilled, setPrefilled] = useState<Partial<Record<keyof FormData, boolean>>>({});

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (prefilled[field]) {
      setPrefilled(prev => ({ ...prev, [field]: false }));
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/members/onboarding/prefill?token=${encodeURIComponent(token)}`);
        if (!res.ok) return;
        const json = await res.json();
        const p = json.prefill;
        if (!p || cancelled) return;
        setForm(prev => {
          /* Only fill empty fields — never overwrite anything the user has typed. */
          const next = { ...prev };
          const filled: Partial<Record<keyof FormData, boolean>> = {};
          const logoField: keyof FormData = tier === 'business' ? 'company_logo_url' : 'avatar_url';
          if (p.logo_url && !next[logoField]) { next[logoField] = p.logo_url; filled[logoField] = true; }
          if (p.bio && tier === 'individual' && !next.bio) { next.bio = p.bio; filled.bio = true; }
          if (p.bio && tier === 'business' && !next.company_description) { next.company_description = p.bio; filled.company_description = true; }
          if (p.country && !next.country) { next.country = p.country; filled.country = true; }
          if (p.city && !next.location_city) { next.location_city = p.city; filled.location_city = true; }
          if (p.website && !next.website) { next.website = p.website; filled.website = true; }
          setPrefilled(filled);
          return next;
        });
      } catch {
        /* Prefill is best-effort — silent failure is fine. */
      }
    })();
    return () => { cancelled = true; };
  }, [token, tier]);

  async function checkUsername(val: string) {
    if (!val || val.length < 3) { setUsernameAvailable(null); return; }
    setCheckingUsername(true);
    const res = await fetch(`/api/members/check-username?username=${encodeURIComponent(val)}&memberId=${memberId}`);
    const json = await res.json();
    setUsernameAvailable(json.available);
    setCheckingUsername(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/members/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, mouAccepted, ...form }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Submission failed');
      router.push(`/members/${form.username}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const PrefillPill = ({ field }: { field: keyof FormData }) => prefilled[field] ? (
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
  ) : null;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
    color: 'var(--foreground)', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: 'rgba(250,250,250,0.5)', marginBottom: '6px',
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 0' }}>
        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'rgba(250,250,250,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Film Resource Africa
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(28px, 5vw, 42px)', lineHeight: 1.05, margin: '0 0 8px' }}>
          Welcome, {fullName.split(' ')[0]}.
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(250,250,250,0.55)', margin: '0 0 32px' }}>
          {tier === 'individual'
            ? "Let's get your profile set up. First, review and accept your membership agreement."
            : "Let's set up your company profile."}
        </p>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
          {(tier === 'individual' ? [1, 2] : [2]).map((s) => (
            <div key={s} style={{
              flex: 1, height: '3px', borderRadius: '999px',
              background: step >= s ? '#3b82f6' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── STEP 1: MOU (individual only) ── */}
        {step === 1 && tier === 'individual' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <div className="section-rule section-rule-accent" />
              <span className="section-rubric">Membership Agreement</span>
            </div>

            <div style={{
              background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px', padding: '24px', maxHeight: '360px', overflowY: 'auto',
              fontSize: '13px', lineHeight: 1.7, color: 'rgba(250,250,250,0.65)',
              fontFamily: 'var(--font-mono, monospace)', whiteSpace: 'pre-wrap',
            }}>
              {MOU_TEXT}
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '20px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={mouAccepted}
                onChange={e => setMouAccepted(e.target.checked)}
                style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: '#3b82f6', flexShrink: 0 }}
              />
              <span style={{ fontSize: '14px', color: 'rgba(250,250,250,0.75)', lineHeight: 1.5 }}>
                I have read and agree to the Film Resource Africa Membership Agreement.
                I understand the 10% commission applies to placements facilitated by FRA.
              </span>
            </label>

            <button
              onClick={() => setStep(2)}
              disabled={!mouAccepted}
              style={{
                marginTop: '24px', width: '100%', height: '52px', borderRadius: '12px',
                background: mouAccepted ? '#3b82f6' : 'rgba(59,130,246,0.3)',
                color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none',
                cursor: mouAccepted ? 'pointer' : 'not-allowed', transition: 'background 0.2s',
              }}
            >
              Accept &amp; continue →
            </button>
          </div>
        )}

        {/* ── STEP 2: Profile setup ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <div className="section-rule section-rule-primary" />
              <span className="section-rubric">Your profile</span>
            </div>

            {/* Username */}
            <div>
              <label style={labelStyle}>Username <span style={{ color: 'rgba(250,250,250,0.3)', textTransform: 'none', letterSpacing: 0 }}>— your public URL: film-resource-africa.com/members/<strong>{form.username || '…'}</strong></span></label>
              <input
                style={{ ...inputStyle, borderColor: usernameAvailable === false ? '#ef4444' : usernameAvailable === true ? '#22c55e' : 'rgba(255,255,255,0.12)' }}
                value={form.username}
                onChange={e => { set('username', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setUsernameAvailable(null); }}
                onBlur={e => checkUsername(e.target.value)}
                placeholder={defaultUsername}
              />
              {checkingUsername && <div style={{ fontSize: '12px', color: 'rgba(250,250,250,0.35)', marginTop: '4px' }}>Checking…</div>}
              {usernameAvailable === false && <div style={{ fontSize: '12px', color: '#f87171', marginTop: '4px' }}>Username taken — try another.</div>}
              {usernameAvailable === true && <div style={{ fontSize: '12px', color: '#86efac', marginTop: '4px' }}>Available ✓</div>}
            </div>

            {tier === 'business' && (
              <div>
                <label style={labelStyle}>Company name</label>
                <input style={inputStyle} value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Pamoja Pictures" />
              </div>
            )}

            <div>
              <label style={labelStyle}>{tier === 'business' ? 'Company tagline' : 'Tagline'} <span style={{ color: 'rgba(250,250,250,0.3)', textTransform: 'none', letterSpacing: 0 }}>— one line, shown under your name</span></label>
              <input style={inputStyle} value={form.tagline || form.company_tagline} onChange={e => { set('tagline', e.target.value); set('company_tagline', e.target.value); }} placeholder={tier === 'business' ? 'Independent production company — drama and documentary' : 'Nairobi-based screenwriter — East African stories'} />
            </div>

            <div>
              <label style={labelStyle}>{tier === 'business' ? 'About the company' : 'Bio'} <span style={{ color: 'rgba(250,250,250,0.3)', textTransform: 'none', letterSpacing: 0 }}>— 2–4 paragraphs, separate with a blank line</span><PrefillPill field={tier === 'business' ? 'company_description' : 'bio'} /></label>
              <textarea
                style={{ ...inputStyle, minHeight: '160px', resize: 'vertical' }}
                value={tier === 'business' ? form.company_description : form.bio}
                onChange={e => tier === 'business' ? set('company_description', e.target.value) : set('bio', e.target.value)}
                placeholder={tier === 'business' ? 'Tell the industry about your company, what you make, and who you want to work with.' : 'Tell the industry who you are, what you make, and what you are looking for.'}
              />
            </div>

            {tier === 'individual' && (
              <div>
                <label style={labelStyle}>Disciplines / Roles <span style={{ color: 'rgba(250,250,250,0.3)', textTransform: 'none', letterSpacing: 0 }}>— comma-separated (e.g. Writer, Director, Producer)</span></label>
                <input style={inputStyle} value={form.disciplines} onChange={e => set('disciplines', e.target.value)} placeholder="Writer, Showrunner, Script editor" />
              </div>
            )}

            {tier === 'business' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Founded year</label>
                    <input style={inputStyle} type="number" value={form.company_founded_year} onChange={e => set('company_founded_year', e.target.value)} placeholder="2017" />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Specialisms <span style={{ color: 'rgba(250,250,250,0.3)', textTransform: 'none', letterSpacing: 0 }}>— comma-separated</span></label>
                  <input style={inputStyle} value={form.company_specialisms} onChange={e => set('company_specialisms', e.target.value)} placeholder="Drama, Documentary, Long-form series" />
                </div>
                <div>
                  <label style={labelStyle}>Currently looking for</label>
                  <input style={inputStyle} value={form.company_looking_for} onChange={e => set('company_looking_for', e.target.value)} placeholder="Writers, DoPs, Co-production partners" />
                </div>
              </>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>City<PrefillPill field="location_city" /></label>
                <input style={inputStyle} value={form.location_city} onChange={e => set('location_city', e.target.value)} placeholder="Nairobi" />
              </div>
              <div>
                <label style={labelStyle}>Country<PrefillPill field="country" /></label>
                <input style={inputStyle} value={form.country} onChange={e => set('country', e.target.value)} placeholder="Kenya" />
              </div>
            </div>

            <ImageUpload
              label={tier === 'business' ? 'Logo' : 'Headshot'}
              value={tier === 'business' ? form.company_logo_url : form.avatar_url}
              onChange={url => tier === 'business' ? set('company_logo_url', url) : set('avatar_url', url)}
              shape={tier === 'business' ? 'rect' : 'circle'}
              uploadToken={token}
              prefilled={tier === 'business' ? prefilled.company_logo_url : prefilled.avatar_url}
            />

            <ImageUpload
              label="Cover image"
              hint="— optional, 1600×440"
              value={form.cover_url}
              onChange={url => set('cover_url', url)}
              shape="wide"
              uploadToken={token}
            />

            {tier === 'individual' && (
              <>
                <div>
                  <label style={labelStyle}>Availability</label>
                  <select style={{ ...inputStyle }} value={form.availability} onChange={e => set('availability', e.target.value)}>
                    <option value="available">Available for work</option>
                    <option value="selective">Selective engagements</option>
                    <option value="busy">Currently unavailable</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Languages <span style={{ color: 'rgba(250,250,250,0.3)', textTransform: 'none', letterSpacing: 0 }}>— comma-separated</span></label>
                  <input style={inputStyle} value={form.languages} onChange={e => set('languages', e.target.value)} placeholder="English, Swahili, Zulu" />
                </div>
                <div>
                  <label style={labelStyle}>Travel</label>
                  <input style={inputStyle} value={form.travel_willingness} onChange={e => set('travel_willingness', e.target.value)} placeholder="Open · East & West Africa" />
                </div>
                <div>
                  <label style={labelStyle}>Guilds / Associations</label>
                  <input style={inputStyle} value={form.guilds} onChange={e => set('guilds', e.target.value)} placeholder="WGSA, DGNSA…" />
                </div>
                <div>
                  <label style={labelStyle}>Reel URL <span style={{ color: 'rgba(250,250,250,0.3)', textTransform: 'none', letterSpacing: 0 }}>— paste a YouTube, Vimeo or Google Drive link (we&rsquo;ll convert it to embed)</span></label>
                  <input style={inputStyle} value={form.reel_url} onChange={e => set('reel_url', e.target.value)} placeholder="https://www.youtube.com/watch?v=… , https://vimeo.com/… , or https://drive.google.com/file/d/…" />
                </div>
              </>
            )}

            <div>
              <label style={labelStyle}>Website<PrefillPill field="website" /></label>
              <input style={inputStyle} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://yoursite.com" />
            </div>

            {error && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
              {tier === 'individual' && (
                <button
                  onClick={() => setStep(1)}
                  style={{
                    height: '52px', padding: '0 20px', borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.16)', background: 'transparent',
                    color: 'var(--foreground)', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting || usernameAvailable === false || !form.username}
                style={{
                  flex: 1, height: '52px', borderRadius: '12px',
                  background: submitting || usernameAvailable === false ? 'rgba(59,130,246,0.4)' : '#3b82f6',
                  color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
                }}
              >
                {submitting ? 'Saving…' : 'Launch my profile →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
