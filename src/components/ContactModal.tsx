'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitInquiry, InquiryType } from '@/app/actions';
import { trackContactInquiry } from '@/lib/analytics';

export default function ContactModal({ isOpen, onClose, inquiryType = 'general', source }: { isOpen: boolean, onClose: () => void, inquiryType?: InquiryType, source?: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const inquiry = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      message: formData.get('message') as string,
    };

    try {
      await submitInquiry(inquiry, inquiryType, source);
      trackContactInquiry(inquiryType, source);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-h-screen">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl p-8 md:p-10"
            style={{ background: 'var(--surface)' }}
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors border border-white/10"
            >
              <X size={20} />
            </button>

            {success ? (
              <div className="py-12 text-center space-y-6">
                <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                  <CheckCircle2 size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold font-heading">Message Sent!</h3>
                  <p className="text-foreground/60">We&apos;ll get back to you at your email soon.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold font-heading flex items-center gap-3">
                    <Mail className="text-primary" /> Get in Touch
                  </h2>
                  <p className="text-foreground/60">Have a question or feedback? We&apos;d love to hear from you.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold opacity-70 ml-1">Name</label>
                    <input
                      name="name"
                      type="text"
                      placeholder="Your name"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold opacity-70 ml-1">Email <span className="text-accent">*</span></label>
                    <input
                      required
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold opacity-70 ml-1">Message <span className="text-accent">*</span></label>
                    <textarea
                      required
                      name="message"
                      rows={4}
                      placeholder="How can we help?"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground resize-none"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 text-red-400 p-4 rounded-xl flex items-center gap-3 border border-red-500/20 text-sm">
                      <AlertCircle size={18} />
                      {error}
                    </div>
                  )}

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-primary hover:bg-blue-600 disabled:opacity-50 text-white rounded-2xl py-4 font-bold text-lg transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    <span>{loading ? 'Sending...' : 'Send Message'}</span>
                    <Send size={18} className={loading ? 'animate-pulse' : ''} />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
