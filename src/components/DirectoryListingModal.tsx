'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo, useDragControls } from 'framer-motion';
import { X, Share2, ExternalLink, MapPin, Globe, Mail, Phone, Calendar, DollarSign, Clock, Star, CheckCircle2, Briefcase, GraduationCap, Film, Users, Award } from 'lucide-react';
import { DirectoryListing } from '@/app/actions';
import { getDirectoryType, getCategoriesForType } from '@/lib/industryDirectoryConfig';

interface DirectoryListingModalProps {
  listing: DirectoryListing | null;
  onClose: () => void;
}

export default function DirectoryListingModal({ listing, onClose }: DirectoryListingModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const dragY = useMotionValue(0);
  const overlayOpacity = useTransform(dragY, [0, 300], [1, 0]);
  const dragControls = useDragControls();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (listing) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [listing]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) onClose();
  }, [onClose]);

  const handleShare = useCallback(async () => {
    if (!listing) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.name, text: `Check out ${listing.name} on Film Resource Africa`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${listing.name} — ${window.location.href}`);
      }
    } catch {}
  }, [listing]);

  if (!listing) return null;

  const dirType = getDirectoryType(listing.directory_type);
  const DirIcon = dirType.icon;

  const availabilityConfig: Record<string, { label: string; color: string; bg: string }> = {
    available: { label: 'Available', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30' },
    busy: { label: 'Busy', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
    selective: { label: 'Selective', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
  };

  const sizeLabels: Record<string, string> = { indie: 'Independent', mid: 'Mid-Size', major: 'Major Studio' };
  const pricingLabels: Record<string, string> = { budget: 'Budget-Friendly', mid: 'Mid-Range', premium: 'Premium' };

  return (
    <AnimatePresence>
      {listing && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-8">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ opacity: isMobile ? overlayOpacity : undefined }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
          />

          <motion.div
            initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 50 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag={isMobile ? 'y' : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={isMobile ? { y: dragY, background: 'var(--surface)' } : { background: 'var(--surface)' }}
            className={`w-full border border-white/[0.08] overflow-hidden flex flex-col relative shadow-2xl ${
              isMobile ? 'max-h-[95vh] rounded-t-2xl' : 'max-w-3xl max-h-[90vh] rounded-2xl'
            }`}
          >
            {isMobile && (
              <div
                className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
            )}

            {/* Floating action buttons — always visible */}
            <div className="absolute top-3 md:top-6 right-4 md:right-6 flex items-center gap-2 z-30">
              <button onClick={handleShare} className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors border border-white/10" aria-label="Share">
                <Share2 size={18} />
              </button>
              <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors border border-white/10">
                <X size={20} className="md:w-6 md:h-6" />
              </button>
            </div>

            {/* Scrollable area — header + content unified so long titles don't starve mobile viewport */}
            <div className="overflow-y-auto custom-scrollbar flex-grow overscroll-contain">
              {/* Header */}
              <div
                className="relative p-6 md:p-10 pb-5 md:pb-6 border-b border-white/10 bg-gradient-to-b from-primary/10 to-transparent"
                onPointerDown={(e) => { if (isMobile) dragControls.start(e); }}
              >
                {/* Type + Category badges */}
                <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-xs uppercase tracking-wider border ${dirType.bg} ${dirType.color}`}>
                    <DirIcon size={14} />
                    {dirType.label}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs border bg-white/5 border-white/10 text-foreground/60">
                    {listing.category}
                  </span>
                  {listing.verified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border bg-blue-500/20 border-blue-500/30 text-blue-400">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  )}
                  {listing.featured && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border bg-amber-500/20 border-amber-500/30 text-amber-400">
                      <Star size={12} /> Featured
                    </span>
                  )}
                </div>

                {/* Name + Logo */}
                <div className="flex items-center gap-4 pr-24 md:pr-28 mb-3 md:mb-4">
                  {listing.logo_url ? (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex-shrink-0 shadow-lg">
                      <img src={listing.logo_url} alt={listing.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
                      <DirIcon size={28} className={`${dirType.color} opacity-40`} />
                    </div>
                  )}
                  <h2 className="text-xl md:text-4xl font-bold font-heading leading-tight">
                    {listing.name}
                  </h2>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-foreground/60 text-sm">
                  <MapPin size={14} className="text-primary" />
                  <span>{listing.city ? `${listing.city}, ` : ''}{listing.country}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 md:p-10 space-y-6 md:space-y-8">

              {/* Description */}
              <p className="text-[15px] md:text-base leading-relaxed text-foreground/75">
                {listing.description}
              </p>

              {/* Key Info Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Crew: availability */}
                {listing.directory_type === 'crew' && listing.availability && (() => {
                  const av = availabilityConfig[listing.availability];
                  return (
                    <div className={`flex items-start gap-3 ${av.bg} rounded-2xl p-4 border`}>
                      <div className="mt-0.5 p-2 bg-white/10 rounded-xl"><Clock size={18} className={av.color} /></div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Availability</p>
                        <p className={`text-sm font-bold ${av.color}`}>{av.label}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Crew: day rate */}
                {listing.day_rate_range && (
                  <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                    <div className="mt-0.5 p-2 bg-green-500/20 rounded-xl"><DollarSign size={18} className="text-green-400" /></div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-green-400/80 mb-1">Day Rate</p>
                      <p className="text-sm font-medium text-foreground/90">{listing.day_rate_range}</p>
                    </div>
                  </div>
                )}

                {/* Company: size */}
                {listing.company_size && (
                  <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                    <div className="mt-0.5 p-2 bg-blue-500/20 rounded-xl"><Briefcase size={18} className="text-blue-400" /></div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-400/80 mb-1">Company Size</p>
                      <p className="text-sm font-medium text-foreground/90">{sizeLabels[listing.company_size]}</p>
                    </div>
                  </div>
                )}

                {/* Company: year founded */}
                {listing.year_founded && (
                  <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-2xl p-4">
                    <div className="mt-0.5 p-2 bg-primary/20 rounded-xl"><Calendar size={18} className="text-primary" /></div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-1">Founded</p>
                      <p className="text-sm font-medium text-foreground/90">{listing.year_founded}</p>
                    </div>
                  </div>
                )}

                {/* Service: pricing tier */}
                {listing.pricing_tier && (
                  <div className="flex items-start gap-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                    <div className="mt-0.5 p-2 bg-purple-500/20 rounded-xl"><DollarSign size={18} className="text-purple-400" /></div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-purple-400/80 mb-1">Pricing</p>
                      <p className="text-sm font-medium text-foreground/90">{pricingLabels[listing.pricing_tier]}</p>
                    </div>
                  </div>
                )}

                {/* Training: cost */}
                {listing.directory_type === 'training' && listing.cost && (
                  <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                    <div className="mt-0.5 p-2 bg-green-500/20 rounded-xl"><DollarSign size={18} className="text-green-400" /></div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-green-400/80 mb-1">Cost</p>
                      <p className="text-sm font-medium text-foreground/90">{listing.cost}</p>
                    </div>
                  </div>
                )}

                {/* Training: duration */}
                {listing.duration && (
                  <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                    <div className="mt-0.5 p-2 bg-amber-500/20 rounded-xl"><Clock size={18} className="text-amber-400" /></div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80 mb-1">Duration</p>
                      <p className="text-sm font-medium text-foreground/90">{listing.duration}</p>
                    </div>
                  </div>
                )}

                {/* Training: next intake */}
                {listing.next_intake && (
                  <div className="flex items-start gap-3 bg-accent/10 border border-accent/20 rounded-2xl p-4">
                    <div className="mt-0.5 p-2 bg-accent/20 rounded-xl"><Calendar size={18} className="text-accent" /></div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-accent/80 mb-1">Next Intake</p>
                      <p className="text-sm font-medium text-foreground/90">{listing.next_intake}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Type-specific detail sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Crew: role + credits */}
                {listing.role && (
                  <section className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-5 md:p-6 rounded-2xl border border-green-500/15">
                    <h3 className="flex items-center gap-2.5 text-base font-bold font-heading mb-3 text-green-400">
                      <Users size={20} /> Role
                    </h3>
                    <p className="text-sm font-semibold text-foreground/90 mb-1">{listing.role}</p>
                    {listing.secondary_roles && (
                      <p className="text-xs text-foreground/50">Also: {listing.secondary_roles}</p>
                    )}
                  </section>
                )}

                {listing.credits && (
                  <section className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-5 md:p-6 rounded-2xl border border-amber-500/15">
                    <h3 className="flex items-center gap-2.5 text-base font-bold font-heading mb-3 text-amber-400">
                      <Award size={20} /> Credits
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground/75">{listing.credits}</p>
                  </section>
                )}

                {/* Company: speciality + notable projects */}
                {listing.speciality && (
                  <section className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-5 md:p-6 rounded-2xl border border-blue-500/15">
                    <h3 className="flex items-center gap-2.5 text-base font-bold font-heading mb-3 text-blue-400">
                      <Film size={20} /> Speciality
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground/75">{listing.speciality}</p>
                  </section>
                )}

                {listing.notable_projects && (
                  <section className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 p-5 md:p-6 rounded-2xl border border-purple-500/15">
                    <h3 className="flex items-center gap-2.5 text-base font-bold font-heading mb-3 text-purple-400">
                      <Award size={20} /> Notable Projects
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground/75">{listing.notable_projects}</p>
                  </section>
                )}

                {/* Training: accreditation */}
                {listing.accreditation && (
                  <section className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-5 md:p-6 rounded-2xl border border-amber-500/15">
                    <h3 className="flex items-center gap-2.5 text-base font-bold font-heading mb-3 text-amber-400">
                      <GraduationCap size={20} /> Accreditation
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground/75">{listing.accreditation}</p>
                  </section>
                )}

                {/* Bio (crew) */}
                {listing.bio && (
                  <section className="md:col-span-2 bg-gradient-to-br from-white/5 to-white/[0.02] p-5 md:p-6 rounded-2xl border border-white/10">
                    <h3 className="flex items-center gap-2.5 text-base font-bold font-heading mb-3 text-foreground/80">
                      <Users size={20} /> Bio
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground/75">{listing.bio}</p>
                  </section>
                )}
              </div>
            </div>
            </div>

            {/* Footer — contact links */}
            <div className="p-5 md:p-8 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-8 border-t border-white/10 bg-black/20">
              <div className="flex flex-wrap items-center gap-3">
                {listing.website && (
                  <a href={listing.website} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-primary/20 text-sm">
                    <Globe size={16} /> Visit Website <ExternalLink size={14} />
                  </a>
                )}
                {listing.portfolio_url && (
                  <a href={listing.portfolio_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-foreground font-semibold py-3 px-6 rounded-2xl transition-all border border-white/10 text-sm">
                    <Film size={16} /> Portfolio <ExternalLink size={14} />
                  </a>
                )}
                {listing.email && (
                  <a href={`mailto:${listing.email}`}
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-foreground font-medium py-3 px-5 rounded-2xl transition-all border border-white/10 text-sm">
                    <Mail size={16} /> Email
                  </a>
                )}
                {listing.phone && (
                  <a href={`tel:${listing.phone}`}
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-foreground font-medium py-3 px-5 rounded-2xl transition-all border border-white/10 text-sm">
                    <Phone size={16} /> Call
                  </a>
                )}
              </div>
              <p className="text-foreground/30 text-xs mt-3">Always verify contact details directly before engaging.</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
