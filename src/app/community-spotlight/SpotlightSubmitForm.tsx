'use client';

import { useState, useRef } from 'react';
import { submitCommunitySpotlight, uploadSpotlightImage } from '@/app/actions';
import { AlertCircle, Star, Upload, X, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

const spotlightCategories = [
  { value: 'award', label: 'Award / Selection', emoji: '🏆' },
  { value: 'release', label: 'Film Release / Premiere', emoji: '🎬' },
  { value: 'festival', label: 'Festival Selection', emoji: '🎪' },
  { value: 'funding', label: 'Funding Received', emoji: '💰' },
  { value: 'milestone', label: 'Career Milestone', emoji: '🌟' },
  { value: 'other', label: 'Other News', emoji: '📣' },
];

const inputClass = "w-full border border-white/[0.12] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/40 transition-colors text-foreground placeholder:text-foreground/30 bg-white/[0.04]";

export default function SpotlightSubmitForm() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (key: string, value: string) => setFormData({ ...formData, [key]: value });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image too large. Maximum size is 5MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', imageFile);
        imageUrl = await uploadSpotlightImage(uploadData);
        setUploading(false);
      }
      await submitCommunitySpotlight({
        title: formData.title || '',
        summary: formData.summary || '',
        content: formData.story || '',
        project_name: formData.project_name || undefined,
        submitted_by_name: formData.name || '',
        submitted_by_email: formData.email || '',
        url: formData.url || undefined,
        image_url: imageUrl,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl rounded-xl p-10 text-center border border-amber-500/20" style={{ background: 'var(--surface)' }}>
        <CheckCircle2 size={40} className="text-amber-400 mx-auto mb-5" />
        <h2 className="text-[24px] font-bold font-heading text-foreground mb-3">Submission Received</h2>
        <p className="text-[14px] leading-relaxed mb-8" style={{ color: 'var(--foreground-secondary)' }}>
          Thank you for sharing your story. Our team will review it and feature it on the site and in the weekly newsletter.
        </p>
        <button
          onClick={() => { setIsSuccess(false); setFormData({}); setImageFile(null); setImagePreview(null); }}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 px-6 py-3 rounded-xl font-semibold transition-colors text-white text-sm"
        >
          Submit Another Story
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-6 md:p-8 border border-white/[0.08]"
      style={{ background: 'var(--surface)' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div>
          <label className="block text-[13px] font-semibold mb-1.5">
            Your Name <span className="text-red-400">*</span>
          </label>
          <input type="text" required placeholder="e.g. Thandi Mokoena" value={formData.name || ''} onChange={(e) => set('name', e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block text-[13px] font-semibold mb-1.5">
            Your Email <span className="text-red-400">*</span>
          </label>
          <input type="email" required placeholder="e.g. thandi@example.com" value={formData.email || ''} onChange={(e) => set('email', e.target.value)} className={inputClass} />
          <p className="text-[11px] mt-1.5" style={{ color: 'var(--foreground-tertiary)' }}>For admin contact only — not shown publicly.</p>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-[13px] font-semibold mb-1.5">
            Headline <span className="text-red-400">*</span>
          </label>
          <input type="text" required placeholder="e.g. THE TREK Wins Jury Award at Fantasporto" value={formData.title || ''} onChange={(e) => set('title', e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block text-[13px] font-semibold mb-1.5">Project / Film Name</label>
          <input type="text" placeholder="e.g. The Trek" value={formData.project_name || ''} onChange={(e) => set('project_name', e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block text-[13px] font-semibold mb-1.5">
            Category <span className="text-red-400">*</span>
          </label>
          <select required value={formData.category || ''} onChange={(e) => set('category', e.target.value)} className={`${inputClass} appearance-none`}>
            <option value="" disabled>Select a category</option>
            {spotlightCategories.map((c) => (
              <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-[13px] font-semibold mb-1.5">
            Short Summary <span className="text-red-400">*</span>
          </label>
          <textarea required placeholder="A 1-2 sentence summary that will appear on the news card..." value={formData.summary || ''} onChange={(e) => set('summary', e.target.value)} maxLength={300} className={`${inputClass} min-h-[80px] resize-none`} />
          <p className="text-[11px] mt-1" style={{ color: 'var(--foreground-tertiary)' }}>{(formData.summary || '').length}/300</p>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-[13px] font-semibold mb-1.5">
            Full Story <span className="text-red-400">*</span>
          </label>
          <textarea required placeholder="Tell us the full story — background, what happened, cast/crew involved, what this means for your career..." value={formData.story || ''} onChange={(e) => set('story', e.target.value)} className={`${inputClass} min-h-[160px] resize-none`} />
        </div>

        <div>
          <label className="block text-[13px] font-semibold mb-1.5">Related Link</label>
          <input type="url" placeholder="https://..." value={formData.url || ''} onChange={(e) => set('url', e.target.value)} className={inputClass} />
          <p className="text-[11px] mt-1.5" style={{ color: 'var(--foreground-tertiary)' }}>Trailer, press release, festival page, etc.</p>
        </div>

        <div>
          <label className="block text-[13px] font-semibold mb-1.5">Image</label>
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-white/[0.1]">
              <Image src={imagePreview} alt="Preview" width={400} height={160} className="w-full h-36 object-cover" />
              <button type="button" onClick={removeImage} className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-lg flex items-center justify-center transition-colors">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-36 border border-dashed border-white/[0.16] hover:border-amber-500/30 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors group cursor-pointer" style={{ background: 'var(--surface-raised)' }}>
              <Upload size={18} className="text-foreground/30 group-hover:text-amber-400 transition-colors" />
              <span className="text-[12px]" style={{ color: 'var(--foreground-tertiary)' }}>Upload a photo (max 5MB)</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageSelect} className="hidden" />
        </div>

      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-5">
        <p className="text-[13px] flex items-start gap-2 max-w-md" style={{ color: 'var(--foreground-secondary)' }}>
          <Star size={15} className="flex-shrink-0 mt-0.5 text-amber-400" />
          Submissions are reviewed before publishing. Approved stories are featured on the site and in the weekly newsletter.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full sm:w-auto px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {uploading ? 'Uploading image…' : isSubmitting ? 'Submitting…' : 'Submit Your Story'}
        </button>
      </div>
    </form>
  );
}
