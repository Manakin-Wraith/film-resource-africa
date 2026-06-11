'use client';

import { useState } from 'react';
import { Mail, Send, CheckCircle2 } from 'lucide-react';
import { submitInquiry, InquiryType } from '@/app/actions';
import { trackContactInquiry } from '@/lib/analytics';
import Modal from '@/components/ui/Modal';
import Input, { Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

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
    <Modal open={isOpen} onClose={onClose} size="md" labelledBy="contact-modal-title">
      <div className="p-8 md:p-10">
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
              <h2 id="contact-modal-title" className="text-3xl font-bold font-heading flex items-center gap-3 pr-14">
                <Mail className="text-primary" /> Get in Touch
              </h2>
              <p className="text-foreground/60">Have a question or feedback? We&apos;d love to hear from you.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input name="name" type="text" label="Name" placeholder="Your name" />
              <Input name="email" type="email" label="Email" placeholder="your@email.com" required />
              <Textarea name="message" label="Message" rows={4} placeholder="How can we help?" required error={error ?? undefined} />
              <Button type="submit" size="lg" fullWidth loading={loading} rightIcon={Send} iconSize={18}>
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </Modal>
  );
}
