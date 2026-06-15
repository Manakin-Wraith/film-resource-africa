'use client';

import { useState } from 'react';
import { Mail, Twitter, Linkedin, Send, CheckCircle2, Megaphone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ContactModal from './ContactModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { InquiryType } from '@/app/actions';
import { navGroups, footerExtras } from '@/lib/navConfig';

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
      <footer className="relative z-20 py-12 pb-24 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 items-start text-center md:text-left">

            {/* Branding */}
            <div className="space-y-5">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="w-9 h-9 rounded-xl border border-line-mid overflow-hidden p-1.5 flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-raised)' }}>
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
                <Button
                  onClick={() => { setInquiryType('advertise'); setIsContactOpen(true); }}
                  leftIcon={Megaphone}
                >
                  Advertise With Us
                </Button>
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
                  <Input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-12"
                    error={error ?? undefined}
                  />
                  <button
                    disabled={submitting || subscribed}
                    type="submit"
                    aria-label="Subscribe"
                    className="absolute right-2 top-[22px] -translate-y-1/2 w-8 h-8 bg-primary hover:bg-primary-hover disabled:bg-success text-white rounded-lg transition-colors flex items-center justify-center"
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
                {subscribed && <p className="text-xs font-medium text-success">Successfully subscribed!</p>}
              </form>
            </div>

            {/* Quick Links */}
            <div className="hidden md:block space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--foreground-tertiary)' }}>Explore</p>
              <nav className="flex flex-col gap-1.5 text-[13px]">
                {[...navGroups.map(({ href, label }) => ({ href, label })), ...footerExtras].map(({ href, label }) => (
                  <Link key={href} href={href} className="transition-colors hover:text-foreground" style={{ color: 'var(--foreground-secondary)' }}>
                    {label}
                  </Link>
                ))}
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
                    className="w-10 h-10 rounded-xl border border-line-mid flex items-center justify-center transition-colors hover:border-line-strong hover:text-foreground"
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
                <div className="flex items-center justify-center md:justify-end gap-3 pt-1">
                  <Link href="/terms" className="text-[11px] transition-colors hover:text-foreground" style={{ color: 'var(--foreground-tertiary)' }}>Terms</Link>
                  <span className="text-[11px]" style={{ color: 'var(--foreground-tertiary)' }}>·</span>
                  <Link href="/privacy" className="text-[11px] transition-colors hover:text-foreground" style={{ color: 'var(--foreground-tertiary)' }}>Privacy</Link>
                </div>
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
