'use client';

import { useState } from 'react';
import { Opportunity, updateOpportunity, deleteOpportunity, addOpportunity, CallSheetListing, updateCallSheetListing, deleteCallSheetListing, DirectoryListing, updateDirectoryListing, deleteDirectoryListing, Partner, addPartner, updatePartner, deletePartner, uploadDirectoryImage, NewsItem, updateNewsItem, deleteNewsItem } from '@/app/actions';
import { Edit2, Trash2, Plus, X, CheckCircle2, Clapperboard, Building2, Handshake, Upload, Crown, Star, Package, FileText, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminClient({ initialData, callSheetData = [], directoryData = [], partnerData = [], newsData = [] }: { initialData: Opportunity[]; callSheetData?: CallSheetListing[]; directoryData?: DirectoryListing[]; partnerData?: Partner[]; newsData?: NewsItem[] }) {
  const [data, setData] = useState<Opportunity[]>(initialData);
  const [csData, setCsData] = useState<CallSheetListing[]>(callSheetData);
  const [dirData, setDirData] = useState<DirectoryListing[]>(directoryData);
  const [pData, setPData] = useState<Partner[]>(partnerData);
  const [nData, setNData] = useState<NewsItem[]>(newsData);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCsId, setEditingCsId] = useState<string | null>(null);
  const [editingDirId, setEditingDirId] = useState<number | null>(null);
  const [editingPartnerId, setEditingPartnerId] = useState<number | null>(null);
  const [editingNewsId, setEditingNewsId] = useState<number | null>(null);
  const [isAddingPartner, setIsAddingPartner] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'callsheet' | 'industry' | 'partners' | 'spotlight'>('approved');
  const router = useRouter();

  // Temporary form state
  const [formData, setFormData] = useState<Partial<Opportunity>>({});
  const [csFormData, setCsFormData] = useState<Partial<CallSheetListing>>({});
  const [dirFormData, setDirFormData] = useState<Partial<DirectoryListing>>({});
  const [partnerForm, setPartnerForm] = useState<Partial<Partner>>({});
  const [newsFormData, setNewsFormData] = useState<Partial<NewsItem>>({});
  const [partnerLogoFile, setPartnerLogoFile] = useState<File | null>(null);
  const [partnerLogoPreview, setPartnerLogoPreview] = useState<string | null>(null);
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null);
  const [partnerSaving, setPartnerSaving] = useState(false);

  const handleEdit = (opp: Opportunity) => {
    setEditingId(opp.id);
    setFormData(opp);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    await deleteOpportunity(id);
    setData(data.filter(o => o.id !== id));
    router.refresh();
  };

  const handleSave = async () => {
    if (editingId) {
      const updated = await updateOpportunity(editingId, formData);
      setData(data.map(o => o.id === editingId ? updated : o));
    } else if (isAdding) {
      const added = await addOpportunity(formData as Omit<Opportunity, 'id'>);
      setData([...data, added]);
    }
    setEditingId(null);
    setIsAdding(false);
    setFormData({});
    router.refresh();
  };

  const fields: (keyof Opportunity)[] = [
    "title", "What Is It?", "For Films or Series?", "What Do You Get If Selected?",
    "Cost", "Next Deadline", "Apply:", "Who Can Apply / Eligibility",
    "What to Submit", "Strongest Submission Tips", "CALENDAR REMINDER:"
  ];

  if (editingId || isAdding) {
    return (
      <div className="glass-card p-6 rounded-2xl relative z-20">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-2xl font-bold font-heading">{editingId ? 'Edit Entry' : 'Add New Entry'}</h2>
          <button onClick={() => { setEditingId(null); setIsAdding(false); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="mb-6 flex items-center gap-6 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="w-16 h-16 bg-black/20 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
             {formData.logo ? (
               <img src={formData.logo} className="w-full h-full object-contain" alt="Logo preview" />
             ) : (
               <span className="opacity-50 text-[10px] uppercase font-bold text-center">No<br/>Logo</span>
             )}
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Custom Opportunity Logo</label>
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
                file:mr-4 file:py-2 file:px-4
                file:rounded-xl file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-blue-600 file:cursor-pointer file:transition-colors"
            />
            <p className="text-xs opacity-60 mt-2">Uploading an image will securely store it as part of the directory data.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map(field => (
            <div key={field} className={field === 'What Is It?' || field === 'Strongest Submission Tips' ? 'col-span-1 md:col-span-2' : ''}>
              <label className="block text-sm font-medium opacity-80 mb-2">{field}</label>
              {field === 'What Is It?' || field === 'Strongest Submission Tips' ? (
                <textarea 
                  value={(formData[field] as string) || ''}
                  onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                  className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                />
              ) : (
                <input 
                  type="text"
                  value={(formData[field] as string) || ''}
                  onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                  className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-end gap-4">
          <button onClick={() => { setEditingId(null); setIsAdding(false); }} className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors font-medium">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white transition-colors font-medium">
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  // ─── Call Sheet Edit View ────────────────────────────────────────────────────
  const csFields: (keyof CallSheetListing)[] = [
    'title', 'production_title', 'production_company', 'producer_name', 'producer_email',
    'category', 'description', 'requirements', 'compensation', 'compensation_type',
    'location', 'project_stage', 'start_date', 'duration', 'application_url', 'website',
  ];

  if (editingCsId) {
    return (
      <div className="glass-card p-6 rounded-2xl relative z-20">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-2xl font-bold font-heading">Edit Call Sheet Listing</h2>
          <button onClick={() => { setEditingCsId(null); setCsFormData({}); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {csFields.map(field => (
            <div key={field} className={field === 'description' || field === 'requirements' ? 'col-span-1 md:col-span-2' : ''}>
              <label className="block text-sm font-medium opacity-80 mb-2">{field}</label>
              {field === 'description' || field === 'requirements' ? (
                <textarea
                  value={(csFormData[field] as string) || ''}
                  onChange={e => setCsFormData({ ...csFormData, [field]: e.target.value })}
                  className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[120px]"
                />
              ) : (
                <input
                  type="text"
                  value={(csFormData[field] as string) || ''}
                  onChange={e => setCsFormData({ ...csFormData, [field]: e.target.value })}
                  className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              )}
            </div>
          ))}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={csFormData.mentorship_included || false}
                onChange={e => setCsFormData({ ...csFormData, mentorship_included: e.target.checked })}
                className="w-5 h-5 rounded-md"
              />
              <span className="font-medium">Mentorship Included</span>
            </label>
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-4">
          <button onClick={() => { setEditingCsId(null); setCsFormData({}); }} className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors font-medium">
            Cancel
          </button>
          <button onClick={async () => {
            if (editingCsId) {
              const updated = await updateCallSheetListing(editingCsId, csFormData);
              setCsData(csData.map(l => l.id === editingCsId ? updated : l));
            }
            setEditingCsId(null);
            setCsFormData({});
            router.refresh();
          }} className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-colors font-medium">
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  // ─── Industry Directory Edit View ─────────────────────────────────────────
  const dirCoreFields: (keyof DirectoryListing)[] = [
    'name', 'directory_type', 'category', 'description', 'country', 'city',
    'website', 'email', 'phone', 'logo_url',
  ];
  const dirExtraFields: (keyof DirectoryListing)[] = [
    'speciality', 'notable_projects', 'year_founded', 'company_size',
    'role', 'secondary_roles', 'bio', 'portfolio_url', 'credits', 'availability', 'day_rate_range',
    'service_type', 'pricing_tier',
    'program_type', 'duration', 'cost', 'accreditation', 'next_intake',
  ];

  if (editingDirId) {
    return (
      <div className="glass-card p-6 rounded-2xl relative z-20">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-2xl font-bold font-heading">Edit Directory Listing</h2>
          <button onClick={() => { setEditingDirId(null); setDirFormData({}); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dirCoreFields.map(field => (
            <div key={field} className={field === 'description' ? 'col-span-1 md:col-span-2' : ''}>
              <label className="block text-sm font-medium opacity-80 mb-2">{field}</label>
              {field === 'description' ? (
                <textarea
                  value={(dirFormData[field] as string) || ''}
                  onChange={e => setDirFormData({ ...dirFormData, [field]: e.target.value })}
                  className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px]"
                />
              ) : field === 'directory_type' ? (
                <select
                  value={(dirFormData.directory_type as string) || ''}
                  onChange={e => setDirFormData({ ...dirFormData, directory_type: e.target.value as DirectoryListing['directory_type'] })}
                  className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="company">Production Company</option>
                  <option value="crew">Crew</option>
                  <option value="service">Service</option>
                  <option value="training">Training</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={(dirFormData[field] as string) || ''}
                  onChange={e => setDirFormData({ ...dirFormData, [field]: e.target.value })}
                  className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              )}
            </div>
          ))}
        </div>
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">Type-specific fields</summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {dirExtraFields.map(field => (
              <div key={field}>
                <label className="block text-sm font-medium opacity-80 mb-2">{field}</label>
                {field === 'bio' || field === 'credits' || field === 'notable_projects' ? (
                  <textarea
                    value={(dirFormData[field] as string) || ''}
                    onChange={e => setDirFormData({ ...dirFormData, [field]: e.target.value })}
                    className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px]"
                  />
                ) : (
                  <input
                    type="text"
                    value={String(dirFormData[field] || '')}
                    onChange={e => setDirFormData({ ...dirFormData, [field]: e.target.value })}
                    className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                )}
              </div>
            ))}
          </div>
        </details>
        <div className="mt-4 flex items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={dirFormData.featured || false} onChange={e => setDirFormData({ ...dirFormData, featured: e.target.checked })} className="w-5 h-5 rounded-md" />
            <span className="font-medium">Featured</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={dirFormData.verified || false} onChange={e => setDirFormData({ ...dirFormData, verified: e.target.checked })} className="w-5 h-5 rounded-md" />
            <span className="font-medium">Verified</span>
          </label>
        </div>
        <div className="mt-8 flex justify-end gap-4">
          <button onClick={() => { setEditingDirId(null); setDirFormData({}); }} className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors font-medium">
            Cancel
          </button>
          <button onClick={async () => {
            if (editingDirId) {
              const updated = await updateDirectoryListing(editingDirId, dirFormData);
              setDirData(dirData.map(l => l.id === editingDirId ? updated : l));
            }
            setEditingDirId(null);
            setDirFormData({});
            router.refresh();
          }} className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors font-medium">
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  const pendingOppCount = data.filter(o => o.status === 'pending').length;
  const pendingCsCount = csData.filter(l => l.status === 'pending').length;
  const pendingDirCount = dirData.filter(l => l.status === 'pending').length;
  const pendingSpotlightCount = nData.filter(n => n.status === 'pending').length;

  return (
    <div className="space-y-6 relative z-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 flex-wrap">
          <button 
            onClick={() => setActiveTab('approved')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'approved' ? 'bg-primary text-white shadow-lg' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Live Directory
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'bg-accent/20 text-accent border border-accent/20' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Pending
            {pendingOppCount > 0 && (
              <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full">
                {pendingOppCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('callsheet')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'callsheet' ? 'bg-teal-600 text-white shadow-lg' : 'text-foreground/60 hover:text-foreground'}`}
          >
            <Clapperboard size={16} />
            Call Sheet
            {pendingCsCount > 0 && (
              <span className="bg-teal-400 text-black text-xs px-2 py-0.5 rounded-full">
                {pendingCsCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('industry')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'industry' ? 'bg-purple-600 text-white shadow-lg' : 'text-foreground/60 hover:text-foreground'}`}
          >
            <Building2 size={16} />
            Industry
            {pendingDirCount > 0 && (
              <span className="bg-purple-400 text-black text-xs px-2 py-0.5 rounded-full">
                {pendingDirCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('partners')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'partners' ? 'bg-amber-600 text-white shadow-lg' : 'text-foreground/60 hover:text-foreground'}`}
          >
            <Handshake size={16} />
            Partners
            <span className="bg-white/20 text-foreground/60 text-xs px-2 py-0.5 rounded-full">
              {pData.filter(p => p.status === 'approved').length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('spotlight')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'spotlight' ? 'bg-yellow-600 text-white shadow-lg' : 'text-foreground/60 hover:text-foreground'}`}
          >
            <Star size={16} />
            Spotlight
            {pendingSpotlightCount > 0 && (
              <span className="bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-full">
                {pendingSpotlightCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'partners' ? (
          <button 
            onClick={() => { setIsAddingPartner(true); setPartnerForm({ tier: 'partner', status: 'approved', sort_order: 0 }); setPartnerLogoFile(null); setPartnerLogoPreview(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors font-medium"
          >
            <Plus size={20} />
            <span>Add Partner</span>
          </button>
        ) : activeTab !== 'callsheet' && activeTab !== 'spotlight' ? (
          <button 
            onClick={() => { setIsAdding(true); setFormData({}); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors font-medium"
          >
            <Plus size={20} />
            <span>Add New Entry</span>
          </button>
        ) : null}
      </div>

      {/* Opportunities table (approved/pending tabs) */}
      {(activeTab === 'approved' || activeTab === 'pending') && (
        <div className="overflow-x-auto glass-card rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Title</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Format</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Votes</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Deadline</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.filter(opp => (activeTab === 'approved' ? opp.status !== 'pending' : opp.status === 'pending')).map(opp => (
                <tr key={opp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium">{opp.title}</td>
                  <td className="p-4 opacity-80 text-sm">{opp["For Films or Series?"] || 'N/A'}</td>
                  <td className="p-4 font-bold text-accent">{opp.votes || 0}</td>
                  <td className="p-4 opacity-80 text-sm">{opp["Next Deadline"] || 'N/A'}</td>
                  <td className="p-4 flex justify-end gap-2 items-center">
                    {opp.status === 'pending' && (
                      <button onClick={async () => {
                        if (!confirm('Approve this submission and publish to the live site?')) return;
                        const updated = await updateOpportunity(opp.id, { status: 'approved' });
                        setData(data.map(o => o.id === opp.id ? updated : o));
                        router.refresh();
                      }} className="px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 mr-2 border border-green-500/20">
                        <CheckCircle2 size={16} />
                        Approve
                      </button>
                    )}
                    <button onClick={() => handleEdit(opp)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(opp.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.filter(opp => (activeTab === 'approved' ? opp.status !== 'pending' : opp.status === 'pending')).length === 0 && (
            <div className="p-8 text-center opacity-50">No {activeTab} entries found.</div>
          )}
        </div>
      )}

      {/* Industry Directory table */}
      {activeTab === 'industry' && (
        <div className="overflow-x-auto glass-card rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Name</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Type</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Category</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Country</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Status</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dirData.map(listing => {
                const typeLabels: Record<string, string> = { company: 'Company', crew: 'Crew', service: 'Service', training: 'Training' };
                return (
                  <tr key={listing.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium">
                      {listing.name}
                      {listing.featured && <span className="ml-2 text-amber-400 text-xs">★</span>}
                      {listing.verified && <span className="ml-1 text-blue-400 text-xs">✓</span>}
                    </td>
                    <td className="p-4 opacity-80 text-sm">{typeLabels[listing.directory_type] || listing.directory_type}</td>
                    <td className="p-4 opacity-80 text-sm">{listing.category}</td>
                    <td className="p-4 opacity-80 text-sm">{listing.city ? `${listing.city}, ` : ''}{listing.country}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        listing.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        listing.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end gap-2 items-center">
                      {listing.status === 'pending' && (
                        <button onClick={async () => {
                          if (!confirm('Approve this listing?')) return;
                          const updated = await updateDirectoryListing(listing.id, { status: 'approved' });
                          setDirData(dirData.map(l => l.id === listing.id ? updated : l));
                          router.refresh();
                        }} className="px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 mr-2 border border-green-500/20">
                          <CheckCircle2 size={16} />
                          Approve
                        </button>
                      )}
                      {listing.status === 'approved' && (
                        <button onClick={async () => {
                          if (!confirm('Reject this listing?')) return;
                          const updated = await updateDirectoryListing(listing.id, { status: 'rejected' });
                          setDirData(dirData.map(l => l.id === listing.id ? updated : l));
                          router.refresh();
                        }} className="px-3 py-1.5 bg-white/10 text-foreground/60 hover:bg-white/20 rounded-lg transition-colors font-medium text-sm mr-2 border border-white/10">
                          Reject
                        </button>
                      )}
                      <button onClick={() => { setEditingDirId(listing.id); setDirFormData(listing); }} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={async () => {
                        if (!confirm('Delete this listing permanently?')) return;
                        await deleteDirectoryListing(listing.id);
                        setDirData(dirData.filter(l => l.id !== listing.id));
                        router.refresh();
                      }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {dirData.length === 0 && (
            <div className="p-8 text-center opacity-50">No industry directory listings yet.</div>
          )}
        </div>
      )}

      {/* Call Sheet table */}
      {activeTab === 'callsheet' && (
        <div className="overflow-x-auto glass-card rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Role</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Production</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Company</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Compensation</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Status</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {csData.map(listing => (
                <tr key={listing.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium">{listing.title}</td>
                  <td className="p-4 opacity-80 text-sm">{listing.production_title}</td>
                  <td className="p-4 opacity-80 text-sm">{listing.production_company}</td>
                  <td className="p-4 text-teal-400 font-medium text-sm">{listing.compensation}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      listing.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      listing.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-white/10 text-foreground/50'
                    }`}>
                      {listing.status}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2 items-center">
                    {listing.status === 'pending' && (
                      <button onClick={async () => {
                        if (!confirm('Approve this listing and publish to The Call Sheet?')) return;
                        const updated = await updateCallSheetListing(listing.id, { status: 'approved' });
                        setCsData(csData.map(l => l.id === listing.id ? updated : l));
                        router.refresh();
                      }} className="px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 mr-2 border border-green-500/20">
                        <CheckCircle2 size={16} />
                        Approve
                      </button>
                    )}
                    {listing.status === 'approved' && (
                      <button onClick={async () => {
                        if (!confirm('Close this listing?')) return;
                        const updated = await updateCallSheetListing(listing.id, { status: 'closed' });
                        setCsData(csData.map(l => l.id === listing.id ? updated : l));
                        router.refresh();
                      }} className="px-3 py-1.5 bg-white/10 text-foreground/60 hover:bg-white/20 rounded-lg transition-colors font-medium text-sm mr-2 border border-white/10">
                        Close
                      </button>
                    )}
                    <button onClick={() => { setEditingCsId(listing.id); setCsFormData(listing); }} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={async () => {
                      if (!confirm('Delete this listing permanently?')) return;
                      await deleteCallSheetListing(listing.id);
                      setCsData(csData.filter(l => l.id !== listing.id));
                      router.refresh();
                    }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {csData.length === 0 && (
            <div className="p-8 text-center opacity-50">No call sheet listings yet.</div>
          )}
        </div>
      )}
      {/* Partners table + add/edit */}
      {activeTab === 'partners' && !isAddingPartner && !editingPartnerId && (
        <div className="overflow-x-auto glass-card rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Logo</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Name</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Bundle</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Features</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Status</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Order</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pData.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 border border-white/10">
                      <img src={p.logo_url} alt={p.name} className="w-full h-full object-contain" />
                    </div>
                  </td>
                  <td className="p-4 font-medium">
                    {p.name}
                    {p.bundle === 'headline' && <Sparkles size={12} className="inline ml-1.5 text-amber-400" />}
                    {p.bundle === 'growth' && <Crown size={12} className="inline ml-1.5 text-blue-400" />}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${p.bundle === 'headline' ? 'bg-amber-500/20 text-amber-400' : p.bundle === 'growth' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-foreground/60'}`}>
                      {p.bundle || 'starter'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/15 text-green-400">Ticker</span>
                      {(p.bundle === 'growth' || p.bundle === 'headline') && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400">News Card</span>}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-400">{p.newsletter_type === 'spotlight' ? 'NL Spotlight' : 'NL Mention'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${p.status === 'approved' ? 'bg-green-500/20 text-green-400' : p.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-foreground/50">{p.sort_order}</td>
                  <td className="p-4 flex justify-end gap-2 items-center">
                    <button onClick={() => { setEditingPartnerId(p.id); setPartnerForm(p); setPartnerLogoPreview(p.logo_url); setPartnerLogoFile(null); }} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={async () => {
                      if (!confirm(`Delete partner "${p.name}"?`)) return;
                      await deletePartner(p.id);
                      setPData(pData.filter(x => x.id !== p.id));
                      router.refresh();
                    }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pData.length === 0 && (
            <div className="p-8 text-center opacity-50">No partners yet. Click &quot;Add Partner&quot; to add your first one.</div>
          )}
        </div>
      )}

      {/* Partner add/edit form */}
      {activeTab === 'partners' && (isAddingPartner || editingPartnerId) && (() => {
        const bundle = partnerForm.bundle || 'starter';
        const hasProfileCard = bundle === 'growth' || bundle === 'headline';
        const bundleConfig = {
          starter: { label: 'Starter — $75/mo', color: 'border-white/20', desc: 'Ticker placement + Newsletter mention', tier: 'partner' as const, newsletter: 'mention' as const },
          growth: { label: 'Growth — $250/mo', color: 'border-blue-500', desc: 'Sponsor ticker + News profile card + Newsletter mention', tier: 'sponsor' as const, newsletter: 'mention' as const },
          headline: { label: 'Headline — $300/mo', color: 'border-amber-500', desc: 'Sponsor ticker + News profile card + Newsletter spotlight', tier: 'sponsor' as const, newsletter: 'spotlight' as const },
        };
        const cfg = bundleConfig[bundle];
        return (
        <div className="glass-card p-6 rounded-2xl relative z-20">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h2 className="text-2xl font-bold font-heading">{editingPartnerId ? 'Edit Partner' : 'Add New Partner'}</h2>
            <button onClick={() => { setIsAddingPartner(false); setEditingPartnerId(null); setPartnerForm({}); setPartnerLogoFile(null); setPartnerLogoPreview(null); setFeaturedImageFile(null); setFeaturedImagePreview(null); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Bundle selector */}
          <div className="mb-8">
            <label className="block text-sm font-medium opacity-80 mb-3">Select Bundle *</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(bundleConfig) as Array<keyof typeof bundleConfig>).map(key => (
                <button key={key} onClick={() => setPartnerForm({ ...partnerForm, bundle: key })} className={`p-4 rounded-xl border-2 text-left transition-all ${bundle === key ? bundleConfig[key].color + ' bg-white/5 ring-1 ring-white/20' : 'border-white/10 hover:border-white/20'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {key === 'headline' ? <Sparkles size={16} className="text-amber-400" /> : key === 'growth' ? <Crown size={16} className="text-blue-400" /> : <Package size={16} className="text-foreground/50" />}
                    <span className="font-bold text-sm capitalize">{key}</span>
                  </div>
                  <p className="text-xs opacity-50 mt-1">{bundleConfig[key].desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Common fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium opacity-80 mb-2">Partner Name *</label>
              <input type="text" value={partnerForm.name || ''} onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })} className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="e.g. SlateOne Studio" />
            </div>
            <div>
              <label className="block text-sm font-medium opacity-80 mb-2">Website</label>
              <input type="url" value={partnerForm.website || ''} onChange={e => setPartnerForm({ ...partnerForm, website: e.target.value })} className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium opacity-80 mb-2">Sort Order</label>
              <input type="number" value={partnerForm.sort_order ?? 0} onChange={e => setPartnerForm({ ...partnerForm, sort_order: parseInt(e.target.value) || 0 })} className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="flex items-end">
              <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 w-full">
                <p className="text-xs opacity-40 mb-1">Auto-set from bundle</p>
                <p className="text-sm"><span className="font-medium">Tier:</span> <span className={cfg.tier === 'sponsor' ? 'text-amber-400' : 'text-foreground/60'}>{cfg.tier}</span> · <span className="font-medium">Newsletter:</span> <span className={cfg.newsletter === 'spotlight' ? 'text-amber-400' : 'text-foreground/60'}>{cfg.newsletter}</span></p>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium opacity-80 mb-2">Logo *</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {partnerLogoPreview ? (
                    <img src={partnerLogoPreview} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <Handshake size={20} className="text-foreground/20" />
                  )}
                </div>
                <div>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPartnerLogoFile(file);
                      setPartnerLogoPreview(URL.createObjectURL(file));
                    }
                  }} className="text-sm text-foreground/70 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-500 file:cursor-pointer file:transition-colors" />
                  <p className="text-xs opacity-40 mt-1">JPG, PNG, WebP, SVG. Max 5MB.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Profile section — Growth & Headline only */}
          {hasProfileCard && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-purple-400" />
                <h3 className="text-lg font-bold font-heading">Company Profile Card</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold">News Card</span>
              </div>
              <p className="text-sm opacity-50 mb-6">This powers your branded profile card in the Latest News section — your mini storefront.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium opacity-80 mb-2">About *</label>
                  <textarea value={partnerForm.about || ''} onChange={e => setPartnerForm({ ...partnerForm, about: e.target.value })} className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]" placeholder="2-3 sentences about your company. What do you do? Who do you serve?" />
                  <p className="text-xs opacity-40 mt-1">{(partnerForm.about || '').length}/300 characters recommended</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium opacity-80 mb-2">Services / Specialities</label>
                  <input type="text" value={partnerForm.services || ''} onChange={e => setPartnerForm({ ...partnerForm, services: e.target.value })} className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Post-Production, VFX, Color Grading, Sound Design" />
                  <p className="text-xs opacity-40 mt-1">Comma-separated — displayed as tags on the profile card</p>
                </div>
                <div>
                  <label className="block text-sm font-medium opacity-80 mb-2">CTA Button Text</label>
                  <input type="text" value={partnerForm.cta_text || ''} onChange={e => setPartnerForm({ ...partnerForm, cta_text: e.target.value })} className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Visit Website" />
                </div>
                <div>
                  <label className="block text-sm font-medium opacity-80 mb-2">CTA Link URL</label>
                  <input type="url" value={partnerForm.cta_url || ''} onChange={e => setPartnerForm({ ...partnerForm, cta_url: e.target.value })} className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium opacity-80 mb-2">Featured Image (optional)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-14 rounded-xl border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {featuredImagePreview || partnerForm.featured_image_url ? (
                        <img src={featuredImagePreview || partnerForm.featured_image_url || ''} alt="Featured" className="w-full h-full object-cover" />
                      ) : (
                        <Upload size={16} className="text-foreground/20" />
                      )}
                    </div>
                    <div>
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFeaturedImageFile(file);
                          setFeaturedImagePreview(URL.createObjectURL(file));
                        }
                      }} className="text-sm text-foreground/70 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 file:cursor-pointer file:transition-colors" />
                      <p className="text-xs opacity-40 mt-1">Banner behind the profile card. Landscape recommended.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-4">
            <button onClick={() => { setIsAddingPartner(false); setEditingPartnerId(null); setPartnerForm({}); setPartnerLogoFile(null); setPartnerLogoPreview(null); setFeaturedImageFile(null); setFeaturedImagePreview(null); }} className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors font-medium">
              Cancel
            </button>
            <button disabled={partnerSaving} onClick={async () => {
              if (!partnerForm.name) { alert('Name is required'); return; }
              if (hasProfileCard && !partnerForm.about) { alert('About is required for Growth/Headline bundles'); return; }
              setPartnerSaving(true);
              try {
                let logoUrl = partnerForm.logo_url || '';
                if (partnerLogoFile) {
                  const fd = new FormData();
                  fd.append('file', partnerLogoFile);
                  logoUrl = await uploadDirectoryImage(fd);
                }
                if (!logoUrl) { alert('Logo is required'); setPartnerSaving(false); return; }

                let featuredUrl = partnerForm.featured_image_url || null;
                if (featuredImageFile) {
                  const fd = new FormData();
                  fd.append('file', featuredImageFile);
                  featuredUrl = await uploadDirectoryImage(fd);
                }

                const partnerPayload = {
                  name: partnerForm.name!,
                  logo_url: logoUrl,
                  website: partnerForm.website || null,
                  tier: cfg.tier,
                  bundle: bundle,
                  status: 'approved' as const,
                  sort_order: partnerForm.sort_order || 0,
                  newsletter_type: cfg.newsletter,
                  about: partnerForm.about || null,
                  services: partnerForm.services || null,
                  cta_text: partnerForm.cta_text || 'Visit Website',
                  cta_url: partnerForm.cta_url || partnerForm.website || null,
                  featured_image_url: featuredUrl,
                };

                if (editingPartnerId) {
                  const updated = await updatePartner(editingPartnerId, partnerPayload);
                  setPData(pData.map(p => p.id === editingPartnerId ? updated : p));
                } else {
                  const added = await addPartner(partnerPayload as any);
                  setPData([...pData, added]);
                }
                setIsAddingPartner(false);
                setEditingPartnerId(null);
                setPartnerForm({});
                setPartnerLogoFile(null);
                setPartnerLogoPreview(null);
                setFeaturedImageFile(null);
                setFeaturedImagePreview(null);
                router.refresh();
              } catch (err: any) {
                alert(err.message || 'Failed to save partner');
              } finally {
                setPartnerSaving(false);
              }
            }} className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white transition-colors font-medium">
              {partnerSaving ? 'Saving...' : editingPartnerId ? 'Save Changes' : 'Add Partner'}
            </button>
          </div>
        </div>
        );
      })()}

      {/* Spotlight edit view */}
      {activeTab === 'spotlight' && editingNewsId && (() => {
        const newsFields: (keyof NewsItem)[] = ['title', 'summary', 'content', 'slug', 'url', 'image_url', 'project_name'];
        return (
          <div className="glass-card p-6 rounded-2xl relative z-20">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2 className="text-2xl font-bold font-heading">Edit Spotlight Submission</h2>
              <button onClick={() => { setEditingNewsId(null); setNewsFormData({}); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {newsFields.map(field => (
                <div key={field} className={field === 'content' || field === 'summary' ? 'col-span-1 md:col-span-2' : ''}>
                  <label className="block text-sm font-medium opacity-80 mb-2">{field}</label>
                  {field === 'content' || field === 'summary' ? (
                    <textarea
                      value={(newsFormData[field] as string) || ''}
                      onChange={e => setNewsFormData({ ...newsFormData, [field]: e.target.value })}
                      className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-[120px]"
                    />
                  ) : (
                    <input
                      type="text"
                      value={(newsFormData[field] as string) || ''}
                      onChange={e => setNewsFormData({ ...newsFormData, [field]: e.target.value })}
                      className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  )}
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium opacity-80 mb-2">category</label>
                <select
                  value={(newsFormData.category as string) || 'community_spotlight'}
                  onChange={e => setNewsFormData({ ...newsFormData, category: e.target.value as NewsItem['category'] })}
                  className="w-full bg-black/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="community_spotlight">Community Spotlight</option>
                  <option value="industry_news">Industry News</option>
                  <option value="deadline_alert">Deadline Alert</option>
                  <option value="new_opportunity">New Opportunity</option>
                  <option value="tip">Pro Tip</option>
                </select>
              </div>
            </div>
            {newsFormData.submitted_by_name && (
              <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 text-sm text-foreground/60">
                Submitted by: <strong className="text-foreground/80">{newsFormData.submitted_by_name}</strong>
                {newsFormData.submitted_by_email && <> ({newsFormData.submitted_by_email})</>}
              </div>
            )}
            <div className="mt-8 flex justify-end gap-4">
              <button onClick={() => { setEditingNewsId(null); setNewsFormData({}); }} className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors font-medium">
                Cancel
              </button>
              <button onClick={async () => {
                if (editingNewsId) {
                  const updated = await updateNewsItem(editingNewsId, newsFormData);
                  setNData(nData.map(n => n.id === editingNewsId ? updated : n));
                }
                setEditingNewsId(null);
                setNewsFormData({});
                router.refresh();
              }} className="px-6 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white transition-colors font-medium">
                Save Changes
              </button>
            </div>
          </div>
        );
      })()}

      {/* Spotlight table */}
      {activeTab === 'spotlight' && !editingNewsId && (
        <div className="overflow-x-auto glass-card rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Title</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Submitted By</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Category</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider">Status</th>
                <th className="p-4 font-heading text-sm opacity-60 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {nData.map(item => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-foreground/40 mt-1 max-w-xs truncate">{item.summary}</div>
                  </td>
                  <td className="p-4 text-sm">
                    {item.submitted_by_name ? (
                      <div>
                        <div className="text-foreground/80">{item.submitted_by_name}</div>
                        <div className="text-xs text-foreground/40">{item.submitted_by_email}</div>
                      </div>
                    ) : (
                      <span className="text-foreground/30">Admin</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      item.category === 'community_spotlight' ? 'bg-yellow-500/20 text-yellow-400' :
                      item.category === 'industry_news' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-white/10 text-foreground/60'
                    }`}>
                      {item.category === 'community_spotlight' ? 'Spotlight' : item.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      item.status === 'published' ? 'bg-green-500/20 text-green-400' :
                      item.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {item.status || 'published'}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2 items-center">
                    {item.status === 'pending' && (
                      <button onClick={async () => {
                        if (!confirm('Publish this spotlight submission?')) return;
                        const updated = await updateNewsItem(item.id, { status: 'published' });
                        setNData(nData.map(n => n.id === item.id ? updated : n));
                        router.refresh();
                      }} className="px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 border border-green-500/20">
                        <CheckCircle2 size={16} />
                        Publish
                      </button>
                    )}
                    {item.status === 'published' && (
                      <button onClick={async () => {
                        if (!confirm('Unpublish this item?')) return;
                        const updated = await updateNewsItem(item.id, { status: 'rejected' });
                        setNData(nData.map(n => n.id === item.id ? updated : n));
                        router.refresh();
                      }} className="px-3 py-1.5 bg-white/10 text-foreground/60 hover:bg-white/20 rounded-lg transition-colors font-medium text-sm border border-white/10">
                        Unpublish
                      </button>
                    )}
                    {item.status === 'rejected' && (
                      <button onClick={async () => {
                        const updated = await updateNewsItem(item.id, { status: 'published' });
                        setNData(nData.map(n => n.id === item.id ? updated : n));
                        router.refresh();
                      }} className="px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors font-medium text-sm border border-green-500/20">
                        Re-publish
                      </button>
                    )}
                    <button onClick={() => { setEditingNewsId(item.id); setNewsFormData(item); }} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={async () => {
                      if (!confirm('Delete this news item permanently?')) return;
                      await deleteNewsItem(item.id);
                      setNData(nData.filter(n => n.id !== item.id));
                      router.refresh();
                    }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {nData.length === 0 && (
            <div className="p-8 text-center opacity-50">No news or spotlight submissions yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
