'use client';

import { useState } from 'react';
import { Mail, Twitter, Linkedin, Instagram, Send, CheckCircle2, Megaphone } from 'lucide-react';
import Link from 'next/link';
import ContactModal from './ContactModal';
import type { InquiryType } from '@/app/actions';

export default function Footer() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [inquiryType, setInquiryType] = useState<InquiryType>('general');
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
      setTimeout(() => setSubscribed(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Subscription failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <footer className="relative z-20 border-t border-white/10 bg-black/40 backdrop-blur-xl py-12 pb-24 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 items-start text-center md:text-left">
            {/* Branding Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-center md:justify-start gap-4 text-primary">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden p-2 group-hover:scale-110 transition-transform shadow-lg backdrop-blur-md">
                  <img 
                    src="/icon.png" 
                    alt="Africa Favicon" 
                    className="w-full h-full object-contain filter brightness-110"
                  />
                </div>
                <span className="font-heading font-bold text-2xl tracking-tight text-white">
                  Film Resource Africa
                </span>
              </div>
              <p className="text-foreground/60 text-sm max-w-xs mx-auto md:mx-0 leading-relaxed">
                Connecting African storytellers with global opportunities and resources to bring their visions to life.
              </p>
              <div className="pt-2 flex flex-col items-center md:items-start gap-2">
                <button 
                  onClick={() => { setInquiryType('advertise'); setIsContactOpen(true); }}
                  className="inline-flex items-center gap-2 text-white hover:text-blue-100 transition-all font-semibold py-3 px-6 bg-primary hover:bg-blue-600 rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02]"
                >
                  <Megaphone size={18} />
                  <span>Advertise With Us</span>
                </button>
                <button 
                  onClick={() => { setInquiryType('general'); setIsContactOpen(true); }}
                  className="inline-flex items-center gap-1.5 text-foreground/40 hover:text-foreground/70 transition-colors text-xs"
                >
                  <Mail size={12} />
                  <span>or send us a message</span>
                </button>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="space-y-6 md:px-4">
              <div className="space-y-2">
                <h3 className="font-bold text-white uppercase tracking-widest text-xs">Stay Updated</h3>
                <p className="text-foreground/50 text-sm">Join our newsletter for the latest industry news.</p>
              </div>

              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="relative group">
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-foreground/30"
                  />
                  <button
                    disabled={submitting || subscribed}
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 px-4 bg-primary hover:bg-blue-600 disabled:bg-green-500/50 text-white rounded-xl transition-all flex items-center justify-center shadow-lg shadow-primary/20"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : subscribed ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
                {error && <p className="text-red-400 text-[10px] ml-2">{error}</p>}
                {subscribed && <p className="text-green-400 text-[10px] ml-2">Successfully subscribed! Welcome aboard.</p>}
              </form>
            </div>

            {/* Quick Links */}
            <div className="hidden md:block space-y-4">
              <h3 className="font-bold text-white uppercase tracking-widest text-xs">Explore</h3>
              <nav className="flex flex-col gap-2 text-sm">
                <Link href="/" className="text-foreground/50 hover:text-primary transition-colors">Opportunities</Link>
                <Link href="/news" className="text-foreground/50 hover:text-primary transition-colors">News & Insights</Link>
                <Link href="/call-sheet" className="text-foreground/50 hover:text-primary transition-colors">The Call Sheet</Link>
                <Link href="/industry" className="text-foreground/50 hover:text-primary transition-colors">Industry Directory</Link>
                <Link href="/film-opportunities" className="text-foreground/50 hover:text-primary transition-colors">Opportunities by Country</Link>
                <Link href="/submit" className="text-foreground/50 hover:text-primary transition-colors">Submit an Opportunity</Link>
              </nav>
            </div>

            {/* Social & Localization */}
            <div className="flex flex-col items-center md:items-end space-y-8">
              <div className="flex gap-4">
                {[
                  { icon: Twitter, href: "https://x.com/film_resource_", label: "X" },
                  { icon: Linkedin, href: "#", label: "LinkedIn" },
                ].map((s, i) => (
                  <a 
                    key={i} 
                    href={s.href} 
                    aria-label={s.label}
                    className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-foreground/70 hover:text-primary hover:border-primary/50 transition-all hover:-translate-y-1 shadow-sm"
                  >
                    <s.icon size={22} />
                  </a>
                ))}
              </div>
              <div className="text-center md:text-right space-y-2">
                <p className="text-foreground/40 text-xs font-medium uppercase tracking-widest flex items-center gap-2 justify-center md:justify-end">
                  Made with passion in Africa <span className="text-lg">🌍</span>
                </p>
                <p className="text-foreground/30 text-[10px]">
                  © {new Date().getFullYear()} African Film Opportunities Directory
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <ContactModal 
        isOpen={isContactOpen} 
        onClose={() => setIsContactOpen(false)}
        inquiryType={inquiryType}
      />
    </>
  );
}
