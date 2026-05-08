import Link from 'next/link';
import { MemberProfile, Credit, Recognition } from './page';
import { toAbsoluteUrl, looksLikeImageUrl } from '@/lib/mediaUrls';

function memberNumber(id: string) {
  return id.replace(/-/g, '').slice(0, 4).toUpperCase();
}

function joinedYear(joinedAt: string) {
  return new Date(joinedAt).getFullYear();
}

function CreditRow({ credit }: { credit: Credit }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: '16px', alignItems: 'baseline',
      padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '13px', color: '#f59e0b', letterSpacing: '0.04em' }}>{credit.year}</div>
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px' }}>{credit.title}</div>
        <div style={{ fontSize: '13px', color: 'rgba(250,250,250,0.55)', marginTop: '2px' }}>{credit.role}</div>
      </div>
      <span style={{
        display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.08)', fontSize: '11px', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'rgba(250,250,250,0.55)', background: 'rgba(255,255,255,0.02)', whiteSpace: 'nowrap',
      }}>
        {credit.type === 'feature' ? 'Feature' : credit.type === 'series' ? 'Series' : credit.type === 'doc' ? 'Doc' : credit.type}
      </span>
    </div>
  );
}

export default function BusinessProfile({ member, isOwner, isLoggedIn }: { member: MemberProfile; isOwner: boolean; isLoggedIn: boolean }) {
  const credits: Credit[] = Array.isArray(member.credits) ? member.credits : [];
  const recognition: Recognition[] = Array.isArray(member.recognition) ? member.recognition : [];
  const logoSrc = looksLikeImageUrl(member.company_logo_url) ? toAbsoluteUrl(member.company_logo_url) : null;
  const coverSrc = looksLikeImageUrl(member.cover_url) ? toAbsoluteUrl(member.cover_url) : null;
  const specialisms = member.company_specialisms ?? [];
  const companyName = member.company_name ?? member.full_name;
  const mailSubject = encodeURIComponent(`Inbound via FRA — ${companyName}`);
  const contactEmail = member.email;

  return (
    <>
      {/* Owner edit bar */}
      {isOwner && (
        <div style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.04)' }}>
          <span style={{ fontSize: '12px', color: 'rgba(250,250,250,0.4)', fontFamily: 'var(--font-mono, monospace)' }}>
            Viewing your profile
          </span>
          <a
            href={`/members/${member.username}/edit`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
              color: '#fcd34d', textDecoration: 'none',
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
        <span style={{ color: 'var(--foreground)' }}>{companyName}</span>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Optional cover */}
        {coverSrc && (
          <div style={{ marginBottom: '-64px' }}>
            <div style={{ height: '220px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <img src={coverSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        )}

        {/* Business banner */}
        <section style={{
          position: 'relative', zIndex: 1,
          background: 'linear-gradient(180deg, rgba(245,158,11,0.06), transparent 60%), var(--surface)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '28px',
          display: 'grid', gridTemplateColumns: '96px 1fr auto', gap: '24px', alignItems: 'center',
          marginTop: coverSrc ? 0 : '0',
        }}
          className="biz-band"
        >
          {/* Logo */}
          <div style={{
            width: '96px', height: '96px', borderRadius: '12px', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.16)', background: 'var(--surface-raised)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {logoSrc
              ? <img src={logoSrc} alt={companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '32px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'rgba(250,250,250,0.15)' }}>
                  {companyName.charAt(0)}
                </span>
            }
          </div>

          {/* Name + description + pills */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'rgba(250,250,250,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Business member · No. {memberNumber(member.id)}
              {member.company_founded_year ? ` · Founded ${member.company_founded_year}` : ''}
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '38px', marginTop: '6px' }}>
              {companyName}
            </h1>
            {member.company_tagline && (
              <div style={{ fontSize: '14px', color: 'rgba(250,250,250,0.55)', marginTop: '4px' }}>
                {member.company_tagline}
              </div>
            )}
            {specialisms.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '8px',
                  border: '1px solid rgba(34,197,94,0.25)', fontSize: '11px', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.06em', color: '#86efac', background: 'rgba(34,197,94,0.10)',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: '#22c55e', display: 'inline-block' }} />
                  Open to projects
                </span>
                {specialisms.map((s, i) => (
                  <span key={i} style={{
                    display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)', fontSize: '11px', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(250,250,250,0.55)', background: 'rgba(255,255,255,0.02)',
                  }}>{s}</span>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
            <a
              href={`mailto:${contactEmail}?cc=hello@film-resource-africa.com&subject=${mailSubject}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                height: '52px', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
                background: '#3b82f6', color: '#fff', textDecoration: 'none',
              }}
            >
              ✉ Contact {companyName.split(' ')[0]}
            </a>
            {member.website && (
              <a
                href={member.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '44px', borderRadius: '12px', fontWeight: 600, fontSize: '14px',
                  border: '1px solid rgba(255,255,255,0.16)', color: 'var(--foreground)', textDecoration: 'none',
                  background: 'transparent',
                }}
              >
                ↗ {member.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </section>

        {/* Stat strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
          marginTop: '24px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden',
        }}
          className="stat-strip"
        >
          {[
            { num: member.productions_count ?? credits.length, lbl: 'Productions' },
            { num: joinedYear(new Date().toISOString()) - joinedYear(member.joined_at) || '< 1', lbl: 'Years active' },
            { num: recognition.length || '—', lbl: 'Awards' },
            { num: member.company_founded_year ? joinedYear(new Date().toISOString()) - member.company_founded_year : '—', lbl: 'Years founded' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '18px 20px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              background: 'var(--surface)',
            }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '28px' }}>{s.num}</div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(250,250,250,0.35)', marginTop: '4px' }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Body: two-col */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '56px', alignItems: 'start', marginTop: '40px' }}
          className="member-two-col"
        >
          {/* Main */}
          <div>
            {/* About */}
            {member.company_description && (
              <div>
                <div className="section-rule section-rule-accent" />
                <div className="section-rubric">About the company</div>
                <div style={{ fontSize: '15px', lineHeight: 1.6, color: 'rgba(250,250,250,0.55)' }}
                  dangerouslySetInnerHTML={{ __html: member.company_description.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>') }}
                />
              </div>
            )}

            {/* Credits */}
            {credits.length > 0 && (
              <div style={{ marginTop: '48px' }}>
                <div className="section-rule section-rule-muted" />
                <div className="section-rubric">Selected credits</div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '30px', marginBottom: '18px', lineHeight: '1.08' }}>
                  Past work
                </h2>
                {credits.map((c, i) => <CreditRow key={i} credit={c} />)}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }} />
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
                Pitch &amp; partnership
              </div>
              <a
                href={`mailto:${contactEmail}?cc=hello@film-resource-africa.com&subject=${mailSubject}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  height: '52px', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
                  background: '#3b82f6', color: '#fff', textDecoration: 'none', width: '100%',
                }}
              >
                ✉ Contact {companyName.split(' ')[0]}
              </a>
              <p style={{ fontSize: '12px', color: 'rgba(250,250,250,0.35)', marginTop: '8px', lineHeight: 1.5 }}>
                CC'd to FRA so we can flag promising leads. Replies in ~3 working days.
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

            {/* Company facts */}
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', marginBottom: '10px' }}>Company facts</div>
              {[
                member.location_city || member.country
                  ? { label: 'Headquarters', value: [member.location_city, member.country].filter(Boolean).join(', ') }
                  : null,
                member.company_founded_year
                  ? { label: 'Founded', value: String(member.company_founded_year) }
                  : null,
                specialisms.length
                  ? { label: 'Specialism', value: specialisms.join(' · ') }
                  : null,
                member.languages?.length
                  ? { label: 'Co-pro languages', value: member.languages.join(' · ') }
                  : null,
                member.company_looking_for
                  ? { label: 'Currently looking for', value: member.company_looking_for }
                  : null,
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={{ padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(250,250,250,0.35)' }}>{row!.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>{row!.value}</div>
                </div>
              ))}
            </div>

            {/* Recognition */}
            {recognition.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', marginBottom: '10px' }}>Recognition</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recognition.map((r, i) => (
                    <li key={i} style={{ fontSize: '13px' }}>
                      <span style={{ color: '#f59e0b', fontFamily: 'var(--font-mono, monospace)' }}>{r.year}</span>
                      &nbsp;&nbsp;{r.award}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .biz-band        { grid-template-columns: 1fr !important; }
          .stat-strip      { grid-template-columns: repeat(2, 1fr) !important; }
          .member-two-col  { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </>
  );
}
