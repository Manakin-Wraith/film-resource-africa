'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, CheckCircle2, Building2, Users, Wrench, GraduationCap, Briefcase, Upload, X, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { submitDirectoryListing, uploadDirectoryImage } from '@/app/actions';
import { directoryTypes, getCategoriesForType, africanCountries } from '@/lib/industryDirectoryConfig';

const typeIcons: Record<string, typeof Building2> = {
  company: Building2,
  crew: Users,
  service: Wrench,
  training: GraduationCap,
  agency: Briefcase,
};

export default function SubmitDirectoryListingPage() {
  const [directoryType, setDirectoryType] = useState<string>('company');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = getCategoriesForType(directoryType);

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let logoUrl = formData.logo_url || undefined;

      if (logoFile) {
        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', logoFile);
        logoUrl = await uploadDirectoryImage(uploadData);
        setUploading(false);
      }

      await submitDirectoryListing({
        name: formData.name || '',
        directory_type: directoryType as any,
        category: formData.category === '__other' ? (formData.custom_category || 'Other') : (formData.category || ''),
        description: formData.description || '',
        country: formData.country || '',
        city: formData.city || undefined,
        website: formData.website || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        logo_url: logoUrl,
        // Company
        speciality: formData.speciality || undefined,
        notable_projects: formData.notable_projects || undefined,
        year_founded: formData.year_founded ? parseInt(formData.year_founded) : undefined,
        company_size: (formData.company_size as any) || undefined,
        // Crew
        role: formData.role || undefined,
        secondary_roles: formData.secondary_roles || undefined,
        bio: formData.bio || undefined,
        portfolio_url: formData.portfolio_url || undefined,
        credits: formData.credits || undefined,
        availability: (formData.availability as any) || undefined,
        day_rate_range: formData.day_rate_range || undefined,
        // Service
        service_type: formData.service_type || undefined,
        pricing_tier: (formData.pricing_tier as any) || undefined,
        // Training
        program_type: (formData.program_type as any) || undefined,
        duration: formData.duration || undefined,
        cost: formData.cost || undefined,
        accreditation: formData.accreditation || undefined,
        next_intake: formData.next_intake || undefined,
        submitted_by_email: formData.submitted_by_email || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <div className="relative z-10 container mx-auto px-4 py-12 pt-32 md:pt-28 max-w-2xl">
          <div className="text-center space-y-6 py-20">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
              <CheckCircle2 size={40} className="text-green-400" />
            </div>
            <h1 className="text-3xl font-bold font-heading">Listing Submitted!</h1>
            <p className="text-foreground/60 max-w-md mx-auto">
              Your listing has been submitted for review. We&apos;ll review it within 48 hours and notify you once it&apos;s live.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/industry" className="inline-flex items-center gap-2 bg-primary hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all shadow-lg text-sm">
                View Directory
              </Link>
              <button onClick={() => { setSuccess(false); setFormData({}); }} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-foreground font-semibold py-3 px-6 rounded-2xl transition-all border border-white/10 text-sm">
                Submit Another
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm";
  const labelClass = "block text-sm font-semibold text-foreground/80 mb-1.5";

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 py-12 pt-32 md:pt-28 max-w-2xl">
        <Link href="/industry" className="inline-flex items-center gap-2 text-foreground/50 hover:text-foreground text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Industry Directory
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold font-heading mb-2">Add Your Listing</h1>
        <p className="text-foreground/60 mb-10">Get discovered by filmmakers, producers, and the African film community.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Type selection */}
          <div>
            <label className={labelClass}>What type of listing is this? *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(directoryTypes).map(([key, dt]) => {
                const Icon = typeIcons[key] || Building2;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setDirectoryType(key); setFormData(prev => ({ ...prev, category: '' })); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      directoryType === key
                        ? `bg-gradient-to-br ${dt.bg} ${dt.border} ring-2 ring-primary/50`
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Icon size={24} className={directoryType === key ? dt.color : 'text-foreground/40'} />
                    <span className={`text-xs font-semibold ${directoryType === key ? 'text-foreground' : 'text-foreground/60'}`}>
                      {dt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className={labelClass}>{directoryType === 'crew' ? 'Full Name' : 'Company / Organisation Name'} *</label>
              <input type="text" required value={formData.name || ''} onChange={(e) => updateField('name', e.target.value)} className={inputClass} placeholder={directoryType === 'crew' ? 'e.g. Ayo Ogundimu' : 'e.g. Kunle Afolayan Productions'} />
            </div>

            <div>
              <label className={labelClass}>Category *</label>
              <select required={formData.category !== '__other'} value={formData.category === '__other' || (!categories.find(c => c.value === formData.category) && formData.category) ? '__other' : formData.category || ''} onChange={(e) => {
                if (e.target.value === '__other') {
                  updateField('category', '__other');
                  updateField('custom_category', '');
                } else {
                  updateField('category', e.target.value);
                  updateField('custom_category', '');
                }
              }} className={inputClass}>
                <option value="">Select category...</option>
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                <option value="__other">Other (specify below)</option>
              </select>
              {(formData.category === '__other') && (
                <input
                  type="text"
                  required
                  value={formData.custom_category || ''}
                  onChange={(e) => updateField('custom_category', e.target.value)}
                  className={`${inputClass} mt-2`}
                  placeholder="Enter your category..."
                />
              )}
            </div>

            <div>
              <label className={labelClass}>Country *</label>
              <select required value={formData.country || ''} onChange={(e) => updateField('country', e.target.value)} className={inputClass}>
                <option value="">Select country...</option>
                {africanCountries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>City</label>
              <input type="text" value={formData.city || ''} onChange={(e) => updateField('city', e.target.value)} className={inputClass} placeholder="e.g. Lagos, Nairobi, Johannesburg" />
            </div>

            <div>
              <label className={labelClass}>Website</label>
              <input type="url" value={formData.website || ''} onChange={(e) => updateField('website', e.target.value)} className={inputClass} placeholder="https://..." />
            </div>

            <div>
              <label className={labelClass}>Contact Email</label>
              <input type="email" value={formData.email || ''} onChange={(e) => updateField('email', e.target.value)} className={inputClass} placeholder="hello@company.com" />
            </div>

            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" value={formData.phone || ''} onChange={(e) => updateField('phone', e.target.value)} className={inputClass} placeholder="+234..." />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Description *</label>
              <textarea required rows={4} value={formData.description || ''} onChange={(e) => updateField('description', e.target.value)} className={inputClass} placeholder="Tell us about your work, expertise, and what makes you unique..." />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Logo / Image</label>
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="w-20 h-20 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} className="text-foreground/20" />
                  )}
                </div>
                <div className="flex-grow space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          setError('Image too large. Maximum size is 5MB.');
                          return;
                        }
                        setLogoFile(file);
                        setLogoPreview(URL.createObjectURL(file));
                        setError('');
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium text-foreground/70 hover:text-foreground"
                  >
                    <Upload size={16} />
                    {logoFile ? 'Change Image' : 'Upload Image'}
                  </button>
                  {logoFile && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground/50 truncate max-w-[200px]">{logoFile.name}</span>
                      <button
                        type="button"
                        onClick={() => { setLogoFile(null); setLogoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="text-foreground/30 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-foreground/30">JPG, PNG, WebP, GIF, or SVG. Max 5MB.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Type-specific fields */}
          {directoryType === 'company' && (
            <div className="space-y-5 border-t border-white/10 pt-8">
              <h3 className="text-lg font-bold font-heading text-blue-400">Company Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Speciality</label>
                  <input type="text" value={formData.speciality || ''} onChange={(e) => updateField('speciality', e.target.value)} className={inputClass} placeholder="e.g. Fiction, Documentary, Commercial" />
                </div>
                <div>
                  <label className={labelClass}>Year Founded</label>
                  <input type="number" value={formData.year_founded || ''} onChange={(e) => updateField('year_founded', e.target.value)} className={inputClass} placeholder="e.g. 2015" />
                </div>
                <div>
                  <label className={labelClass}>Company Size</label>
                  <select value={formData.company_size || ''} onChange={(e) => updateField('company_size', e.target.value)} className={inputClass}>
                    <option value="">Select...</option>
                    <option value="indie">Independent</option>
                    <option value="mid">Mid-Size</option>
                    <option value="major">Major Studio</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Notable Projects</label>
                  <textarea rows={3} value={formData.notable_projects || ''} onChange={(e) => updateField('notable_projects', e.target.value)} className={inputClass} placeholder="List your key projects, awards, or achievements..." />
                </div>
              </div>
            </div>
          )}

          {directoryType === 'crew' && (
            <div className="space-y-5 border-t border-white/10 pt-8">
              <h3 className="text-lg font-bold font-heading text-green-400">Crew Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Primary Role *</label>
                  <input type="text" value={formData.role || ''} onChange={(e) => updateField('role', e.target.value)} className={inputClass} placeholder="e.g. Director of Photography" />
                </div>
                <div>
                  <label className={labelClass}>Other Roles</label>
                  <input type="text" value={formData.secondary_roles || ''} onChange={(e) => updateField('secondary_roles', e.target.value)} className={inputClass} placeholder="e.g. Colorist, Camera Operator" />
                </div>
                <div>
                  <label className={labelClass}>Availability</label>
                  <select value={formData.availability || ''} onChange={(e) => updateField('availability', e.target.value)} className={inputClass}>
                    <option value="">Select...</option>
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="selective">Selective</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Day Rate Range</label>
                  <input type="text" value={formData.day_rate_range || ''} onChange={(e) => updateField('day_rate_range', e.target.value)} className={inputClass} placeholder="e.g. $200-400 or Negotiable" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Portfolio / Reel URL</label>
                  <input type="url" value={formData.portfolio_url || ''} onChange={(e) => updateField('portfolio_url', e.target.value)} className={inputClass} placeholder="https://vimeo.com/... or https://youtube.com/..." />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Credits / Filmography</label>
                  <textarea rows={3} value={formData.credits || ''} onChange={(e) => updateField('credits', e.target.value)} className={inputClass} placeholder="List your notable credits..." />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Bio</label>
                  <textarea rows={3} value={formData.bio || ''} onChange={(e) => updateField('bio', e.target.value)} className={inputClass} placeholder="A short professional bio..." />
                </div>
              </div>
            </div>
          )}

          {directoryType === 'service' && (
            <div className="space-y-5 border-t border-white/10 pt-8">
              <h3 className="text-lg font-bold font-heading text-purple-400">Service Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Service Type</label>
                  <input type="text" value={formData.service_type || ''} onChange={(e) => updateField('service_type', e.target.value)} className={inputClass} placeholder="e.g. Camera Rental, Sound Stage" />
                </div>
                <div>
                  <label className={labelClass}>Pricing Tier</label>
                  <select value={formData.pricing_tier || ''} onChange={(e) => updateField('pricing_tier', e.target.value)} className={inputClass}>
                    <option value="">Select...</option>
                    <option value="budget">Budget-Friendly</option>
                    <option value="mid">Mid-Range</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {directoryType === 'agency' && (
            <div className="space-y-5 border-t border-white/10 pt-8">
              <h3 className="text-lg font-bold font-heading text-pink-400">Agency Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Speciality</label>
                  <input type="text" value={formData.speciality || ''} onChange={(e) => updateField('speciality', e.target.value)} className={inputClass} placeholder="e.g. On-screen talent, Below-the-line crew" />
                </div>
                <div>
                  <label className={labelClass}>Year Founded</label>
                  <input type="number" value={formData.year_founded || ''} onChange={(e) => updateField('year_founded', e.target.value)} className={inputClass} placeholder="e.g. 2010" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Notable Talent / Projects</label>
                  <textarea rows={3} value={formData.notable_projects || ''} onChange={(e) => updateField('notable_projects', e.target.value)} className={inputClass} placeholder="List key talent or productions you've placed..." />
                </div>
              </div>
            </div>
          )}

          {directoryType === 'training' && (
            <div className="space-y-5 border-t border-white/10 pt-8">
              <h3 className="text-lg font-bold font-heading text-amber-400">Training Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Program Type</label>
                  <select value={formData.program_type || ''} onChange={(e) => updateField('program_type', e.target.value)} className={inputClass}>
                    <option value="">Select...</option>
                    <option value="school">Film School</option>
                    <option value="workshop">Workshop</option>
                    <option value="online">Online Program</option>
                    <option value="mentorship">Mentorship</option>
                    <option value="masterclass">Masterclass</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Duration</label>
                  <input type="text" value={formData.duration || ''} onChange={(e) => updateField('duration', e.target.value)} className={inputClass} placeholder="e.g. 3 years, 2 weeks, Self-paced" />
                </div>
                <div>
                  <label className={labelClass}>Cost</label>
                  <input type="text" value={formData.cost || ''} onChange={(e) => updateField('cost', e.target.value)} className={inputClass} placeholder="e.g. Free, $500, Varies" />
                </div>
                <div>
                  <label className={labelClass}>Next Intake</label>
                  <input type="text" value={formData.next_intake || ''} onChange={(e) => updateField('next_intake', e.target.value)} className={inputClass} placeholder="e.g. September 2026" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Accreditation</label>
                  <input type="text" value={formData.accreditation || ''} onChange={(e) => updateField('accreditation', e.target.value)} className={inputClass} placeholder="e.g. CILECT member, government accredited" />
                </div>
              </div>
            </div>
          )}

          {/* Submitter email */}
          <div className="border-t border-white/10 pt-8">
            <label className={labelClass}>Your Email (for updates on your listing)</label>
            <input type="email" value={formData.submitted_by_email || ''} onChange={(e) => updateField('submitted_by_email', e.target.value)} className={inputClass} placeholder="your@email.com" />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-primary/20 text-base"
          >
            {uploading ? 'Uploading image...' : submitting ? 'Submitting...' : 'Submit Listing for Review'}
          </button>

          <p className="text-center text-foreground/30 text-xs">
            All listings are reviewed by our team before going live. This usually takes 24–48 hours.
          </p>
        </form>
      </div>
    </main>
  );
}
