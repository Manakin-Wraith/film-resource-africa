import Link from 'next/link';
import { MemberProfile, Credit } from './page';
import { toAbsoluteUrl, toEmbedUrl, looksLikeImageUrl } from '@/lib/mediaUrls';

const AVAILABILITY_LABEL: Record<string, string> = {
  available: 'Available for work',
  busy: 'Currently unavailable',
  selective: 'Selective engagements',
};

const AVAILABILITY_COLOR: Record<string, string> = {
  available: '#22c55e',
  busy: '#ef4444',
  selective: '#f59e0b',
};

const CREDIT_TYPE_LABEL: Record<string, string> = {
  feature: 'Feature',
  series: 'Series',
  short: 'Short',
  doc: 'Doc',
  other: 'Other',
};

function memberNumber(id: string) {
  return id.replace(/-/g, '').slice(0, 4).toUpperCase();
}

function joinedYear(joinedAt: string) {
  return new Date(joinedAt).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
}

function CreditRow({ credit }: { credit: Credit }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '56px 1fr auto',
      gap: '16px',
      alignItems: 'baseline',
      padding: '14px 0',
      borderTop: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '13px', color: '#f59e0b', letterSpacing: '0.04em' }}>
        {credit.year}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px' }}>{credit.title}</div>
        <div style={{ fontSize: '13px', color: 'rgba(250,250,250,0.55)', marginTop: '2px' }}>{credit.role}</div>
        {(credit.imdb_url || credit.trailer_url || credit.other_url) && (
          <div style={{ fontSize: '12px', marginTop: '4px', display: 'flex', gap: '12px' }}>
            {credit.imdb_url && <a href={credit.imdb_url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(250,250,250,0.55)', borderBottom: '1px dashed rgba(255,255,255,0.16)' }}>IMDb ↗</a>}
            {credit.trailer_url && <a href={credit.trailer_url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(250,250,250,0.55)', borderBottom: '1px dashed rgba(255,255,255,0.16)' }}>Trailer ↗</a>}
            {credit.other_url && <a href={credit.other_url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(250,250,250,0.55)', borderBottom: '1px dashed rgba(255,255,255,0.16)' }}>Link ↗</a>}
          </div>
        )}
      </div>
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '5px 10px', borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.08)',
        fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'rgba(250,250,250,0.55)',
        background: 'rgba(255,255,255,0.02)',
        whiteSpace: 'nowrap',
      }}>
        {CREDIT_TYPE_LABEL[credit.type] ?? credit.type}
      </span>
    </div>
  );
}

export default function IndividualProfile({ member, isOwner, isLoggedIn }: { member: MemberProfile; isOwner: boolean; isLoggedIn: boolean }) {
  const availability = member.availability ?? 'available';
  const dotColor = AVAILABILITY_COLOR[availability] ?? '#22c55e';
  const mailSubject = encodeURIComponent(`Inbound — ${member.full_name} (via FRA)`);
  const mailBody = encodeURIComponent(`I'd like to get in touch with ${member.full_name} about ...`);
  const credits: Credit[] = Array.isArray(member.credits) ? member.credits : [];
  const avatarSrc = looksLikeImageUrl(member.avatar_url) ? toAbsoluteUrl(member.avatar_url) : null;
  const coverSrc = looksLikeImageUrl(member.cover_url) ? toAbsoluteUrl(member.cover_url) : null;
  const reelEmbed = toEmbedUrl(member.reel_url);

  return (
    <>
      {/* Pulse animation */}
      <style>{`
        @keyframes fra-pulse {
          0%   { box-shadow: 0 0 0 0 ${dotColor}80; }
          70%  { box-shadow: 0 0 0 8px ${dotColor}00; }
          100% { box-shadow: 0 0 0 0 ${dotColor}00; }
        }
        .fra-pulse-dot { animation: fra-pulse 2s infinite; }
      `}</style>

      {/* Owner edit bar */}
      {isOwner && (
        <div style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(59,130,246,0.15)', background: 'rgba(59,130,246,0.06)' }}>
          <span style={{ fontSize: '12px', color: 'rgba(250,250,250,0.4)', fontFamily: 'var(--font-mono, monospace)' }}>
            Viewing your profile
          </span>
          <a
            href={`/members/${member.username}/edit`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
              background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
              color: '#93c5fd', textDecoration: 'none',
            }}
          >
            ✏ Edit profile
          </a>
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ padding: '14px 24px', fontSize: '13px', color: 'rgba(250,250,250,0.55)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link href="/" style={{ color: 'inherit' }}>Home</Link>
        {' / '}
        <Link href={isLoggedIn ? '/members/directory' : '/members'} style={{ color: 'inherit' }}>Members</Link>
        {' / '}
        <span style={{ color: 'var(--foreground)' }}>{member.full_name}</span>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Cover (optional) */}
        {coverSrc ? (
          <div style={{ marginBottom: '-64px', position: 'relative' }}>
            <div style={{
              height: '220px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden', position: 'relative',
            }}>
              <img src={coverSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        ) : null}

        {/* Masthead */}
        <section style={{
          position: 'relative', zIndex: 1,
          padding: '24px 28px',
          background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px',
          display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: '28px', alignItems: 'end',
          marginTop: member.cover_url ? 0 : '32px',
        }}
          className="member-masthead"
        >
          {/* Avatar */}
          <div style={{
            width: '160px', height: '160px', borderRadius: '16px', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.16)', background: 'var(--surface-raised)', flexShrink: 0,
          }}>
            {avatarSrc
              ? <img src={avatarSrc} alt={member.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'rgba(250,250,250,0.1)' }}>
                  {member.full_name.charAt(0)}
                </div>
            }
          </div>

          {/* Name + tagline + pills */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'rgba(250,250,250,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Member · No. {memberNumber(member.id)} · Joined {joinedYear(member.joined_at)}
              {member.founding_member_lock && ' · Founding'}
            </div>
            <h1 style={{
              fontFamily: 'var(--font-heading)', fontWeight: 800,
              fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: '0.96', letterSpacing: '-0.02em',
              margin: '8px 0 10px',
            }}>
              {member.full_name.split(' ').map((w, i) => (
                <span key={i}>{w}{i < member.full_name.split(' ').length - 1 ? <br /> : null}</span>
              ))}
              {'.'}
            </h1>
            {member.tagline && (
              <p style={{ fontSize: '17px', color: 'rgba(250,250,250,0.55)', maxWidth: '580px', lineHeight: 1.4, fontStyle: 'italic', margin: '0 0 14px' }}>
                {member.tagline}
              </p>
            )}
            {member.disciplines && member.disciplines.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {member.disciplines.map((d, i) => (
                  <span key={i} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '5px 10px', borderRadius: '8px',
                    border: '1px solid rgba(59,130,246,0.25)', fontSize: '11px', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: '#93c5fd', background: 'rgba(59,130,246,0.10)',
                  }}>{d}</span>
                ))}
              </div>
            )}
          </div>

          {/* Quick facts */}
          <aside style={{ textAlign: 'right', minWidth: '200px' }}>
            {[
              {
                label: 'Status',
                value: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                    <span className="fra-pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '999px', background: dotColor, display: 'inline-block' }} />
                    {AVAILABILITY_LABEL[availability]}
                  </span>
                ),
              },
              member.location_city || member.country
                ? { label: 'Based in', value: [member.location_city, member.country].filter(Boolean).join(', ') }
                : null,
              { label: 'Tier', value: 'Individual member' },
            ].filter(Boolean).map((row, i) => (
              <div key={i} style={{ padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(250,250,250,0.35)' }}>{row!.label}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>{row!.value}</div>
              </div>
            ))}
          </aside>
        </section>

        {/* Body: two-col */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '56px', alignItems: 'start', marginTop: '40px' }}
          className="member-two-col"
        >
          {/* Main column */}
          <div>
            {/* Bio */}
            {member.bio && (
              <div>
                <div className="section-rule section-rule-accent" />
                <div className="section-rubric" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>The Work</span>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px' }}>— Bio</span>
                </div>
                <div style={{
                  fontSize: '15px', lineHeight: 1.6, color: 'rgba(250,250,250,0.55)',
                  columnCount: 2, columnGap: '32px',
                }}
                  className="member-bio"
                  dangerouslySetInnerHTML={{ __html: member.bio.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>') }}
                />
              </div>
            )}

            {/* Credits */}
            {credits.length > 0 && (
              <div style={{ marginTop: '48px' }}>
                <div className="section-rule section-rule-muted" />
                <div className="section-rubric" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Filmography · {credits.length} credit{credits.length !== 1 ? 's' : ''}</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '30px', marginBottom: '18px', lineHeight: '1.08' }}>
                  Selected credits
                </h2>
                <div>
                  {credits.slice(0, 6).map((c, i) => <CreditRow key={i} credit={c} />)}
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
              </div>
            )}

            {/* Reel */}
            {reelEmbed && (
              <div style={{ marginTop: '48px' }}>
                <div className="section-rule section-rule-primary" />
                <div className="section-rubric">Reel</div>
                <div style={{
                  borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)',
                  aspectRatio: '16/9', position: 'relative',
                }}>
                  <iframe
                    src={reelEmbed}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          {/* Side rail */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '88px' }}>
            {/* Contact */}
            <div style={{
              background: 'linear-gradient(180deg, rgba(59,130,246,0.10), transparent 70%), var(--surface)',
              border: '1px solid rgba(59,130,246,0.25)', borderRadius: '16px', padding: '18px',
            }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', marginBottom: '10px' }}>
                Get in touch
              </div>
              <a
                href={`mailto:hello@film-resource-africa.com?subject=${mailSubject}&body=${mailBody}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  height: '52px', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
                  background: '#3b82f6', color: '#fff', textDecoration: 'none',
                  width: '100%',
                }}
              >
                ✉ Contact via FRA
              </a>
              <p style={{ fontSize: '12px', color: 'rgba(250,250,250,0.35)', marginTop: '8px', lineHeight: 1.5 }}>
                Your message reaches FRA first — we pass it on to {member.full_name.split(' ')[0]} within 24 hours.
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button style={{
                  flex: 1, height: '40px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.16)',
                  background: 'transparent', color: 'var(--foreground)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}>★ Save</button>
                <button style={{
                  flex: 1, height: '40px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.16)',
                  background: 'transparent', color: 'var(--foreground)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}>↗ Share</button>
              </div>
            </div>

            {/* Fast facts */}
            {(member.languages?.length || member.travel_willingness || member.guilds) && (
              <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', marginBottom: '10px' }}>Fast facts</div>
                {[
                  member.languages?.length ? { label: 'Languages', value: member.languages.join(' · ') } : null,
                  member.travel_willingness ? { label: 'Travel', value: member.travel_willingness } : null,
                  member.guilds ? { label: 'Guilds', value: member.guilds } : null,
                  member.website ? { label: 'Web', value: <a href={member.website} target="_blank" rel="noopener noreferrer" style={{ color: '#93c5fd' }}>{member.website.replace(/^https?:\/\//, '')}</a> } : null,
                ].filter(Boolean).map((row, i) => (
                  <div key={i} style={{ padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(250,250,250,0.35)' }}>{row!.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>{row!.value}</div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 900px) {
          .member-masthead { grid-template-columns: 1fr !important; }
          .member-two-col  { grid-template-columns: 1fr !important; gap: 32px !important; }
          .member-bio      { column-count: 1 !important; }
        }
      `}</style>
    </>
  );
}
