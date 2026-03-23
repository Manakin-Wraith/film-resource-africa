'use client';

import { useState, useRef } from 'react';
import { submitCommunitySpotlight, uploadSpotlightImage } from '@/app/actions';
import { AlertCircle, Star, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const spotlightCategories = [
  { value: 'award', label: 'Award / Selection', emoji: '🏆' },
  { value: 'release', label: 'Film Release / Premiere', emoji: '🎬' },
  { value: 'festival', label: 'Festival Selection', emoji: '🎪' },
  { value: 'funding', label: 'Funding Received', emoji: '💰' },
  { value: 'milestone', label: 'Career Milestone', emoji: '🌟' },
  { value: 'other', label: 'Other News', emoji: '📣' },
];

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
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto glass-card rounded-[3rem] p-12 text-center border-yellow-500/20 shadow-[0_20px_60px_-15px_rgba(234,179,8,0.3)]"
      >
        <div className="w-24 h-24 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-8 border border-yellow-500/30">
          <Star size={48} />
        </div>
        <h2 className="text-4xl font-bold font-heading text-foreground mb-6">Submission Received!</h2>
        <p className="text-xl text-foreground/70 mb-10 leading-relaxed">
          Thank you for sharing your story with the FRA community. Our team will review your submission and feature it on the site and in our newsletter.
        </p>
        <button
          onClick={() => { setIsSuccess(false); setFormData({}); setImageFile(null); setImagePreview(null); }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 px-8 py-4 rounded-2xl font-semibold transition-all text-white shadow-lg"
        >
          Submit Another
        </button>
      </motion.div>
    );
  }

  const inputClass = "w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-base placeholder:opacity-40";

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-[2.5rem] p-6 md:p-12 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 relative z-10">
        {/* Your Name */}
        <div>
          <label className="block font-semibold mb-2">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input type="text" required placeholder="e.g. Thandi Mokoena" value={formData.name || ''} onChange={(e) => set('name', e.target.value)} className={inputClass} />
        </div>

        {/* Email */}
        <div>
          <label className="block font-semibold mb-2">
            Your Email <span className="text-red-500">*</span>
          </label>
          <input type="email" required placeholder="e.g. thandi@example.com" value={formData.email || ''} onChange={(e) => set('email', e.target.value)} className={inputClass} />
          <p className="text-xs opacity-40 mt-2">For admin contact only — not shown publicly.</p>
        </div>

        {/* Headline / Title */}
        <div className="col-span-1 md:col-span-2">
          <label className="block font-semibold mb-2">
            Headline <span className="text-red-500">*</span>
          </label>
          <input type="text" required placeholder="e.g. THE TREK Wins Jury Award at Fantasporto" value={formData.title || ''} onChange={(e) => set('title', e.target.value)} className={inputClass} />
        </div>

        {/* Project Name */}
        <div>
          <label className="block font-semibold mb-2">Project / Film Name</label>
          <input type="text" placeholder="e.g. The Trek" value={formData.project_name || ''} onChange={(e) => set('project_name', e.target.value)} className={inputClass} />
        </div>

        {/* Category */}
        <div>
          <label className="block font-semibold mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select required value={formData.category || ''} onChange={(e) => set('category', e.target.value)} className={`${inputClass} appearance-none`}>
            <option value="" disabled>Select a category</option>
            {spotlightCategories.map((c) => (
              <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>

        {/* Summary */}
        <div className="col-span-1 md:col-span-2">
          <label className="block font-semibold mb-2">
            Short Summary <span className="text-red-500">*</span>
          </label>
          <textarea required placeholder="A 1-2 sentence summary that will appear on the news card..." value={formData.summary || ''} onChange={(e) => set('summary', e.target.value)} maxLength={300} className={`${inputClass} min-h-[80px]`} />
          <p className="text-xs opacity-40 mt-2">{(formData.summary || '').length}/300 characters</p>
        </div>

        {/* Full Story */}
        <div className="col-span-1 md:col-span-2">
          <label className="block font-semibold mb-2">
            Full Story <span className="text-red-500">*</span>
          </label>
          <textarea required placeholder="Tell us the full story — background, what happened, cast/crew involved, what this means for your career..." value={formData.story || ''} onChange={(e) => set('story', e.target.value)} className={`${inputClass} min-h-[180px]`} />
        </div>

        {/* Link */}
        <div>
          <label className="block font-semibold mb-2">Related Link</label>
          <input type="url" placeholder="https://..." value={formData.url || ''} onChange={(e) => set('url', e.target.value)} className={inputClass} />
          <p className="text-xs opacity-40 mt-2">Trailer, press release, festival page, etc.</p>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block font-semibold mb-2">Image</label>
          {imagePreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-white/10">
              <Image src={imagePreview} alt="Preview" width={400} height={200} className="w-full h-40 object-cover" />
              <button type="button" onClick={removeImage} className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-40 border-2 border-dashed border-white/10 hover:border-yellow-500/30 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors group cursor-pointer">
              <div className="w-12 h-12 bg-white/5 group-hover:bg-yellow-500/10 rounded-full flex items-center justify-center transition-colors">
                <Upload size={20} className="text-foreground/40 group-hover:text-yellow-400 transition-colors" />
              </div>
              <span className="text-sm text-foreground/40 group-hover:text-foreground/60">Upload a photo (max 5MB)</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageSelect} className="hidden" />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
        <p className="text-sm opacity-60 text-center sm:text-left flex items-start gap-2 max-w-md">
          <Star size={18} className="flex-shrink-0 mt-0.5 text-yellow-400" />
          Submissions are reviewed before publishing. Approved stories are featured on the site and in our weekly newsletter.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-bold text-lg transition-all shadow-xl shadow-yellow-500/20 hover:-translate-y-1 hover:shadow-yellow-500/40 flex items-center justify-center gap-3 ${isSubmitting ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
        >
          {uploading ? 'Uploading image...' : isSubmitting ? 'Submitting...' : 'Submit Your Story'}
        </button>
      </div>
    </form>
  );
}
