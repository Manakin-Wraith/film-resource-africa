'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import './tech-pulse.css';
import {
  CONTENT_READY,
  EPISODES,
  HOSTS,
  NEXT_EPISODE,
  SCHEDULE_BROADCAST,
  SCHEDULE_LIVEROOM,
  SCHEDULE_WEEKS,
  type Episode,
} from './episodes';

/** Where every "Join FRA" CTA points — the existing conversion page. */
const JOIN_HREF = '/members';
const SIGNIN_HREF = '/login';

const SHARE_PLATFORMS = ['YouTube', 'Apple Podcasts', 'Spotify', 'Overcast', 'RSS'];

export default function TechPulseClient() {
  const hasContent = CONTENT_READY && EPISODES.length > 0;
  const featured = hasContent ? EPISODES[0] : null;

  const [currentN, setCurrentN] = useState<string | null>(featured?.n ?? null);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const current = EPISODES.find((e) => e.n === currentN) ?? featured;

  function swapHero(n: string) {
    setCurrentN(n);
    setPlaying(false);
    heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function share(kind: string) {
    if (!current) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Tech-Pulse · Ep ${current.n} · ${current.title}`;
    if (kind === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* clipboard unavailable */
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      return;
    }
    const targets: Record<string, string> = {
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
    };
    window.open(targets[kind], '_blank', 'noopener');
  }

  const epTag = current
    ? `${current.featured ? '★ ' : ''}EP ${current.n} · ${current.date.toUpperCase()}${current.featured ? ' · EDITOR’S PICK' : ''}`
    : '';

  return (
    <div className="tp-root">
      <main className="tp-container">
        {/* ============ PAGE HEADER ============ */}
        <section className="page-header">
          <div className="section-rule muted" />
          <span className="section-rubric">Tech-Pulse · A weekly editorial podcast</span>
          <div className="ph-grid">
            <div>
              <h1 className="ph-headline">
                The signal<br />
                <em>in the noise.</em>
              </h1>
              <p className="ph-sub">
                Long conversations with the people building, breaking and betting on the new studio
                economy. New tape every Sunday, 18:00 WAT — watch live or catch the cut.
              </p>
            </div>
            <div className="ph-meta">
              <div className="count-pills">
                {hasContent ? (
                  <>
                    <span className="count-pill primary">
                      <span className="dot" />
                      <span className="n">14</span>&nbsp;episodes
                    </span>
                    <span className="count-pill accent">
                      <span className="dot" />
                      <span className="n">22</span>&nbsp;guests
                    </span>
                    <span className="count-pill">
                      <span className="n">since</span>&nbsp;Feb &apos;26
                    </span>
                  </>
                ) : (
                  <>
                    <span className="count-pill soon">
                      <span className="dot" />
                      <span className="n">Coming soon</span>
                    </span>
                    <span className="count-pill">
                      <span className="n">Pilot</span>&nbsp;season
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {hasContent && current ? (
          <>
            {/* ============ ON-AIR BAND ============ */}
            <div className="band">
              <span className="onair">
                <span className="pulse" />
                On air
              </span>
              <div className="now-title">
                <span className="nt">&ldquo;{current.title}&rdquo;</span>
                <span className="ep">
                  EP {current.n} · {current.dur.split(':')[0]} MIN
                </span>
              </div>
              <div className="next">
                <b>Next</b> · Ep {NEXT_EPISODE.n} · {NEXT_EPISODE.when}
              </div>
              <div className="channel">CH · Tech-Pulse</div>
            </div>

            {/* ============ HERO PLAYER ============ */}
            <section className="hero" ref={heroRef}>
              <div className="player-card">
                <div className="player-frame">
                  {playing ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${current.yt}?autoplay=1&rel=0`}
                      title={`Tech-Pulse Ep ${current.n}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      type="button"
                      className="player-poster"
                      aria-label={`Play episode ${current.n}`}
                      onClick={() => setPlaying(true)}
                    >
                      <div className="poster-overlay-top">
                        <div className="left">
                          <span className="ep-tag">{epTag}</span>
                          <div className="title-on-poster">&ldquo;{current.title}&rdquo;</div>
                        </div>
                        <div className="right">
                          Host · {current.host}
                          <br />
                          Producer · {current.producer}
                        </div>
                      </div>
                      <span className="play-btn" aria-hidden="true" />
                      <div className="poster-overlay-bottom">
                        <span>
                          Recorded {current.date} · {current.recorded} · {current.topic}
                        </span>
                        <span className="dur">{current.dur}</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* ============ EDITORIAL SPREAD ============ */}
            <section className="spread">
              <div className="col-quote">
                <div className="ep-line">
                  {current.featured && <span className="star">★</span>} Episode {current.n} ·{' '}
                  {current.date}
                  {current.featured ? ' · Editor’s pick' : ''}
                </div>
                <h2 className="title">{current.title}</h2>
                <blockquote className="pull-quote">
                  {current.pull}
                  <cite>{current.pullBy}</cite>
                </blockquote>
                <div
                  className="summary"
                  dangerouslySetInnerHTML={{
                    __html: current.summary.map((p) => `<p>${p}</p>`).join(''),
                  }}
                />

                {/* guests */}
                <div className="section-rule primary" style={{ marginTop: 32 }} />
                <span className="section-rubric" style={{ marginBottom: 14 }}>
                  On the call
                </span>
                <div className="guests">
                  {current.guests.map((g) => (
                    <div className="guest" key={g.name}>
                      <div className={`avatar${g.amber ? ' amber' : ''}`} />
                      <div className="info">
                        <div className="name">{g.name}</div>
                        <div className="role">{g.role}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* tags */}
                <div className="section-rule muted" style={{ marginTop: 28 }} />
                <span className="section-rubric">Filed under</span>
                <div className="tags">
                  {current.featured && <span className="tag editor">★ Editor’s pick</span>}
                  {current.tags.map((t) => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>

                {/* share */}
                <div className="section-rule muted" style={{ marginTop: 24 }} />
                <span className="section-rubric" style={{ marginBottom: 12 }}>
                  Share &amp; read
                </span>
                <div className="share-row">
                  <button className="share-btn" type="button" onClick={() => share('x')}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.5 3H21l-7.4 8.5L22 21h-6.6l-5.2-6.4L4.3 21H1l8-9.2L1.2 3h6.7l4.7 6.1L17.5 3zM16.3 19h1.9L7.8 5H5.8L16.3 19z" />
                    </svg>
                    X / Twitter
                  </button>
                  <button className="share-btn" type="button" onClick={() => share('linkedin')}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3A2 2 0 0 1 21 5v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14M8.34 18V9.86H5.67V18h2.67M7 8.65c.85 0 1.55-.7 1.55-1.55C8.55 6.25 7.85 5.55 7 5.55s-1.55.7-1.55 1.55c0 .85.7 1.55 1.55 1.55M18.34 18v-4.46c0-2.31-.5-4.07-3.19-4.07-1.29 0-2.16.7-2.51 1.36h-.04V9.86h-2.56V18h2.66v-4.03c0-1.07.2-2.1 1.52-2.1s1.34 1.22 1.34 2.17V18h2.78z" />
                    </svg>
                    LinkedIn
                  </button>
                  <button className="share-btn" type="button" onClick={() => share('email')}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                    Email
                  </button>
                  <button
                    className={`share-btn${copied ? ' copied' : ''}`}
                    type="button"
                    onClick={() => share('copy')}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z" />
                    </svg>
                    {copied ? 'Link copied' : 'Copy link'}
                  </button>
                  <a href="#transcript" className="transcript-link">
                    Read transcript
                  </a>
                </div>
              </div>

              {/* details column */}
              <div className="details">
                <div className="panel">
                  <h3>
                    Chapters <span className="count">{current.chapters.length}</span>
                  </h3>
                  <div>
                    {current.chapters.map((c) => (
                      <button
                        type="button"
                        className="chapter"
                        key={c.ts}
                        onClick={() => setPlaying(true)}
                      >
                        <span className="ts">{c.ts}</span>
                        <span className="ct">
                          {c.title}
                          {c.note && <small>{c.note}</small>}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <h3>Episode card</h3>
                  <EpisodeFacts ep={current} />
                </div>
              </div>
            </section>

            {/* ============ TV-GUIDE SCHEDULE ============ */}
            <section className="schedule-section">
              <div className="section-head">
                <div className="title-block">
                  <div className="section-rule muted" />
                  <span className="section-rubric">Weekly schedule</span>
                  <h2>The Tech-Pulse line-up.</h2>
                </div>
                <div className="lede">Sundays · 18:00 WAT &nbsp;·&nbsp; 7-week view</div>
              </div>

              <div className="schedule">
                <div className="schedule-grid">
                  <div className="head-cell">Slot</div>
                  {SCHEDULE_WEEKS.map((w) => (
                    <div className={`head-cell${w.current ? ' current' : ''}`} key={w.label}>
                      {w.label} · {w.date}
                    </div>
                  ))}

                  <div className="row-label">
                    <b>18:00</b>
                    <br />
                    Tech-Pulse
                  </div>
                  {SCHEDULE_BROADCAST.map((c) => (
                    <div className="cell" key={c.ep}>
                      <button
                        type="button"
                        className={`ep-block${c.now ? ' now' : ''}`}
                        onClick={() => swapHero(c.ep)}
                      >
                        <div className="epn">{c.epn}</div>
                        <div className="t">{c.title}</div>
                        <div className="g">{c.guest}</div>
                      </button>
                    </div>
                  ))}

                  <div className="row-label">
                    <b>19:30</b>
                    <br />
                    Live room*
                  </div>
                  {SCHEDULE_LIVEROOM.map((c, i) => (
                    <div className="cell" key={i}>
                      {c && (
                        <div className="ep-block upcoming">
                          <div className="epn">{c.epn}</div>
                          <div className="t">{c.title}</div>
                          <div className="g">{c.guest}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <p className="schedule-foot">
                * Live room is members-only. The 18:00 broadcast is public.{' '}
                <Link href={JOIN_HREF} style={{ color: 'var(--accent)' }}>
                  Join FRA to take part →
                </Link>
              </p>
            </section>

            {/* ============ ARCHIVE ============ */}
            <section className="archive">
              <div className="section-head">
                <div className="title-block">
                  <div className="section-rule primary" />
                  <span className="section-rubric">Back issues</span>
                  <h2>Every conversation, in order.</h2>
                </div>
                <div className="lede">{EPISODES.length} episodes · most recent first</div>
              </div>

              <div className="archive-grid">
                {(showAll ? EPISODES.slice(1) : EPISODES.slice(1, 5)).map((e) => (
                  <button
                    type="button"
                    className={`ep-card${e.n === currentN ? ' playing' : ''}`}
                    key={e.n}
                    onClick={() => swapHero(e.n)}
                  >
                    <div className="thumb">
                      <span className="epn">EP {e.n}</span>
                      <span className="mini-play" aria-hidden="true" />
                      <span className="now-playing-flag">Now playing</span>
                      <span className="dur">{e.dur}</span>
                    </div>
                    <div>
                      <div className="meta-line">
                        <span>{e.dateShort}</span>
                        <span className="topic">{e.topic}</span>
                      </div>
                      <h3>{e.title}</h3>
                      <p className="dek">{e.summary[0].replace(/<[^>]+>/g, '')}</p>
                      <div className="strap">
                        {e.guests.map((g) => (
                          <span key={g.name}>
                            {g.name}
                            <b style={{ marginLeft: 6, color: 'var(--foreground-secondary)' }}>
                              {g.role}
                            </b>
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {!showAll && EPISODES.length > 5 && (
                <div className="archive-foot">
                  <button className="load-more" type="button" onClick={() => setShowAll(true)}>
                    Load older episodes ↓
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          /* ============ CONTENT-NOT-READY STATE ============ */
          <>
            <div className="band band-soon">
              <span className="onair soon">
                <span className="pulse" />
                Off air
              </span>
              <div className="now-title">
                <span className="nt">Pilot season — recording now.</span>
                <span className="ep">EP 001 · DROPS SOON</span>
              </div>
              <div className="next">
                <b>Next</b> · Ep {NEXT_EPISODE.n} · {NEXT_EPISODE.when}
              </div>
              <div className="channel">CH · Tech-Pulse</div>
            </div>

            <section className="hero" ref={heroRef}>
              <div className="player-card">
                <div className="player-frame coming-soon-frame">
                  <div className="cs-grid" />
                  <div className="cs-content">
                    <span className="cs-kicker">Tech-Pulse · Pilot season</span>
                    <h2 className="cs-title">
                      Coming<br />
                      <em>soon.</em>
                    </h2>
                    <p className="cs-sub">
                      We&apos;re in the studio with the first batch of guests. New tape every Sunday
                      from launch — members get into the live room first.
                    </p>
                    <div className="cs-cta">
                      <Link href={JOIN_HREF} className="cta-btn amber">
                        Join FRA — get the first episode →
                      </Link>
                      <span className="member-hint">
                        Already a member? <Link href={SIGNIN_HREF}>Sign in</Link>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ============ MODULES ============ */}
        <section className="modules-section">
          <div className="modules">
            <article className="module">
              <h3>
                About the show{' '}
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--foreground-tertiary)',
                    fontSize: '10.5px',
                    letterSpacing: '.06em',
                  }}
                >
                  SINCE FEB 2026
                </span>
              </h3>
              <p className="big">A weekly editorial podcast from FRA.</p>
              <p>
                One long conversation a week with the people building, breaking and betting on the
                new studio economy. Recorded Sundays. 30 to 60 minutes. Watch on YouTube, listen
                anywhere.
              </p>
              <div className="hosts-row">
                {HOSTS.map((h) => (
                  <div className="host" key={h.name}>
                    <div className="avatar" />
                    <div>
                      <div className="hn">{h.name}</div>
                      <div className="hr">{h.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="module feature">
              <h3>Next on Tech-Pulse</h3>
              <p className="big">&ldquo;{NEXT_EPISODE.title}&rdquo;</p>
              <div className="next-strip">
                <div className="nthumb">
                  <span className="epn">EP {NEXT_EPISODE.n}</span>
                </div>
                <p style={{ fontSize: '13.5px' }}>{NEXT_EPISODE.blurb}</p>
              </div>
              <div className="when">{NEXT_EPISODE.when}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="cta-btn ghost" type="button">
                  Add to calendar
                </button>
                <button className="cta-btn ghost" type="button">
                  Remind me
                </button>
              </div>
            </article>

            {/* ★ THE KEY MEMBERS CTA — drives new sign-ups */}
            <article className="module cta">
              <h3>★ Members · live taping</h3>
              <p className="big">Be in the room when we record.</p>
              <p>
                FRA members join the live room every Sunday — ask questions on the line, stay for
                the unedited aftershow, and meet the guests in Discord after the tape stops.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <Link href={JOIN_HREF} className="cta-btn amber">
                  Join FRA →
                </Link>
                <span className="member-hint">
                  Already a member? <Link href={SIGNIN_HREF}>Sign in</Link>
                </span>
              </div>
            </article>
          </div>
        </section>

        {/* ============ SUBSCRIBE ============ */}
        <section className="subscribe" id="transcript">
          <div className="subscribe-row">
            <div>
              <span className="section-rubric">Subscribe</span>
              <p style={{ margin: '6px 0 0', color: 'var(--foreground-secondary)', fontSize: 15 }}>
                Catch every episode wherever you listen. New tape every Sunday.
              </p>
            </div>
            <div className="platforms">
              {SHARE_PLATFORMS.map((p) => (
                <a href="#" className="platform" key={p}>
                  {p}
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function EpisodeFacts({ ep }: { ep: Episode }) {
  const facts: [string, string][] = [
    ['Number', ep.n],
    ['Date', ep.date],
    ['Runtime', ep.dur],
    ['Recorded', ep.recorded],
    ['Host', ep.host],
    ['Producer', ep.producer],
  ];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14,
        fontFamily: 'var(--font-mono)',
        fontSize: '12.5px',
      }}
    >
      {facts.map(([label, val]) => (
        <div key={label}>
          <div
            style={{
              color: 'var(--foreground-tertiary)',
              fontSize: 10,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            {label}
          </div>
          <div style={{ color: 'var(--foreground)' }}>{val}</div>
        </div>
      ))}
    </div>
  );
}
