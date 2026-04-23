'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo, useDragControls } from 'framer-motion';
import { Calendar, DollarSign, FileText, ExternalLink, X, Info, Target, FileCheck, CheckCircle2, AlertCircle, Share2, Clock, AlertTriangle, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { Opportunity } from '@/app/actions';
import { getCategoryStyle } from '@/lib/categoryConfig';
import { decodeHtmlEntities } from '@/lib/textUtils';
import GeoIndicator from '@/components/GeoIndicator';

function ModalMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="text-sm leading-relaxed text-foreground/75 mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-outside pl-5 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-outside pl-5 mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-sm leading-relaxed text-foreground/75">{children}</li>,
        strong: ({ children }) => <strong className="font-bold text-foreground/90">{children}</strong>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
            {children}
          </a>
        ),
        h3: ({ children }) => <h3 className="text-sm font-bold text-foreground/85 mt-3 mb-1">{children}</h3>,
      }}
    >
      {decodeHtmlEntities(text)}
    </ReactMarkdown>
  );
}

interface OpportunityModalProps {
  selectedOpp: Opportunity | null;
  onClose: () => void;
}

export default function OpportunityModal({ selectedOpp, onClose }: OpportunityModalProps) {
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedOpp) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [selectedOpp]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  }, [onClose]);

  const handleShare = useCallback(async () => {
    if (!selectedOpp) return;
    const shareData = {
      title: selectedOpp.title,
      text: `Check out this opportunity: ${selectedOpp.title}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${selectedOpp.title} — ${window.location.href}`);
      }
    } catch (err) {
      // User cancelled share
    }
  }, [selectedOpp]);

  return (
    <AnimatePresence>
      {selectedOpp && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            className={`w-full overflow-hidden flex flex-col relative shadow-2xl ${
              isMobile
                ? 'max-h-[95vh] rounded-t-[2rem] border-t border-white/[0.12]'
                : 'max-w-4xl max-h-[90vh] rounded-2xl border border-white/[0.12]'
            }`}
          >
            {/* Mobile drag handle */}
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
              <button
                onClick={handleShare}
                className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors border border-white/10 backdrop-blur-md"
                aria-label="Share this opportunity"
              >
                <Share2 size={18} />
              </button>
              <button 
                onClick={onClose}
                className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors border border-white/10 backdrop-blur-md"
              >
                <X size={20} className="md:w-6 md:h-6" />
              </button>
            </div>

            {/* Scrollable area — header + content unified so long titles don't starve mobile viewport */}
            <div className="overflow-y-auto custom-scrollbar flex-grow overscroll-contain">
              {/* OG Image hero banner */}
              {selectedOpp.og_image_url && (
                <div className="relative h-40 md:h-56 overflow-hidden">
                  <Image
                    src={selectedOpp.og_image_url}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 896px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  <div className="absolute bottom-3 left-6 md:left-10 flex items-center gap-2">
                    {selectedOpp.logo && (
                      <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-xl px-2.5 py-2 border border-white/10">
                        <Image
                          src={selectedOpp.logo}
                          alt=""
                          width={24}
                          height={24}
                          className="object-contain max-w-[24px] max-h-[24px]"
                        />
                      </div>
                    )}
                    <GeoIndicator geoScope={selectedOpp.geo_scope} countryIso={selectedOpp.country_iso} countryName={selectedOpp.country_name} variant="overlay" />
                  </div>
                </div>
              )}

              {/* Header */}
              <div
                className="relative p-6 md:p-10 pb-5 md:pb-6 border-b border-white/[0.08]"
                onPointerDown={(e) => { if (isMobile) dragControls.start(e); }}
              >
                {/* Org logo + Category badge */}
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  {!selectedOpp.og_image_url && selectedOpp.logo && (
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <Image
                        src={selectedOpp.logo}
                        alt=""
                        width={40}
                        height={40}
                        className="object-contain max-w-[32px] max-h-[32px] md:max-w-[40px] md:max-h-[40px]"
                      />
                    </div>
                  )}
                  {(() => {
                    const catStyle = getCategoryStyle(selectedOpp.category);
                    const CatIcon = catStyle.icon;
                    return (
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-xs uppercase tracking-wider border ${catStyle.bg} ${catStyle.color}`}>
                        <CatIcon size={14} />
                        {catStyle.label}
                      </span>
                    );
                  })()}
                  <GeoIndicator geoScope={selectedOpp.geo_scope} countryIso={selectedOpp.country_iso} countryName={selectedOpp.country_name} variant="pill" />
                </div>
                
                <h2 className="text-xl md:text-4xl font-bold font-heading leading-tight pr-24 md:pr-28 mb-4 md:mb-5">
                  {selectedOpp.title}
                </h2>

                {/* About — immediately under title */}
                {selectedOpp["What Is It?"] && (
                  <div className="text-[15px] md:text-base leading-relaxed text-foreground/70 pr-0 md:pr-12">
                    <ModalMarkdown text={selectedOpp["What Is It?"]} />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 md:p-10 space-y-6 md:space-y-8">

              {/* Key info — editorial dateline rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedOpp["Next Deadline"] && (
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.08]" style={{ background: 'var(--surface-raised)' }}>
                    <Calendar size={16} className="text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-tertiary)' }}>Deadline</p>
                      <p className="text-sm font-semibold text-foreground leading-snug">{decodeHtmlEntities(selectedOpp["Next Deadline"])}</p>
                    </div>
                  </div>
                )}
                {selectedOpp["Cost"] && (
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.08]" style={{ background: 'var(--surface-raised)' }}>
                    <DollarSign size={16} className="text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-tertiary)' }}>Cost</p>
                      <p className="text-sm font-semibold text-foreground leading-snug">{decodeHtmlEntities(selectedOpp["Cost"])}</p>
                    </div>
                  </div>
                )}
                {selectedOpp["For Films or Series?"] && (
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.08]" style={{ background: 'var(--surface-raised)' }}>
                    <FileText size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-tertiary)' }}>Format</p>
                      <p className="text-sm font-semibold text-foreground leading-snug">{decodeHtmlEntities(selectedOpp["For Films or Series?"])}</p>
                    </div>
                  </div>
                )}
                {selectedOpp["Who Can Apply / Eligibility"] && (
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.08]" style={{ background: 'var(--surface-raised)' }}>
                    <CheckCircle2 size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-tertiary)' }}>Eligibility</p>
                      <div className="text-sm font-semibold text-foreground leading-snug"><ModalMarkdown text={selectedOpp["Who Can Apply / Eligibility"]} /></div>
                    </div>
                  </div>
                )}
              </div>

              {/* What You Get + What to Submit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedOpp["What Do You Get If Selected?"] && (
                  <section className="p-5 rounded-xl border border-white/[0.08]" style={{ background: 'var(--surface-raised)' }}>
                    <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--foreground-tertiary)' }}>
                      <Target size={12} /> What You Get
                    </h3>
                    <div className="text-sm leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
                      <ModalMarkdown text={selectedOpp["What Do You Get If Selected?"]} />
                    </div>
                  </section>
                )}
                {selectedOpp["What to Submit"] && (
                  <section className="p-5 rounded-xl border border-white/[0.08]" style={{ background: 'var(--surface-raised)' }}>
                    <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--foreground-tertiary)' }}>
                      <FileCheck size={12} /> What to Submit
                    </h3>
                    <div className="text-sm leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
                      <ModalMarkdown text={selectedOpp["What to Submit"]} />
                    </div>
                  </section>
                )}
              </div>

              {/* Insider Tips */}
              {selectedOpp["Strongest Submission Tips"] && (
                <section className="p-5 rounded-xl border border-white/[0.08]" style={{ background: 'var(--surface-raised)' }}>
                  <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--foreground-tertiary)' }}>
                    <Lightbulb size={12} /> Insider Tips
                  </h3>
                  <div className="text-sm leading-relaxed italic" style={{ color: 'var(--foreground-secondary)' }}>
                    <ModalMarkdown text={selectedOpp["Strongest Submission Tips"]} />
                  </div>
                </section>
              )}

              {/* Calendar Reminder */}
              {selectedOpp["CALENDAR REMINDER:"] && (
                <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-white/[0.08]" style={{ background: 'var(--surface-raised)' }}>
                  <Clock size={16} className="text-accent flex-shrink-0" />
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground-secondary)' }}>
                    {decodeHtmlEntities(selectedOpp["CALENDAR REMINDER:"])}
                  </p>
                </div>
              )}

            </div>
            </div>

            {/* Pinned Apply footer */}
            {selectedOpp["Apply:"] && (
              <div
                className="flex flex-col md:flex-row items-center justify-between gap-3 px-5 md:px-8 py-4 border-t border-white/[0.08]"
                style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
              >
                <p className="text-xs hidden md:block" style={{ color: 'var(--foreground-tertiary)' }}>
                  Verify dates and eligibility on the official website before applying.
                </p>
                <a
                  href={selectedOpp["Apply:"].startsWith('http') ? selectedOpp["Apply:"] : `https://${selectedOpp["Apply:"]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-primary hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-all min-h-[48px]"
                >
                  Apply Now <ExternalLink size={15} />
                </a>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
