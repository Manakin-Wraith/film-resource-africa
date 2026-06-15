'use client';

import { useState } from 'react';
import { GraduationCap, Users, Camera, Film, Megaphone, Building2, Handshake, ArrowRight } from 'lucide-react';
import ContactModal from './ContactModal';
import type { InquiryType } from '@/app/actions';
import { cw, type Colorway } from '@/lib/colorways';

const partnerCategories: { icon: typeof GraduationCap; title: string; description: string; color: Colorway }[] = [
  {
    icon: GraduationCap,
    title: 'Film Schools',
    description: 'Training the next generation of African storytellers',
    color: 'blue',
  },
  {
    icon: Users,
    title: 'Crewing Agencies',
    description: 'Connecting productions with top local talent',
    color: 'green',
  },
  {
    icon: Camera,
    title: 'Gear Houses',
    description: 'Equipment rental and technical support',
    color: 'purple',
  },
  {
    icon: Film,
    title: 'Post-Production',
    description: 'Editing, VFX, colour grading, and sound',
    color: 'amber',
  },
  {
    icon: Megaphone,
    title: 'Distributors',
    description: 'Getting African stories to global audiences',
    color: 'red',
  },
  {
    icon: Building2,
    title: 'Studios & Locations',
    description: 'Production spaces and location services',
    color: 'teal',
  },
];

export default function PartnersSection() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [inquiryType, setInquiryType] = useState<InquiryType>('partner');

  const openModal = (type: InquiryType) => {
    setInquiryType(type);
    setIsContactOpen(true);
  };

  return (
    <>
      <section className="rounded-3xl border border-line p-6 md:p-10 -mx-4 md:mx-0" style={{ background: 'var(--surface)' }}>
        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-foreground/[0.04] border border-line text-xs font-medium text-foreground/60 uppercase tracking-widest">
            <Handshake size={14} className="text-primary" />
            Ecosystem
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-foreground">
            Our Partners & Industry Network
          </h2>
          <p className="text-foreground/50 text-sm max-w-lg mx-auto">
            We&apos;re building a network of industry partners to support African filmmakers at every stage of production.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-10">
          {partnerCategories.map((cat) => {
            const colors = cw(cat.color);
            return (
              <div
                key={cat.title}
                className={`group relative rounded-2xl border ${colors.bg} p-5 md:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${colors.glow} cursor-default`}
              >
                <div className={`w-10 h-10 rounded-xl border ${colors.bg} flex items-center justify-center mb-3`}>
                  <cat.icon size={20} className={colors.text} />
                </div>
                <h3 className="font-semibold text-foreground text-sm md:text-base">{cat.title}</h3>
                <p className="text-foreground/50 text-xs mt-1 leading-relaxed hidden md:block">{cat.description}</p>
                {/* Coming soon badge */}
                <div className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest text-foreground/20">
                  Soon
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => openModal('partner')}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-7 rounded-2xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02]"
            >
              <Handshake size={18} />
              Become a Partner
              <ArrowRight size={16} />
            </button>
            <span className="text-foreground/50 text-xs">or</span>
            <button
              onClick={() => openModal('advertise')}
              className="inline-flex items-center gap-2 text-foreground/50 hover:text-foreground/80 text-sm transition-colors underline underline-offset-4 decoration-foreground/10 hover:decoration-foreground/30"
            >
              Advertise your services
            </button>
          </div>
          <p className="text-foreground/50 text-xs">
            Partner listings are coming soon. Get in early and be featured from day one.
          </p>
        </div>
      </section>

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        inquiryType={inquiryType}
      />
    </>
  );
}
