import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Users, Search, X, Briefcase } from 'lucide-react';

const emptyInternship = {
  title: '', company: '', description: '', requirements: '', location: '',
  mode: 'On-site', duration: '', startDate: '', applicationDeadline: '',
  stipend: { amount: '', period: 'month' },
  eligibility: { minCGPA: '', allowedCourses: '', allowedBranches: '', minSemester: '', maxSemester: '' },
  skills: '', status: 'Open', isPPO: false
};

export default function ManageInternships() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyInternship);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/internships?${params.toString()}`);
      setInternships(res.data.internships || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInternships(); }, [search, statusFilter]);

  const openCreate = () => { setEditItem(null); setForm(emptyInternship); setShowModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      ...item,
      stipend: { amount: item.stipend?.amount || '', period: item.stipend?.period || 'month' },
      eligibility: {
        minCGPA: item.eligibility?.minCGPA || '',
        allowedCourses: item.eligibility?.allowedCourses?.join(', ') || '',
        allowedBranches: item.eligibility?.allowedBranches?.join(', ') || '',
        minSemester: item.eligibility?.minSemester || '',
        maxSemester: item.eligibility?.maxSemester || '',
      },
      skills: item.skills?.join(', ') || '',
      applicationDeadline: item.applicationDeadline ? item.applicationDeadline.split('T')[0] : '',
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        stipend: { amount: Number(form.stipend.amount) || 0, period: form.stipend.period },
        eligibility: {
          minCGPA: Number(form.eligibility.minCGPA) || 0,
          allowedCourses: form.eligibility.allowedCourses ? form.eligibility.allowedCourses.split(',').map(s => s.trim()).filter(Boolean) : [],
          allowedBranches: form.eligibility.allowedBranches ? form.eligibility.allowedBranches.split(',').map(s => s.trim()).filter(Boolean) : [],
          minSemester: Number(form.eligibility.minSemester) || 1,
          maxSemester: Number(form.eligibility.maxSemester) || 8,
        },
      };
      if (editItem) await api.put(`/internships/${editItem._id}`, payload);
      else await api.post('/internships', payload);
      toast.success(editItem ? 'Internship updated!' : 'Internship posted!');
      setShowModal(false);
      fetchInternships();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this internship?')) return;
    try { await api.delete(`/internships/${id}`); toast.success('Deleted'); fetchInternships(); }
    catch (err) { toast.error('Failed to delete'); }
  };

  const modeBadge = (m) => {
    const map = { 'On-site': 'bg-green-100 text-green-700', 'Remote': 'bg-blue-100 text-blue-700', 'Hybrid': 'bg-purple-100 text-purple-700' };
    return map[m] || 'badge-not-done';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Manage Internships</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Post Internship
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={17} className="absolute left-3 top-2.5 text-slate-400" />
          <input className="input pl-9" placeholder="Search internships..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option>Open</option><option>Closed</option><option>Draft</option>
        </select>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--neon-blue)]" /></div>
      ) : internships.length === 0 ? (
        <div className="card text-center py-16">
          <Briefcase size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400">No internships found. Post one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {internships.map(item => (
            <div key={item._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-[var(--text-primary)] text-lg">{item.title}</h3>
                    <span className={`badge text-xs ${modeBadge(item.mode)}`}>{item.mode}</span>
                    {item.isPPO && <span className="badge text-xs bg-yellow-100 text-yellow-700">PPO</span>}
                    <span className={`badge text-xs ${item.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{item.status}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{item.company} · {item.location}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                    <span>⏱ {item.duration}</span>
                    {item.stipend?.amount > 0 && <span>💰 ₹{item.stipend.amount.toLocaleString()}/{item.stipend.period}</span>}
                    <span>📅 Deadline: {new Date(item.applicationDeadline).toLocaleDateString('en-IN')}</span>
                    <span>👥 {item.applicantsCount || 0} applicants</span>
                    {item.eligibility?.minCGPA > 0 && <span>📊 Min CGPA: {item.eligibility.minCGPA}</span>}
                  </div>
                  {item.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.skills.map(sk => <span key={sk} className="badge badge-not-done text-xs">{sk}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a href={`/admin/internships/${item._id}/applicants`}
                    className="btn-secondary p-2 text-xs flex items-center gap-1">
                    <Users size={14} /> {item.applicantsCount || 0}
                  </a>
                  <button onClick={() => openEdit(item)} className="btn-secondary p-2"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(item._id)} className="btn-secondary p-2 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="modal-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-glow)] sticky top-0 bg-[var(--bg-secondary)] z-10">
              <h2 className="font-bold text-xl text-[var(--text-primary)]">{editItem ? 'Edit Internship' : 'Post New Internship'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Internship Title *</label><input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Software Development Intern" /></div>
                <div><label className="label">Company *</label><input className="input" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Company name" /></div>
                <div><label className="label">Location *</label><input className="input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="City or Remote" /></div>
                <div><label className="label">Mode</label>
                  <select className="input" value={form.mode} onChange={e => setForm(p => ({ ...p, mode: e.target.value }))}>
                    <option>On-site</option><option>Remote</option><option>Hybrid</option>
                  </select>
                </div>
                <div><label className="label">Duration *</label><input className="input" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 3 months" /></div>
                <div><label className="label">Stipend (₹/month)</label><input className="input" type="number" value={form.stipend.amount} onChange={e => setForm(p => ({ ...p, stipend: { ...p.stipend, amount: e.target.value } }))} placeholder="0 = unpaid" /></div>
                <div><label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <option>Open</option><option>Closed</option><option>Draft</option>
                  </select>
                </div>
                <div><label className="label">Application Deadline *</label><input className="input" type="date" value={form.applicationDeadline} onChange={e => setForm(p => ({ ...p, applicationDeadline: e.target.value }))} /></div>
                <div><label className="label">Start Date</label><input className="input" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></div>
              </div>

              <div><label className="label">Description *</label><textarea className="input" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the internship role..." /></div>
              <div><label className="label">Requirements</label><textarea className="input" rows={2} value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} placeholder="Skills or qualifications needed..." /></div>
              <div><label className="label">Required Skills (comma-separated)</label><input className="input" value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} placeholder="e.g. Python, Machine Learning, SQL" /></div>

              <div className="bg-[var(--bg-card)] rounded-xl p-4 space-y-3">
                <p className="font-medium text-[var(--text-primary)] text-sm">Eligibility Criteria</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label text-xs">Min CGPA</label><input className="input text-sm" type="number" step="0.1" min="0" max="10" value={form.eligibility.minCGPA} onChange={e => setForm(p => ({ ...p, eligibility: { ...p.eligibility, minCGPA: e.target.value } }))} placeholder="0 = any" /></div>
                  <div><label className="label text-xs">Allowed Courses</label><input className="input text-sm" value={form.eligibility.allowedCourses} onChange={e => setForm(p => ({ ...p, eligibility: { ...p.eligibility, allowedCourses: e.target.value } }))} placeholder="B.Tech, M.Tech" /></div>
                  <div><label className="label text-xs">Allowed Branches</label><input className="input text-sm" value={form.eligibility.allowedBranches} onChange={e => setForm(p => ({ ...p, eligibility: { ...p.eligibility, allowedBranches: e.target.value } }))} placeholder="CSE, IT" /></div>
                  <div><label className="label text-xs">Semester Range</label>
                    <div className="flex gap-2">
                      <input className="input text-sm" type="number" min="1" max="12" placeholder="From" value={form.eligibility.minSemester} onChange={e => setForm(p => ({ ...p, eligibility: { ...p.eligibility, minSemester: e.target.value } }))} />
                      <input className="input text-sm" type="number" min="1" max="12" placeholder="To" value={form.eligibility.maxSemester} onChange={e => setForm(p => ({ ...p, eligibility: { ...p.eligibility, maxSemester: e.target.value } }))} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="isPPO" checked={form.isPPO} onChange={e => setForm(p => ({ ...p, isPPO: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                <label htmlFor="isPPO" className="text-sm text-[var(--text-primary)]">This internship may lead to a Pre-Placement Offer (PPO)</label>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-[var(--border-glow)] sticky bottom-0 bg-[var(--bg-secondary)]">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : editItem ? 'Update Internship' : 'Post Internship'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
