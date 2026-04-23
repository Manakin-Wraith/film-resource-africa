'use client';

import { useState } from 'react';
import { Send, CheckCircle2, Bell } from 'lucide-react';
import { trackNewsletterSignup } from '@/lib/analytics';

interface NewsletterCTAProps {
  variant?: 'hero' | 'inline' | 'banner';
  heading?: string;
  subtext?: string;
}

export default function NewsletterCTA({ 
  variant = 'inline',
  heading = "Don't miss the next opportunity",
  subtext = "Get weekly deadline alerts and new funding announcements."
}: NewsletterCTAProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Unknown error');
      }
      setSubscribed(true);
      setEmail('');
      trackNewsletterSignup(variant, typeof window !== 'undefined' ? window.location.pathname : '/');
      setTimeout(() => setSubscribed(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Subscription failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (variant === 'hero') {
    return (
      <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto w-full">
        <div className="relative flex-grow">
          <Bell size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
          <input
            type="email"
            required
            placeholder="Get weekly deadline alerts..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-foreground/40"
          />
        </div>
        <button
          disabled={submitting || subscribed}
          type="submit"
          className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg whitespace-nowrap ${
            subscribed
              ? 'bg-green-500 text-white'
              : 'bg-primary hover:bg-blue-600 text-white shadow-primary/30 hover:-translate-y-0.5'
          }`}
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : subscribed ? (
            <><CheckCircle2 size={20} /> Subscribed!</>
          ) : (
            <><Send size={18} /> Subscribe</>
          )}
        </button>
        {error && <p className="text-red-400 text-xs text-center sm:text-left">{error}</p>}
      </form>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="rounded-xl p-6 md:p-8 border border-white/[0.08]" style={{ background: 'var(--surface)' }}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-grow">
            <h3 className="text-[20px] md:text-[24px] font-bold font-heading mb-1 text-foreground">{heading}</h3>
            <p className="text-[14px]" style={{ color: 'var(--foreground-secondary)' }}>{subtext}</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex gap-2.5 w-full md:w-auto flex-shrink-0">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-grow md:w-56 border border-white/[0.12] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors text-foreground placeholder:text-foreground/30"
              style={{ background: 'var(--surface-raised)' }}
            />
            <button
              disabled={submitting || subscribed}
              type="submit"
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
                subscribed ? 'bg-success text-white' : 'bg-primary hover:bg-blue-600 text-white'
              }`}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : subscribed ? (
                <CheckCircle2 size={16} />
              ) : (
                <Send size={15} />
              )}
            </button>
          </form>
        </div>
        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
        {subscribed && <p className="text-sm mt-3 font-medium" style={{ color: 'var(--color-success)' }}>Welcome aboard! Check your inbox.</p>}
      </div>
    );
  }

  return null;
}
