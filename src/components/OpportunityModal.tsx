'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Calendar, DollarSign, FileText, ExternalLink, X, Info, Target, FileCheck, CheckCircle2, AlertCircle, Share2 } from 'lucide-react';
import { Opportunity } from '@/app/actions';
import { getCategoryStyle } from '@/lib/categoryConfig';

interface OpportunityModalProps {
  selectedOpp: Opportunity | null;
  onClose: () => void;
}

export default function OpportunityModal({ selectedOpp, onClose }: OpportunityModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const dragY = useMotionValue(0);
  const overlayOpacity = useTransform(dragY, [0, 300], [1, 0]);

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
              <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
            )}
            {/* Modal Header */}
            <div className="relative p-6 md:p-10 pb-5 md:pb-6 border-b border-white/10 bg-gradient-to-b from-primary/10 to-transparent">
              <div className="absolute top-4 md:top-6 right-4 md:right-6 flex items-center gap-2 z-10">
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
              
              <h2 className="text-2xl md:text-5xl font-bold font-heading leading-tight pr-24 md:pr-12 mb-4 md:mb-6">
                {selectedOpp.title}
              </h2>
              
              <div className="flex flex-wrap gap-3">
                {(() => {
                  const catStyle = getCategoryStyle(selectedOpp.category);
                  const CatIcon = catStyle.icon;
                  return (
                    <span className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm border ${catStyle.bg} ${catStyle.color}`}>
                      <CatIcon size={16} />
                      {catStyle.label}
                    </span>
                  );
                })()}
                {selectedOpp["For Films or Series?"] && (
                  <span className="flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-xl font-medium border border-primary/20">
                    <FileText size={16} />
                    {selectedOpp["For Films or Series?"]}
                  </span>
                )}
                {selectedOpp["Cost"] && (
                  <span className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-xl font-medium border border-green-500/20">
                    <DollarSign size={16} />
                    {selectedOpp["Cost"]}
                  </span>
                )}
                <span className="flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-xl font-medium border border-accent/20">
                  <Calendar size={16} />
                  {selectedOpp["Next Deadline"]}
                </span>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-5 md:p-10 overflow-y-auto custom-scrollbar flex-grow space-y-8 md:space-y-10 overscroll-contain">
              
              {selectedOpp["What Is It?"] && (
                <section>
                  <h3 className="flex items-center gap-3 text-xl font-bold font-heading mb-4 text-primary">
                    <Info size={24} /> About the Opportunity
                  </h3>
                  <p className="text-lg leading-relaxed text-foreground/80">
                    {selectedOpp["What Is It?"]}
                  </p>
                </section>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {selectedOpp["Who Can Apply / Eligibility"] && (
                  <section className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <h3 className="flex items-center gap-3 text-lg font-bold font-heading mb-4 text-accent">
                      <CheckCircle2 size={24} /> Eligibility
                    </h3>
                    <p className="leading-relaxed text-foreground/80">
                      {selectedOpp["Who Can Apply / Eligibility"]}
                    </p>
                  </section>
                )}

                {selectedOpp["What Do You Get If Selected?"] && (
                  <section className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <h3 className="flex items-center gap-3 text-lg font-bold font-heading mb-4 text-green-400">
                      <Target size={24} /> What You Get
                    </h3>
                    <p className="leading-relaxed text-foreground/80">
                      {selectedOpp["What Do You Get If Selected?"]}
                    </p>
                  </section>
                )}
              </div>

              {selectedOpp["What to Submit"] && (
                <section>
                  <h3 className="flex items-center gap-3 text-xl font-bold font-heading mb-4 text-blue-400">
                    <FileCheck size={24} /> What to Submit
                  </h3>
                  <p className="text-lg leading-relaxed text-foreground/80 bg-blue-500/5 p-6 rounded-3xl border border-blue-500/10">
                    {selectedOpp["What to Submit"]}
                  </p>
                </section>
              )}

              {selectedOpp["Strongest Submission Tips"] && (
                <section>
                  <h3 className="flex items-center gap-3 text-xl font-bold font-heading mb-4 text-purple-400">
                    <AlertCircle size={24} /> Insider Tips
                  </h3>
                  <p className="text-lg leading-relaxed text-foreground/80 bg-purple-500/5 p-6 rounded-3xl border border-purple-500/10 font-medium italic">
                    &ldquo;{selectedOpp["Strongest Submission Tips"]}&rdquo;
                  </p>
                </section>
              )}
              
              {selectedOpp["CALENDAR REMINDER:"] && (
                <section>
                  <p className="text-center font-semibold text-accent/80 bg-accent/10 py-4 rounded-xl border border-accent/20">
                    📅 {selectedOpp["CALENDAR REMINDER:"]}
                  </p>
                </section>
              )}

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
