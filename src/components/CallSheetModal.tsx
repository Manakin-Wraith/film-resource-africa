'use client';

import { MapPin, Calendar, Clock, DollarSign, ExternalLink, Sparkles, Building2, User } from 'lucide-react';
import { CallSheetListing } from '@/app/actions';
import { getCallSheetCategoryStyle, projectStageLabels, compensationTypeLabels } from '@/lib/callSheetConfig';
import Modal from '@/components/ui/Modal';

interface CallSheetModalProps {
  listing: CallSheetListing | null;
  onClose: () => void;
}

export default function CallSheetModal({ listing, onClose }: CallSheetModalProps) {
  if (!listing) return null;

  const catStyle = getCallSheetCategoryStyle(listing.category);
  const CatIcon = catStyle.icon;
  const stageLabel = projectStageLabels[listing.project_stage] || listing.project_stage;
  const compTypeLabel = compensationTypeLabels[listing.compensation_type] || listing.compensation_type;

  const applyUrl = listing.application_url || `mailto:${listing.producer_email}`;

  return (
    <Modal
      open={!!listing}
      onClose={onClose}
      size="lg"
      labelledBy="callsheet-modal-title"
      footer={
        <div className="px-6 py-4">
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-callsheet-deep hover:bg-teal-500 text-white font-bold text-lg transition-colors"
          >
            Apply Now
            <ExternalLink size={18} />
          </a>
        </div>
      }
    >
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3 pr-14">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${catStyle.bg} ${catStyle.color}`}>
              <CatIcon size={12} />
              {catStyle.label}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-white/5 border-white/10 text-foreground/60">
              <Clock size={12} />
              {stageLabel}
            </span>
            {listing.mentorship_included && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-amber-500/10 border-amber-500/20 text-amber-400">
                <Sparkles size={12} />
                Mentorship Included
              </span>
            )}
          </div>
          <h2 id="callsheet-modal-title" className="text-2xl font-bold font-heading text-foreground leading-tight mb-1">
            {listing.title}
          </h2>
          <p className="text-lg text-callsheet font-medium">
            {listing.production_title}
          </p>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-foreground/50 uppercase font-bold tracking-wider mb-1">
              <Building2 size={12} />
              Production Company
            </div>
            <p className="text-foreground/90 font-medium">{listing.production_company}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-foreground/50 uppercase font-bold tracking-wider mb-1">
              <User size={12} />
              Producer
            </div>
            <p className="text-foreground/90 font-medium">{listing.producer_name}</p>
          </div>
          <div className="bg-teal-500/10 rounded-xl p-4 border border-teal-500/10">
            <div className="flex items-center gap-2 text-xs text-teal-400/70 uppercase font-bold tracking-wider mb-1">
              <DollarSign size={12} />
              Compensation
            </div>
            <p className="text-teal-300 font-bold">{listing.compensation}</p>
            <p className="text-teal-400/60 text-xs mt-0.5">{compTypeLabel}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-foreground/50 uppercase font-bold tracking-wider mb-1">
              <MapPin size={12} />
              Location
            </div>
            <p className="text-foreground/90 font-medium">{listing.location}</p>
          </div>
          {listing.start_date && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 text-xs text-foreground/50 uppercase font-bold tracking-wider mb-1">
                <Calendar size={12} />
                Start Date
              </div>
              <p className="text-foreground/90 font-medium">{listing.start_date}</p>
            </div>
          )}
          {listing.duration && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 text-xs text-foreground/50 uppercase font-bold tracking-wider mb-1">
                <Clock size={12} />
                Duration
              </div>
              <p className="text-foreground/90 font-medium">{listing.duration}</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-xs text-foreground/50 uppercase font-bold tracking-wider mb-2">About This Role</h3>
          <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
        </div>

        {/* Requirements */}
        {listing.requirements && (
          <div className="mb-6">
            <h3 className="text-xs text-foreground/50 uppercase font-bold tracking-wider mb-2">Requirements</h3>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{listing.requirements}</p>
          </div>
        )}

        {/* Website */}
        {listing.website && (
          <a
            href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-callsheet hover:text-teal-300 transition-colors"
          >
            <ExternalLink size={14} />
            {listing.website.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>
    </Modal>
  );
}
