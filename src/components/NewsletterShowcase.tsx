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
      className={`w-full text-left rounded-2xl p-5 border transition-all duration-300 ${
        isActive
          ? `bg-gradient-to-br ${digest.gradient} ${digest.border} shadow-lg scale-[1.02]`
          : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/15'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl ${digest.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className={digest.iconColor} />
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-base">{digest.title}</h4>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${digest.badge}`}>
              {digest.frequency}
            </span>
          </div>
          <p className="text-foreground/50 text-sm leading-relaxed">{digest.description}</p>
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
    <section className="relative rounded-3xl bg-gradient-to-b from-primary/[0.06] via-accent/[0.03] to-transparent border border-white/10 p-8 md:p-12 -mx-4 md:mx-0 overflow-hidden">
      {/* Background effects */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Mail size={16} />
            Free — No spam, unsubscribe anytime
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">
            Never Miss an Opportunity
          </h2>
          <p className="text-foreground/50 text-lg max-w-2xl mx-auto">
            Subscribe to get <strong className="text-foreground/80">three curated newsletters</strong> designed
            to keep African filmmakers ahead of every deadline, trend, and opportunity.
          </p>
        </div>

        {/* Two-column layout: digest selector + email mockup */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* Left: digest cards */}
          <div className="space-y-3">
            {digests.map((d, i) => (
              <EmailPreviewCard
                key={d.id}
                digest={d}
                isActive={activeDigest === i}
                onClick={() => setActiveDigest(i)}
              />
            ))}
          </div>

          {/* Right: live email mockup */}
          <div className="flex items-center">
            <div className="w-full transform md:rotate-1 md:hover:rotate-0 transition-transform duration-500">
              <EmailMockup digest={digests[activeDigest]} />
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-8 py-4 border-y border-white/5">
          {[
            { value: '2,400+', label: 'Subscribers' },
            { value: '150+', label: 'Opportunities tracked' },
            { value: '48', label: 'Countries reached' },
            { value: '100%', label: 'Free forever' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl md:text-2xl font-bold font-heading text-primary">{stat.value}</p>
              <p className="text-xs text-foreground/40 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Subscribe form */}
        <form onSubmit={handleSubscribe} className="max-w-xl mx-auto">
          <div className="flex gap-3">
            <div className="relative flex-grow">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-foreground/30"
              />
            </div>
            <button
              disabled={submitting || subscribed}
              type="submit"
              className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg whitespace-nowrap ${
                subscribed
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white shadow-primary/30 hover:-translate-y-0.5'
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
          </div>
          {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
          {subscribed && <p className="text-green-400 text-sm mt-3 text-center font-medium">🎉 Welcome aboard! Check your inbox for a confirmation.</p>}
        </form>
      </div>
    </section>
  );
}
