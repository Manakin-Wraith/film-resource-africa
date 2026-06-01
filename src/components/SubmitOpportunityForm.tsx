'use client';

import { useState } from 'react';
import { submitMemberOpportunity, Opportunity } from '@/app/actions';
import { directoryCategories } from '@/lib/directoryConfig';
import { Upload, CheckCircle2, AlertCircle, ArrowLeft, Globe2, Lock } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

type Scope = 'public' | 'members';

export default function SubmitOpportunityForm({ memberName }: { memberName: string }) {
  const [formData, setFormData] = useState<Partial<Opportunity>>({});
  const [scope, setScope] = useState<Scope>('public');
  const [category, setCategory] = useState<string>(directoryCategories[0].key);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await submitMemberOpportunity(formData, {
        scope,
        category: scope === 'public' ? category : undefined,
      });
      setIsSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'NOT_BUSINESS') setError('Promoting opportunities is a Business-tier benefit.');
      else if (msg === 'NOT_A_MEMBER') setError('Please log in as a member to submit.');
      else setError('Something went wrong saving your submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="relative z-10 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto rounded-2xl p-12 text-center border border-white/[0.08] mt-20"
          style={{ background: 'var(--surface)' }}
        >
          <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/30">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-4xl font-bold font-heading text-foreground mb-6">Sent for review</h1>
          <p className="text-xl text-foreground/70 mb-10 leading-relaxed">
            Thanks, {memberName.split(' ')[0]}. Your listing is with our moderators and will go live{' '}
            {scope === 'members' ? 'in the members feed' : 'on the Directory'} once approved.
          </p>
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-8 py-4 rounded-2xl font-semibold transition-colors border border-white/10"
          >
            <ArrowLeft size={20} />
            Back to Directory
          </Link>
        </motion.div>
      </div>
    );
  }

  const fields: { key: keyof Opportunity; label: string; required: boolean; multiline?: boolean; placeholder?: string }[] = [
    { key: 'title', label: 'Opportunity Title', required: true, placeholder: 'e.g. Durban FilmMart Pitch Forum' },
    { key: 'For Films or Series?', label: 'Format / Category', required: true, placeholder: 'e.g. Feature Films, Series, Labs' },
    { key: 'What Is It?', label: 'Description (What is it?)', required: true, multiline: true, placeholder: 'Provide a comprehensive description of the opportunity...' },
    { key: 'Who Can Apply / Eligibility', label: 'Eligibility', required: true, multiline: true, placeholder: 'Who is eligible to apply?' },
    { key: 'What Do You Get If Selected?', label: 'What Do You Get If Selected?', required: false, multiline: true },
    { key: 'What to Submit', label: 'What To Submit', required: false, multiline: true },
    { key: 'Cost', label: 'Cost & Fees', required: false, placeholder: 'e.g. Free, $50 Application Fee' },
    { key: 'Next Deadline', label: 'Upcoming Deadline', required: true, placeholder: 'e.g. March 15, 2026' },
    { key: 'Apply:', label: 'Application Link', required: true, placeholder: 'e.g. https://example.com/apply' },
    { key: 'Strongest Submission Tips', label: 'Insider Tips (Optional)', required: false, multiline: true },
    { key: 'CALENDAR REMINDER:', label: 'Calendar Reminder Note (Optional)', required: false },
  ];

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-6 md:p-12 mb-20 border border-white/[0.08]" style={{ background: 'var(--surface)' }}>
      <p className="text-sm text-foreground/50 mb-8">Posting as <span className="font-semibold text-foreground">{memberName}</span></p>

      {/* Visibility control */}
      <div className="mb-10">
        <label className="block font-semibold mb-3">Where should this appear?</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { val: 'public' as Scope, icon: Globe2, title: 'Public Directory', desc: 'Visible to everyone, indexed for search.' },
            { val: 'members' as Scope, icon: Lock, title: 'Members-only feed', desc: 'Visible only to FRA members.' },
          ]).map(({ val, icon: Icon, title, desc }) => (
            <button
              type="button"
              key={val}
              onClick={() => setScope(val)}
              className={`text-left p-4 rounded-2xl border transition-all ${
                scope === val ? 'border-primary/60 bg-primary/10' : 'border-white/[0.1] hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold mb-1">
                <Icon size={16} className={scope === val ? 'text-primary' : 'text-foreground/50'} />
                {title}
              </div>
              <p className="text-sm text-foreground/55">{desc}</p>
            </button>
          ))}
        </div>

        {scope === 'public' && (
          <div className="mt-4">
            <label className="block font-semibold mb-2">Directory category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base"
            >
              {directoryCategories.map((c) => (
                <option key={c.key} value={c.key} style={{ background: '#18181b' }}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Logo upload */}
      <div className="mb-10 flex flex-col md:flex-row items-start md:items-center gap-6 bg-white/5 p-6 rounded-2xl border border-white/[0.08]">
        <div className="w-24 h-24 bg-black/20 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
          {formData.logo ? (
            <img src={formData.logo} className="w-full h-full object-contain" alt="Logo preview" />
          ) : (
            <div className="text-center flex flex-col items-center gap-1 opacity-50">
              <Upload size={24} />
              <span className="text-[10px] uppercase font-bold tracking-wider">Logo</span>
            </div>
          )}
        </div>
        <div className="flex-grow">
          <label className="block text-lg font-bold font-heading text-primary mb-2">Upload Organization Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setFormData({ ...formData, logo: reader.result as string });
                reader.readAsDataURL(file);
              }
            }}
            className="mt-1 block w-full text-sm text-foreground/70 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary file:text-white hover:file:bg-blue-600 file:cursor-pointer file:transition-colors focus:outline-none"
          />
          <p className="text-sm opacity-60 mt-3 text-balance">Optional: a high-resolution, square logo for the organization or programme.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
        {fields.map((field) => (
          <div key={field.key} className={field.multiline ? 'col-span-1 md:col-span-2' : ''}>
            <label className="block font-semibold mb-2 flex items-center gap-2">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.multiline ? (
              <textarea
                required={field.required}
                placeholder={field.placeholder || ''}
                value={(formData[field.key] as string) || ''}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[140px] transition-all text-base placeholder:opacity-40"
              />
            ) : (
              <input
                type="text"
                required={field.required}
                placeholder={field.placeholder || ''}
                value={(formData[field.key] as string) || ''}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base placeholder:opacity-40"
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-8 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </p>
      )}

      <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <p className="text-sm opacity-60 text-center sm:text-left flex items-start gap-2 max-w-md">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-accent" />
          Member submissions are reviewed before publishing to keep the Directory accurate.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full sm:w-auto px-10 py-4 rounded-2xl bg-primary hover:bg-blue-600 text-white font-bold text-lg transition-colors flex items-center justify-center gap-3 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit for review'}
        </button>
      </div>
    </form>
  );
}
