'use client';

import { useState } from 'react';
import { Send, CheckCircle2, Mail, Flame, Users, Calendar, TrendingUp, Star, ChevronRight } from 'lucide-react';
import { trackNewsletterSignup } from '@/lib/analytics';

const digests = [
  {
    id: 'weekly',
    title: 'Weekly Digest',
    frequency: 'Every Monday',
    description: 'Curated roundup of the best opportunities, upcoming deadlines, and must-know industry news.',
    icon: Calendar,
    color: 'blue',
    gradient: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/20',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300',
    preview: {
      subject: 'FRA Weekly: 12 New Opportunities + 3 Closing This Week',
      items: [
        { type: 'deadline', text: 'Durban FilmMart — closes in 3 days', urgent: true },
        { type: 'new', text: '5 new grants for African documentaries' },
        { type: 'news', text: 'TIFF announces African cinema showcase' },
        { type: 'tip', text: 'How to write a winning festival submission' },
      ],
    },
  },
  {
    id: 'hotnews',
    title: 'Hot News Alerts',
    frequency: 'As it breaks',
    description: 'Breaking industry news, major festival announcements, and time-sensitive deadline alerts.',
    icon: Flame,
    color: 'amber',
    gradient: 'from-amber-500/20 to-orange-600/5',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300',
    preview: {
      subject: '🔥 Breaking: Cannes Announces Africa Selection + New Fund',
      items: [
        { type: 'breaking', text: 'Cannes 2026 selects 4 African films', urgent: true },
        { type: 'fund', text: 'New $2M fund for Sub-Saharan filmmakers' },
        { type: 'alert', text: 'Netflix Africa commissioning deadline extended' },
      ],
    },
  },
  {
    id: 'spotlight',
    title: 'Community Spotlight',
    frequency: 'Bi-weekly',
    description: 'Celebrating African filmmakers, success stories, interviews, and creative showcases from the community.',
    icon: Users,
    color: 'purple',
    gradient: 'from-purple-500/20 to-pink-600/5',
    border: 'border-purple-500/20',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300',
    preview: {
      subject: 'Spotlight: How Wanjiku Landed Her First Netflix Deal',
      items: [
        { type: 'story', text: 'From Nairobi shorts to streaming — Wanjiku\'s journey' },
        { type: 'interview', text: 'Q&A with Durban Film Festival programmer' },
        { type: 'community', text: '3 filmmakers share their festival tips' },
      ],
    },
  },
];

function EmailPreviewCard({ digest, isActive, onClick }: { digest: typeof digests[0]; isActive: boolean; onClick: () => void }) {
  const Icon = digest.icon;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl p-4 border transition-all ${
        isActive
          ? 'border-white/[0.2] bg-white/[0.04]'
          : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]'
      }`}
      style={isActive ? { background: 'var(--surface-raised)' } : undefined}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${digest.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Icon size={15} className={digest.iconColor} />
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-bold text-[14px] text-foreground">{digest.title}</h4>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--foreground-tertiary)' }}>
              {digest.frequency}
            </span>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>{digest.description}</p>
        </div>
      </div>
    </button>
  );
}

function EmailMockup({ digest }: { digest: typeof digests[0] }) {
  const typeIcons: Record<string, { icon: typeof Mail; color: string }> = {
    deadline: { icon: Calendar, color: 'text-red-400' },
    new: { icon: Star, color: 'text-blue-400' },
    news: { icon: TrendingUp, color: 'text-amber-400' },
    tip: { icon: ChevronRight, color: 'text-green-400' },
    breaking: { icon: Flame, color: 'text-orange-400' },
    fund: { icon: Star, color: 'text-green-400' },
    alert: { icon: Calendar, color: 'text-yellow-400' },
    story: { icon: Users, color: 'text-purple-400' },
    interview: { icon: Mail, color: 'text-pink-400' },
    community: { icon: Users, color: 'text-indigo-400' },
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#111] shadow-2xl">
      {/* Email header bar */}
      <div className="px-5 py-3 bg-white/[0.04] border-b border-white/10 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[11px] text-foreground/30 font-mono">Inbox</span>
      </div>

      {/* Email meta */}
      <div className="px-5 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[10px] font-bold">
            FRA
          </div>
          <div>
            <p className="text-xs font-medium">Film Resource Africa</p>
            <p className="text-[10px] text-foreground/30">newsletter@filmresourceafrica.com</p>
          </div>
        </div>
        <p className="text-sm font-semibold leading-snug">{digest.preview.subject}</p>
      </div>

      {/* Email body preview */}
      <div className="p-5 space-y-3">
        {digest.preview.items.map((item, i) => {
          const typeInfo = typeIcons[item.type] || { icon: ChevronRight, color: 'text-foreground/40' };
          const ItemIcon = typeInfo.icon;
          return (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${item.urgent ? 'bg-red-500/10 border border-red-500/15' : 'bg-white/[0.03]'}`}>
              <ItemIcon size={14} className={`${typeInfo.color} mt-0.5 flex-shrink-0`} />
              <span className={`text-sm ${item.urgent ? 'text-foreground/90 font-medium' : 'text-foreground/60'}`}>
                {item.text}
              </span>
            </div>
          );
        })}

        {/* Fade out effect */}
        <div className="h-8 bg-gradient-to-b from-transparent to-[#111] -mx-5 -mb-5" />
      </div>
    </div>
  );
}

export default function NewsletterShowcase() {
  const [activeDigest, setActiveDigest] = useState(0);
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
      trackNewsletterSignup('showcase', typeof window !== 'undefined' ? window.location.pathname : '/');
      setTimeout(() => setSubscribed(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Subscription failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      {/* Editorial header */}
      <div className="section-rule section-rule-primary" />
      <span className="section-rubric">Newsletter</span>
      <div className="flex items-baseline justify-between mb-6 md:mb-8">
        <h2 className="text-[26px] md:text-[34px] font-bold font-heading leading-tight text-foreground">
          Never Miss an Opportunity
        </h2>
        <span className="text-sm font-medium ml-4 flex-shrink-0" style={{ color: 'var(--foreground-tertiary)' }}>
          Free — no spam
        </span>
      </div>

      {/* Two-column: digest selector + email mockup */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-2">
          <p className="text-[14px] mb-4" style={{ color: 'var(--foreground-secondary)' }}>
            Three curated newsletters to keep African filmmakers ahead of every deadline, trend, and opportunity.
          </p>
          {digests.map((d, i) => (
            <EmailPreviewCard
              key={d.id}
              digest={d}
              isActive={activeDigest === i}
              onClick={() => setActiveDigest(i)}
            />
          ))}
        </div>
        <div className="flex items-center">
          <div className="w-full">
            <EmailMockup digest={digests[activeDigest]} />
          </div>
        </div>
      </div>

      {/* Subscribe form */}
      <form onSubmit={handleSubscribe} className="max-w-xl">
        <div className="flex gap-3">
          <div className="relative flex-grow">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--foreground-tertiary)' }} />
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-white/[0.12] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors text-foreground placeholder:text-foreground/30 min-h-[48px]"
              style={{ background: 'var(--surface-raised)' }}
            />
          </div>
          <button
            disabled={submitting || subscribed}
            type="submit"
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap min-h-[48px] ${
              subscribed ? 'bg-success text-white' : 'bg-primary hover:bg-blue-600 text-white'
            }`}
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : subscribed ? (
              <><CheckCircle2 size={16} /> Subscribed!</>
            ) : (
              <><Send size={15} /> Subscribe</>
            )}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        {subscribed && <p className="text-sm mt-2 font-medium" style={{ color: 'var(--color-success)' }}>Welcome aboard! Check your inbox for a confirmation.</p>}
      </form>
    </section>
  );
}
