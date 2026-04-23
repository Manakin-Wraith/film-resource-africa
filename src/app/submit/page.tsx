'use client';

import { useState } from 'react';
import { submitPublicOpportunity, Opportunity } from '@/app/actions';
import { Search, Globe2, FileText, Upload, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function SubmitComponent() {
  const [formData, setFormData] = useState<Partial<Opportunity>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Auto-approve rule: We don't have one right now, always pending
    try {
      await submitPublicOpportunity(formData as Omit<Opportunity, 'id' | 'status'>);
      setIsSuccess(true);
    } catch (error) {
      console.error("Submission failed", error);
      alert("Something went wrong saving your submission. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background relative z-10 flexitems-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto rounded-2xl p-12 text-center border border-white/[0.08] mt-20"
          style={{ background: 'var(--surface)' }}
        >
          <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/30">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-4xl font-bold font-heading text-foreground mb-6">Submission Successful!</h1>
          <p className="text-xl text-foreground/70 mb-10 leading-relaxed">
            Thank you for contributing to Film Resource Africa. Your opportunity has been sent to our moderators for review and will be live on the directory shortly.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-8 py-4 rounded-2xl font-semibold transition-colors border border-white/10"
          >
            <ArrowLeft size={20} />
            Return to Directory
          </Link>
        </motion.div>
      </div>
    );
  }

  const fields: { key: keyof Opportunity, label: string, required: boolean, multiline?: boolean, placeholder?: string }[] = [
    { key: "title", label: "Opportunity Title", required: true, placeholder: "e.g. Durban FilmMart Pitch Forum" },
    { key: "For Films or Series?", label: "Format / Category", required: true, placeholder: "e.g. Feature Films, Series, Labs" },
    { key: "What Is It?", label: "Description (What is it?)", required: true, multiline: true, placeholder: "Provide a comprehensive description of the opportunity..." },
    { key: "Who Can Apply / Eligibility", label: "Eligibility", required: true, multiline: true, placeholder: "Who is eligible to apply?" },
    { key: "What Do You Get If Selected?", label: "What Do You Get If Selected?", required: false, multiline: true },
    { key: "What to Submit", label: "What To Submit", required: false, multiline: true },
    { key: "Cost", label: "Cost & Fees", required: false, placeholder: "e.g. Free, $50 Application Fee" },
    { key: "Next Deadline", label: "Upcoming Deadline", required: true, placeholder: "e.g. March 15, 2026" },
    { key: "Apply:", label: "Application Link", required: true, placeholder: "e.g. https://example.com/apply" },
    { key: "Strongest Submission Tips", label: "Insider Tips (Optional)", required: false, multiline: true },
    { key: "CALENDAR REMINDER:", label: "Calendar Reminder Note (Optional)", required: false },
  ];

  return (
    <main className="min-h-screen bg-background relative z-10 p-4 md:p-8 pt-20">
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-blue-400 font-medium mb-6 transition-colors self-start md:self-auto">
            <ArrowLeft size={18} /> Back to Directory
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4 text-balance">
            Submit an Opportunity
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl text-balance">
            Help grow the Film Resource Africa directory. Fill out the details below and our team will review your submission before adding it to the live database.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl p-6 md:p-12 mb-20 border border-white/[0.08]" style={{ background: 'var(--surface)' }}>
          {/* Logo Upload Section */}
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
                    reader.onloadend = () => {
                      setFormData({ ...formData, logo: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="mt-1 block w-full text-sm text-foreground/70
                  file:mr-4 file:py-3 file:px-6
                  file:rounded-xl file:border-0
                  file:text-sm file:font-bold
                  file:bg-primary file:text-white
                  hover:file:bg-blue-600 file:cursor-pointer file:transition-colors focus:outline-none"
              />
              <p className="text-sm opacity-60 mt-3 text-balance">
                Optional: Upload a high-resolution, square logo for the organization or program. Max size 2MB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
            {fields.map(field => (
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
                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[140px] transition-all text-base placeholder:opacity-40"
                  />
                ) : (
                  <input 
                    type="text"
                    required={field.required}
                    placeholder={field.placeholder || ''}
                    value={(formData[field.key] as string) || ''}
                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full bg-black/10 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base placeholder:opacity-40"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-sm opacity-60 text-center sm:text-left flex items-start gap-2 max-w-md">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-accent" />
              Submissions are reviewed by our team to ensure accuracy and relevance entirely before publishing.
            </p>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-10 py-4 rounded-2xl bg-primary hover:bg-blue-600 text-white font-bold text-lg transition-colors flex items-center justify-center gap-3 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
