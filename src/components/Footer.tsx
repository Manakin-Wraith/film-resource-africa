'use client';

import { useState } from 'react';
import { Mail, Twitter, Linkedin, Send, CheckCircle2, Megaphone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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
      <footer className="relative z-20 border-t border-white/[0.08] py-12 pb-24 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 items-start text-center md:text-left">

            {/* Branding */}
            <div className="space-y-5">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="w-9 h-9 rounded-xl border border-white/[0.12] overflow-hidden p-1.5 flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-raised)' }}>
                  <Image
                    src="/icon.png"
                    alt="Film Resource Africa"
                    width={28}
                    height={28}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-heading font-bold text-[17px] tracking-tight text-foreground">
                  Film Resource Africa
                </span>
              </div>
              <p className="text-[13px] max-w-xs mx-auto md:mx-0 leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
                Connecting African storytellers with global opportunities and resources.
              </p>
              <div className="flex flex-col items-center md:items-start gap-2">
                <button
                  onClick={() => { setInquiryType('advertise'); setIsContactOpen(true); }}
                  className="inline-flex items-center gap-2 text-white text-sm font-semibold py-2.5 px-5 bg-primary hover:bg-blue-600 rounded-xl transition-colors"
                >
                  <Megaphone size={15} />
                  Advertise With Us
                </button>
                <button
                  onClick={() => { setInquiryType('general'); setIsContactOpen(true); }}
                  className="inline-flex items-center gap-1.5 text-sm transition-colors"
                  style={{ color: 'var(--foreground-tertiary)' }}
                >
                  <Mail size={12} />
                  Send us a message
                </button>
              </div>
            </div>

            {/* Newsletter */}
            <div className="space-y-4 md:px-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-tertiary)' }}>Stay Updated</p>
                <p className="text-[13px]" style={{ color: 'var(--foreground-secondary)' }}>Join our newsletter for the latest industry news.</p>
              </div>
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-white/[0.12] rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-primary/50 transition-colors text-foreground placeholder:text-foreground/30"
                    style={{ background: 'var(--surface-raised)' }}
                  />
                  <button
                    disabled={submitting || subscribed}
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary hover:bg-blue-600 disabled:bg-success text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : subscribed ? (
                      <CheckCircle2 size={15} />
                    ) : (
                      <Send size={14} />
                    )}
                  </button>
                </div>
                {error && <p className="text-red-400 text-[11px]">{error}</p>}
                {subscribed && <p className="text-[11px] font-medium" style={{ color: 'var(--color-success)' }}>Successfully subscribed!</p>}
              </form>
            </div>

            {/* Quick Links */}
            <div className="hidden md:block space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--foreground-tertiary)' }}>Explore</p>
              <nav className="flex flex-col gap-1.5 text-[13px]">
                <Link href="/" className="transition-colors hover:text-foreground" style={{ color: 'var(--foreground-secondary)' }}>Opportunities</Link>
                <Link href="/news" className="transition-colors hover:text-foreground" style={{ color: 'var(--foreground-secondary)' }}>News & Insights</Link>
                <Link href="/call-sheet" className="transition-colors hover:text-foreground" style={{ color: 'var(--foreground-secondary)' }}>The Call Sheet</Link>
                <Link href="/industry" className="transition-colors hover:text-foreground" style={{ color: 'var(--foreground-secondary)' }}>Industry Directory</Link>
                <Link href="/film-opportunities" className="transition-colors hover:text-foreground" style={{ color: 'var(--foreground-secondary)' }}>By Country</Link>
                <Link href="/submit" className="transition-colors hover:text-foreground" style={{ color: 'var(--foreground-secondary)' }}>Submit an Opportunity</Link>
              </nav>
            </div>

            {/* Social + Copyright */}
            <div className="flex flex-col items-center md:items-end gap-6">
              <div className="flex gap-3">
                {[
                  { icon: Twitter, href: 'https://x.com/film_resource_', label: 'X' },
                  { icon: Linkedin, href: '#', label: 'LinkedIn' },
                ].map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    aria-label={s.label}
                    className="w-10 h-10 rounded-xl border border-white/[0.1] flex items-center justify-center transition-colors hover:border-white/[0.2] hover:text-foreground"
                    style={{ background: 'var(--surface-raised)', color: 'var(--foreground-secondary)' }}
                  >
                    <s.icon size={18} />
                  </a>
                ))}
              </div>
              <div className="text-center md:text-right space-y-1">
                <p className="text-[11px] font-medium" style={{ color: 'var(--foreground-tertiary)' }}>
                  Made with passion in Africa 🌍
                </p>
                <p className="text-[11px]" style={{ color: 'var(--foreground-tertiary)' }}>
                  © {new Date().getFullYear()} Film Resource Africa
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
