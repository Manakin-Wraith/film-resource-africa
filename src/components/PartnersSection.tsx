'use client';

import { useState } from 'react';
import { GraduationCap, Users, Camera, Film, Megaphone, Building2, Handshake, ArrowRight } from 'lucide-react';
import ContactModal from './ContactModal';
import type { InquiryType } from '@/app/actions';

const partnerCategories = [
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

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400',   glow: 'group-hover:shadow-blue-500/10' },
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400',  glow: 'group-hover:shadow-green-500/10' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', glow: 'group-hover:shadow-purple-500/10' },
  amber:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  text: 'text-amber-400',  glow: 'group-hover:shadow-amber-500/10' },
  red:    { bg: 'bg-red-500/10',    border: 'border-red-500/20',    text: 'text-red-400',    glow: 'group-hover:shadow-red-500/10' },
  teal:   { bg: 'bg-teal-500/10',   border: 'border-teal-500/20',   text: 'text-teal-400',   glow: 'group-hover:shadow-teal-500/10' },
};

export default function PartnersSection() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [inquiryType, setInquiryType] = useState<InquiryType>('partner');

  const openModal = (type: InquiryType) => {
    setInquiryType(type);
    setIsContactOpen(true);
  };

  return (
    <>
      <section className="relative rounded-3xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 p-6 md:p-10 -mx-4 md:mx-0 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 w-96 h-64 bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        {/* Header */}
        <div className="relative text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-foreground/60 uppercase tracking-widest">
            <Handshake size={14} className="text-primary" />
            Ecosystem
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-white">
            Our Partners & Industry Network
          </h2>
          <p className="text-foreground/50 text-sm max-w-lg mx-auto">
            We&apos;re building a network of industry partners to support African filmmakers at every stage of production.
          </p>
        </div>

        {/* Category Grid */}
        <div className="relative grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-10">
          {partnerCategories.map((cat) => {
            const colors = colorMap[cat.color];
            return (
              <div
                key={cat.title}
                className={`group relative rounded-2xl ${colors.bg} border ${colors.border} p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${colors.glow} cursor-default`}
              >
                <div className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-3`}>
                  <cat.icon size={20} className={colors.text} />
                </div>
                <h3 className="font-semibold text-white text-sm md:text-base">{cat.title}</h3>
                <p className="text-foreground/40 text-xs mt-1 leading-relaxed hidden md:block">{cat.description}</p>
                {/* Coming soon badge */}
                <div className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest text-foreground/20">
                  Soon
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="relative text-center space-y-4">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => openModal('partner')}
              className="inline-flex items-center gap-2 bg-primary hover:bg-blue-600 text-white font-semibold py-3 px-7 rounded-2xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02]"
            >
              <Handshake size={18} />
              Become a Partner
              <ArrowRight size={16} />
            </button>
            <span className="text-foreground/30 text-xs">or</span>
            <button
              onClick={() => openModal('advertise')}
              className="inline-flex items-center gap-2 text-foreground/50 hover:text-foreground/80 text-sm transition-colors underline underline-offset-4 decoration-white/10 hover:decoration-white/30"
            >
              Advertise your services
            </button>
          </div>
          <p className="text-foreground/30 text-[11px]">
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
