'use client';

import { useState } from 'react';
import { Opportunity, updateOpportunity, deleteOpportunity, addOpportunity } from '@/app/actions';
import { Edit2, Trash2, Plus, X, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminClient({ initialData }: { initialData: Opportunity[] }) {
  const [data, setData] = useState<Opportunity[]>(initialData);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const router = useRouter();

  // Temporary form state
  const [formData, setFormData] = useState<Partial<Opportunity>>({});

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

  return (
    <div className="space-y-6 relative z-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
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
            Pending Submissions
            {data.filter(o => o.status === 'pending').length > 0 && (
              <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full">
                {data.filter(o => o.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        <button 
          onClick={() => { setIsAdding(true); setFormData({}); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors font-medium"
        >
          <Plus size={20} />
          <span>Add New Entry</span>
        </button>
      </div>

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
    </div>
  );
}
