'use client';

import { useCallback } from 'react';
import { Calendar, DollarSign, FileText, ExternalLink, Target, FileCheck, CheckCircle2, Share2, Clock, Lightbulb, BadgeCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import Link from 'next/link';
import { Opportunity } from '@/app/actions';
import { getCategoryStyle } from '@/lib/categoryConfig';
import { decodeHtmlEntities } from '@/lib/textUtils';
import { formatRelativeDate, formatLocalDateTime } from '@/lib/dateUtils';
import GeoIndicator from '@/components/GeoIndicator';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

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

  if (!selectedOpp) return null;

  return (
    <Modal
      open={!!selectedOpp}
      onClose={onClose}
      size="2xl"
      labelledBy="opportunity-modal-title"
      actions={
        <button
          onClick={handleShare}
          className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors border border-white/10 backdrop-blur-md"
          aria-label="Share this opportunity"
        >
          <Share2 size={18} />
        </button>
      }
      hero={selectedOpp.og_image_url && (
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
      footer={selectedOpp["Apply:"] && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-5 md:px-8 py-4">
          <p className="text-xs hidden md:block" style={{ color: 'var(--foreground-tertiary)' }}>
            Verify dates and eligibility on the official website before applying.
          </p>
          <Button
            href={selectedOpp["Apply:"].startsWith('http') ? selectedOpp["Apply:"] : `https://${selectedOpp["Apply:"]}`}
            external
            size="lg"
            rightIcon={ExternalLink}
            className="w-full md:w-auto"
          >
            Apply Now
          </Button>
        </div>
      )}
    >
              {/* Header */}
              <div className="relative p-6 md:p-10 pb-5 md:pb-6 border-b border-line">
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
                
                <h2 id="opportunity-modal-title" className="text-xl md:text-4xl font-bold font-heading leading-tight pr-24 md:pr-28 mb-4 md:mb-5">
                  {selectedOpp.title}
                </h2>

                {selectedOpp.member_name && (
                  <p className="text-[13px] mb-4 flex items-center gap-1.5" style={{ color: 'var(--foreground-tertiary)' }}>
                    <span className="inline-block w-1 h-1 rounded-full bg-primary" />
                    Added by{' '}
                    {selectedOpp.member_username ? (
                      <Link href={`/members/${selectedOpp.member_username}`} className="font-medium text-primary hover:underline">
                        {selectedOpp.member_name}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground/70">{selectedOpp.member_name}</span>
                    )}
                  </p>
                )}

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
                      {selectedOpp.last_verified_at && (
                        <p
                          title={`Source last re-checked ${formatLocalDateTime(selectedOpp.last_verified_at)}`}
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-teal-400"
                        >
                          <BadgeCheck size={12} />
                          Verified {formatRelativeDate(selectedOpp.last_verified_at)}
                        </p>
                      )}
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
    </Modal>
  );
}
