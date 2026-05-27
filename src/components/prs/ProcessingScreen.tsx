'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, RefreshCw } from 'lucide-react';

const AMBIENT = [
  { who: 'Tlhokomelo M., Pretoria', what: 'submitted a short doc · scored 24 min ago' },
  { who: 'Adaeze O., Lagos', what: 'is reading her diagnosis' },
  { who: 'Khaya M., Cape Town', what: 'running fresh diagnosis on a Realness Lab submission' },
  { who: 'Realness Institute Series Lab', what: 'deadline 12 Aug 2026 · applications open' },
  { who: 'FRA scanner', what: 'indexed 4 new opportunities this morning' },
];

export default function ProcessingScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const [tick, setTick] = useState(0);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  // Rotate ambient tile.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2400);
    return () => clearInterval(id);
  }, []);

  // Kick off scoring once, then poll status until scored.
  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    let cancelled = false;

    async function run() {
      // Fire scoring (idempotent server-side).
      fetch('/api/assess/score', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).catch(() => {});

      // Poll status.
      for (let i = 0; i < 120 && !cancelled; i++) {
        await new Promise((r) => setTimeout(r, 2500));
        try {
          const res = await fetch(`/api/assess/status?token=${token}`);
          const data = await res.json();
          if (data.status === 'scored') { router.push(`/p/${token}`); return; }
          if (data.status === 'failed') { setFailed(true); return; }
        } catch { /* keep polling */ }
      }
    }

    run();
    return () => { cancelled = true; };
  }, [token, router]);

  if (!token) {
    return (
      <div className="prs-root">
        <div className="prs-container prs-intake-shell">
          <div className="processing-shell">
            <p className="prs-prose-secondary">No assessment in progress. <a className="prs-link-primary" href="/assess">Start one →</a></p>
          </div>
        </div>
      </div>
    );
  }

  const item = AMBIENT[tick % AMBIENT.length];

  return (
    <div className="prs-root">
      <div className="prs-container prs-intake-shell">
        <div className="processing-shell">
          {!failed ? (
            <>
              <div className="processing-spinner" />
              <div className="section-rubric" style={{ marginBottom: 12 }}>Scoring · ~2 min</div>
              <h2 className="intake-section-title" style={{ fontSize: 28, maxWidth: '28rem', margin: '0 auto 16px' }}>
                We&rsquo;re reading what you wrote.
              </h2>
              <p className="prs-prose-secondary" style={{ maxWidth: '44ch', margin: '0 auto 56px' }}>
                The diagnosis takes about two minutes. We don&rsquo;t autofill or score live — it&rsquo;s a real read
                of your intake against the SA funding landscape.
              </p>

              <div className="prs-panel" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'left', background: 'var(--surface-raised)' }}>
                <div className="section-rubric">While you wait · happening on FRA right now</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingTop: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--green)', marginTop: 8 }} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>{item.who}</div>
                    <div style={{ fontSize: 13, color: 'var(--foreground-secondary)', marginTop: 2 }}>{item.what}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="section-rubric" style={{ marginBottom: 12 }}>Something went wrong</div>
              <h2 className="intake-section-title" style={{ fontSize: 26, maxWidth: '30rem', margin: '0 auto 16px' }}>
                We couldn&rsquo;t complete your diagnosis.
              </h2>
              <p className="prs-prose-secondary" style={{ maxWidth: '44ch', margin: '0 auto 32px' }}>
                This is on us, not you. Your answers are saved — no need to fill anything in again. Retry the scoring,
                or contact FRA and we&rsquo;ll score it by hand.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => window.location.reload()} className="prs-btn-primary">
                  Retry scoring <RefreshCw size={14} />
                </button>
                <a href="/assess" className="prs-btn-ghost">Start over <ArrowRight size={14} /></a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
