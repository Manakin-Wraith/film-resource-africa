'use client';

import { useState } from 'react';
import { submitCallSheetListing, CallSheetListing } from '@/app/actions';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

type FormData = Omit<CallSheetListing, 'id' | 'status' | 'created_at' | 'updated_at'>;

const categories = [
  'Key Crew',
  "Writers' Room",
  'Post & VFX',
  'Emerging Talent',
  'Co-Production Partners',
  'Festival & Market Reps',
];

const compensationTypes = [
  { value: 'paid', label: 'Paid' },
  { value: 'stipend', label: 'Stipend' },
  { value: 'deferred+paid', label: 'Deferred + Paid' },
];

const projectStages = [
  { value: 'development', label: 'Development' },
  { value: 'pre-production', label: 'Pre-Production' },
  { value: 'production', label: 'Production' },
  { value: 'post-production', label: 'Post-Production' },
];

export default function SubmitCallSheetPage() {
  const [formData, setFormData] = useState<Partial<FormData>>({
    mentorship_included: false,
    compensation_type: 'paid',
    project_stage: 'pre-production',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitCallSheetListing(formData as FormData);
      setIsSuccess(true);
    } catch (error) {
      console.error('Submission failed', error);
      alert('Something went wrong saving your listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const set = (key: keyof FormData, value: any) => setFormData({ ...formData, [key]: value });

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background relative z-10 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto glass-card rounded-[3rem] p-12 text-center border-teal-500/20 shadow-[0_20px_60px_-15px_rgba(13,148,136,0.3)] mt-20"
        >
          <div className="w-24 h-24 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-8 border border-teal-500/30">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-4xl font-bold font-heading text-foreground mb-6">Listing Submitted!</h1>
          <p className="text-xl text-foreground/70 mb-10 leading-relaxed">
            Thank you for posting on The Call Sheet. Our team will review your listing and publish it shortly. You&apos;ll receive an email when it goes live.
          </p>
          <Link
            href="/call-sheet"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-8 py-4 rounded-2xl font-semibold transition-colors border border-white/10"
          >
            <ArrowLeft size={20} />
            Back to The Call Sheet
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background relative z-10 p-4 md:p-8 pt-20">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 flex flex-col items-center text-center">
          <Link href="/call-sheet" className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 font-medium mb-6 transition-colors self-start md:self-auto">
            <ArrowLeft size={18} /> Back to The Call Sheet
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4 text-balance bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">
            Post a Listing
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl text-balance">
            Find your next key collaborator. All listings are reviewed before publishing. Unpaid roles are not accepted.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-[2.5rem] p-6 md:p-12 mb-20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 relative z-10">
            {/* Role Title */}
            <div>
              <label className="block font-semibold mb-2 flex items-center gap-2">
                Role Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Director of Photography"
                value={formData.title || ''}
                onChange={(e) => set('title', e.target.value)}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base placeholder:opacity-40"
              />
            </div>

            {/* Production Title */}
            <div>
              <label className="block font-semibold mb-2 flex items-center gap-2">
                Production Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Shadows of the Karoo"
                value={formData.production_title || ''}
                onChange={(e) => set('production_title', e.target.value)}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base placeholder:opacity-40"
              />
            </div>

            {/* Production Company */}
            <div>
              <label className="block font-semibold mb-2 flex items-center gap-2">
                Production Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cape Light Films"
                value={formData.production_company || ''}
                onChange={(e) => set('production_company', e.target.value)}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base placeholder:opacity-40"
              />
            </div>

            {/* Producer Name */}
            <div>
              <label className="block font-semibold mb-2 flex items-center gap-2">
                Producer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Thandi Mokoena"
                value={formData.producer_name || ''}
                onChange={(e) => set('producer_name', e.target.value)}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base placeholder:opacity-40"
              />
            </div>

            {/* Producer Email */}
            <div>
              <label className="block font-semibold mb-2 flex items-center gap-2">
                Producer Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. thandi@capelightfilms.co.za"
                value={formData.producer_email || ''}
                onChange={(e) => set('producer_email', e.target.value)}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base placeholder:opacity-40"
              />
              <p className="text-xs opacity-40 mt-2">For admin contact only — not shown publicly.</p>
            </div>

            {/* Category */}
            <div>
              <label className="block font-semibold mb-2 flex items-center gap-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category || ''}
                onChange={(e) => set('category', e.target.value)}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base appearance-none"
              >
                <option value="" disabled>Select a category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="col-span-1 md:col-span-2">
              <label className="block font-semibold mb-2 flex items-center gap-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                placeholder="Describe the role, responsibilities, and what you're looking for..."
                value={formData.description || ''}
                onChange={(e) => set('description', e.target.value)}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[140px] transition-all text-base placeholder:opacity-40"
              />
            </div>

            {/* Compensation */}
            <div>
              <label className="block font-semibold mb-2 flex items-center gap-2">
                Compensation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. R2,500/day, $500/week, Negotiable"
                value={formData.compensation || ''}
                onChange={(e) => set('compensation', e.target.value)}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base placeholder:opacity-40"
              />
            </div>

            {/* Compensation Type */}
            <div>
              <label className="block font-semibold mb-2 flex items-center gap-2">
                Compensation Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.compensation_type || 'paid'}
                onChange={(e) => set('compensation_type', e.target.value)}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base appearance-none"
              >
                {compensationTypes.map((ct) => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block font-semibold mb-2 flex items-center gap-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cape Town, South Africa"
                value={formData.location || ''}
                onChange={(e) => set('location', e.target.value)}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base placeholder:opacity-40"
              />
            </div>

            {/* Project Stage */}
            <div>
              <label className="block font-semibold mb-2 flex items-center gap-2">
                Project Stage <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.project_stage || 'pre-production'}
                onChange={(e) => set('project_stage', e.target.value)}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base appearance-none"
              >
                {projectStages.map((ps) => (
                  <option key={ps.value} value={ps.value}>{ps.label}</option>
                ))}
              </select>
            </div>

            {/* Requirements (optional) */}
            <div className="col-span-1 md:col-span-2">
              <label className="block font-semibold mb-2">Requirements</label>
              <textarea
                placeholder="Experience level, specific skills, gear requirements, languages..."
                value={formData.requirements || ''}
                onChange={(e) => set('requirements', e.target.value)}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[100px] transition-all text-base placeholder:opacity-40"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block font-semibold mb-2">Start Date</label>
              <input
                type="text"
                placeholder="e.g. April 2026, TBC"
                value={formData.start_date || ''}
                onChange={(e) => set('start_date', e.target.value)}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base placeholder:opacity-40"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block font-semibold mb-2">Duration</label>
              <input
                type="text"
                placeholder="e.g. 6 weeks, 3 months"
                value={formData.duration || ''}
                onChange={(e) => set('duration', e.target.value)}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base placeholder:opacity-40"
              />
            </div>

            {/* Application URL */}
            <div>
              <label className="block font-semibold mb-2">Application Link</label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.application_url || ''}
                onChange={(e) => set('application_url', e.target.value)}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base placeholder:opacity-40"
              />
              <p className="text-xs opacity-40 mt-2">If blank, applicants will be directed to email the producer.</p>
            </div>

            {/* Website */}
            <div>
              <label className="block font-semibold mb-2">Company Website</label>
              <input
                type="text"
                placeholder="e.g. capelightfilms.co.za"
                value={formData.website || ''}
                onChange={(e) => set('website', e.target.value)}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base placeholder:opacity-40"
              />
            </div>

            {/* Mentorship checkbox */}
            <div className="col-span-1 md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.mentorship_included || false}
                  onChange={(e) => set('mentorship_included', e.target.checked)}
                  className="w-5 h-5 rounded-md bg-black/10 border border-white/20 text-teal-500 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="font-semibold group-hover:text-teal-400 transition-colors">
                  This role includes mentorship
                </span>
              </label>
              <p className="text-xs opacity-40 mt-2 ml-8">Check this if the production will actively mentor and develop the person hired. This badge attracts strong emerging talent.</p>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <p className="text-sm opacity-60 text-center sm:text-left flex items-start gap-2 max-w-md">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-teal-400" />
              All listings are reviewed before publishing. Unpaid roles are not accepted.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-lg transition-all shadow-xl shadow-teal-500/20 hover:-translate-y-1 hover:shadow-teal-500/40 flex items-center justify-center gap-3 ${isSubmitting ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Listing'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
