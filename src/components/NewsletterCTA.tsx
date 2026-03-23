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
      <div className="glass-card rounded-[2rem] p-8 md:p-10 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-grow text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-bold font-heading mb-2">{heading}</h3>
            <p className="text-foreground/60">{subtext}</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex gap-3 w-full md:w-auto flex-shrink-0">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-grow md:w-64 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-foreground/30"
            />
            <button
              disabled={submitting || subscribed}
              type="submit"
              className={`px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg whitespace-nowrap ${
                subscribed
                  ? 'bg-green-500 text-white'
                  : 'bg-accent hover:bg-amber-600 text-white shadow-accent/30 hover:-translate-y-0.5'
              }`}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : subscribed ? (
                <CheckCircle2 size={20} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </div>
        {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
        {subscribed && <p className="text-green-400 text-xs mt-2 text-center">Welcome aboard! Check your inbox.</p>}
      </div>
    );
  }

  return null;
}
