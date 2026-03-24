'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo, useDragControls } from 'framer-motion';
import { Calendar, DollarSign, FileText, ExternalLink, X, Info, Target, FileCheck, CheckCircle2, AlertCircle, Share2, Clock, AlertTriangle, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { Opportunity } from '@/app/actions';
import { getCategoryStyle } from '@/lib/categoryConfig';
import { decodeHtmlEntities } from '@/lib/textUtils';

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
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-8">
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
            style={isMobile ? { y: dragY } : undefined}
            className={`w-full glass-card bg-background/95 border border-white/20 overflow-hidden flex flex-col relative shadow-2xl ${
              isMobile
                ? 'max-h-[95vh] rounded-t-[2rem]'
                : 'max-w-4xl max-h-[90vh] rounded-[2.5rem]'
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
              {/* Header */}
              <div
                className="relative p-6 md:p-10 pb-5 md:pb-6 border-b border-white/10 bg-gradient-to-b from-primary/10 to-transparent"
                onPointerDown={(e) => { if (isMobile) dragControls.start(e); }}
              >
                {/* Org logo + Category badge */}
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  {selectedOpp.logo && (
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

              {/* Key Info Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedOpp["Next Deadline"] && (
                  <div className="flex items-start gap-3 bg-accent/10 border border-accent/20 rounded-2xl p-4">
                    <div className="mt-0.5 p-2 bg-accent/20 rounded-xl">
                      <Calendar size={18} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-accent/80 mb-1">Deadline</p>
                      <p className="text-sm font-medium text-foreground/90 leading-snug">{decodeHtmlEntities(selectedOpp["Next Deadline"])}</p>
                    </div>
                  </div>
                )}
                {selectedOpp["Cost"] && (
                  <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                    <div className="mt-0.5 p-2 bg-green-500/20 rounded-xl">
                      <DollarSign size={18} className="text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-green-400/80 mb-1">Cost</p>
                      <p className="text-sm font-medium text-foreground/90 leading-snug">{decodeHtmlEntities(selectedOpp["Cost"])}</p>
                    </div>
                  </div>
                )}
                {selectedOpp["For Films or Series?"] && (
                  <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-2xl p-4">
                    <div className="mt-0.5 p-2 bg-primary/20 rounded-xl">
                      <FileText size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-1">Format</p>
                      <p className="text-sm font-medium text-foreground/90 leading-snug">{decodeHtmlEntities(selectedOpp["For Films or Series?"])}</p>
                    </div>
                  </div>
                )}
                {selectedOpp["Who Can Apply / Eligibility"] && (
                  <div className="flex items-start gap-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4">
                    <div className="mt-0.5 p-2 bg-cyan-500/20 rounded-xl">
                      <CheckCircle2 size={18} className="text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80 mb-1">Eligibility</p>
                      <div className="text-sm font-medium text-foreground/90 leading-snug"><ModalMarkdown text={selectedOpp["Who Can Apply / Eligibility"]} /></div>
                    </div>
                  </div>
                )}
              </div>

              {/* What You Get + What to Submit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedOpp["What Do You Get If Selected?"] && (
                  <section className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-5 md:p-6 rounded-2xl border border-green-500/15">
                    <h3 className="flex items-center gap-2.5 text-base font-bold font-heading mb-3 text-green-400">
                      <Target size={20} /> What You Get
                    </h3>
                    <div className="text-sm leading-relaxed text-foreground/75">
                      <ModalMarkdown text={selectedOpp["What Do You Get If Selected?"]} />
                    </div>
                  </section>
                )}

                {selectedOpp["What to Submit"] && (
                  <section className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-5 md:p-6 rounded-2xl border border-blue-500/15">
                    <h3 className="flex items-center gap-2.5 text-base font-bold font-heading mb-3 text-blue-400">
                      <FileCheck size={20} /> What to Submit
                    </h3>
                    <div className="text-sm leading-relaxed text-foreground/75">
                      <ModalMarkdown text={selectedOpp["What to Submit"]} />
                    </div>
                  </section>
                )}
              </div>

              {/* Insider Tips */}
              {selectedOpp["Strongest Submission Tips"] && (
                <section className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 p-5 md:p-6 rounded-2xl border border-purple-500/15">
                  <h3 className="flex items-center gap-2.5 text-base font-bold font-heading mb-3 text-purple-400">
                    <Lightbulb size={20} /> Insider Tips
                  </h3>
                  <div className="text-sm leading-relaxed text-foreground/75 italic">
                    &ldquo;<ModalMarkdown text={selectedOpp["Strongest Submission Tips"]} />&rdquo;
                  </div>
                </section>
              )}
              
              {/* Calendar Reminder */}
              {selectedOpp["CALENDAR REMINDER:"] && (
                <div className="flex items-center gap-3 bg-accent/8 border border-accent/15 rounded-2xl px-5 py-4">
                  <div className="p-2 bg-accent/20 rounded-xl shrink-0">
                    <Clock size={18} className="text-accent" />
                  </div>
                  <p className="text-sm font-medium text-accent/90">
                    {decodeHtmlEntities(selectedOpp["CALENDAR REMINDER:"])}
                  </p>
                </div>
              )}

            </div>
            </div>

            {/* Modal Footer */}
            {selectedOpp["Apply:"] && (
              <div className="p-5 md:p-8 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-8 border-t border-white/10 bg-black/20 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                <p className="text-foreground/60 text-xs md:text-sm max-w-md hidden md:block">
                  Always verify dates and eligibility on the official website before applying.
                </p>
                <a 
                  href={selectedOpp["Apply:"].startsWith('http') ? selectedOpp["Apply:"] : `https://${selectedOpp["Apply:"]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto px-10 py-4 bg-primary hover:bg-blue-600 text-white rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-primary/30 hover:-translate-y-1"
                >
                  <span>Visit Official Website</span>
                  <ExternalLink size={20} />
                </a>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
