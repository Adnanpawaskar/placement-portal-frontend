import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Search, User, CheckSquare, Square, Bell, Package, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_COLORS = {
  Applied: 'bg-blue-100 text-[var(--neon-blue)]',
  Shortlisted: 'badge badge-in-process',
  Selected: 'bg-green-100 text-[var(--neon-green)]',
  Rejected: 'badge badge-not-placed',
  Withdrawn: 'bg-slate-100 text-[var(--text-secondary)]',
};

export default function InternshipApplicants() {
  const { id } = useParams();
  const [applications, setApplications] = useState([]);
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState({});

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [downloadingSelected, setDownloadingSelected] = useState(false);

  // Notification modal
  const [notifModal, setNotifModal] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'General' });
  const [sendingNotif, setSendingNotif] = useState(false);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const [appRes, internshipRes] = await Promise.all([
        api.get(`/internships/${id}/applicants`),
        api.get(`/internships/${id}`),
      ]);
      setApplications(appRes.data.applications || []);
      setInternship(internshipRes.data.internship);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load internship applicants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplicants(); }, [id]);

  const updateStatus = async (applicationId, status) => {
    try {
      await api.put(`/internships/${id}/applicants/${applicationId}/status`, { status });
      toast.success('Status updated');
      fetchApplicants();
    } catch {
      toast.error('Update failed');
    }
  };

  const filtered = applications.filter(app => {
    const q = search.toLowerCase();
    const student = app.student;
    const matchesSearch = !q || student?.user?.name?.toLowerCase().includes(q) || student?.user?.email?.toLowerCase().includes(q) || student?.rollNumber?.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelect = (appId) => setSelectedIds(prev => prev.includes(appId) ? prev.filter(x => x !== appId) : [...prev, appId]);
  const allSelected = filtered.length > 0 && filtered.every(a => selectedIds.includes(a._id));
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : filtered.map(a => a._id));

  const downloadSelectedResumes = async () => {
    if (selectedIds.length === 0) { toast.error('Select at least one applicant'); return; }
    const selectedApps = applications.filter(a => selectedIds.includes(a._id));
    const studentIds = selectedApps.map(a => a.student?._id).filter(Boolean);
    if (studentIds.length === 0) { toast.error('No student IDs found'); return; }
    setDownloadingSelected(true);
    try {
      const res = await api.post('/admin/resumes/download-selective', { studentIds }, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/zip' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${internship?.company || 'internship'}_resumes_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${selectedIds.length} resumes!`);
    } catch (err) {
      toast.error(err.response?.status === 404 ? 'No resumes found for selected applicants' : 'Failed to download resumes');
    } finally { setDownloadingSelected(false); }
  };

  const sendSelectedNotification = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) { toast.error('Select at least one applicant'); return; }
    setSendingNotif(true);
    try {
      const selectedApps = applications.filter(a => selectedIds.includes(a._id));
      const recipientIds = selectedApps.map(a => a.student?.userId).filter(Boolean);
      const res = await api.post('/notifications', {
        title: notifForm.title,
        message: notifForm.message,
        type: notifForm.type,
        targetAll: false,
        recipientIds,
      });
      const delivery = res.data.delivery;
      const whatsappInfo = delivery ? ` WhatsApp sent: ${delivery.whatsappSent || 0}.` : '';
      toast.success(`Notification sent to ${selectedIds.length} applicants!${whatsappInfo}`);
      setNotifModal(false);
      setNotifForm({ title: '', message: '', type: 'General' });
    } catch {
      toast.error('Failed to send notification');
    } finally { setSendingNotif(false); }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Roll No', 'Course', 'Branch', 'CGPA', 'Status', 'Applied At'];
    const rows = filtered.map(app => [
      app.student?.user?.name, app.student?.user?.email, app.student?.phone, app.student?.rollNumber,
      app.student?.course, app.student?.branch, app.student?.cgpa, app.status,
      new Date(app.appliedAt).toLocaleDateString('en-IN'),
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${internship?.company || 'internship'}_${internship?.title || 'applicants'}_applicants.csv`;
    a.click();
    toast.success('CSV exported');
  };

  if (loading) return <div className="flex items-center justify-center min-h-64 text-[var(--text-muted)]">Loading applicants...</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <Link to="/admin/internships" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--neon-blue)] text-sm mb-4">
          <ArrowLeft size={16} /> Back to Internships
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{internship?.title}</h1>
            <p className="text-[var(--text-muted)]">{internship?.company} · {applications.length} applicants</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={downloadSelectedResumes}
                  disabled={downloadingSelected}
                  className="btn-primary flex items-center gap-2 text-sm"
                  style={{ background: 'linear-gradient(135deg, #059669, #00cc77)' }}>
                  <Package size={16} /> {downloadingSelected ? 'Downloading...' : `Resumes (${selectedIds.length})`}
                </button>
                <button
                  onClick={() => setNotifModal(true)}
                  className="btn-primary flex items-center gap-2 text-sm"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #b040ff)' }}>
                  <Bell size={16} /> Notify ({selectedIds.length})
                </button>
              </>
            )}
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
          <input className="input pl-9 py-2" placeholder="Search by name, email, roll no..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input py-2 w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {Object.keys(STATUS_COLORS).map(status => <option key={status}>{status}</option>)}
        </select>
      </div>

      {/* Select All bar */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid var(--border-glow)' }}>
          <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm" style={{ color: 'var(--neon-blue)' }}>
            {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            <span>{allSelected ? 'Deselect All' : `Select All (${filtered.length})`}</span>
          </button>
          {selectedIds.length > 0 && (
            <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{selectedIds.length} selected</span>
          )}
        </div>
      )}

      {/* Applicant cards */}
      <div className="space-y-3">
        {filtered.length === 0 && <div className="text-center py-12 text-[var(--text-muted)]">No applicants found</div>}
        {filtered.map(app => {
          const isSelected = selectedIds.includes(app._id);
          const isExpanded = expanded[app._id];
          return (
            <div key={app._id} className="card border"
              style={{ borderColor: isSelected ? 'var(--neon-blue)' : 'var(--border-glow)', background: isSelected ? 'rgba(0,212,255,0.04)' : undefined }}>
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button onClick={() => toggleSelect(app._id)} className="mt-1 flex-shrink-0" style={{ color: isSelected ? 'var(--neon-blue)' : 'var(--text-muted)' }}>
                  {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-[var(--neon-blue)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--text-primary)]">{app.student?.user?.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[app.status] || ''}`}>{app.status}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-[var(--text-muted)] mt-1 flex-wrap">
                    <span>{app.student?.user?.email}</span>
                    {app.student?.phone && <span>{app.student.phone}</span>}
                    {app.student?.rollNumber && <span>#{app.student.rollNumber}</span>}
                    <span>{app.student?.course}{app.student?.branch ? ` – ${app.student.branch}` : ''}</span>
                    {app.student?.cgpa && <span>CGPA: {app.student.cgpa}</span>}
                    <span>Applied: {new Date(app.appliedAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {app.resumeUrl && (
                    <a href={`http://localhost:5000${app.resumeUrl}`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs py-1 px-2 flex items-center gap-1">
                      <FileText size={12} /> Resume
                    </a>
                  )}
                  <select className="input py-1 text-xs w-32" value={app.status} onChange={e => updateStatus(app._id, e.target.value)}>
                    {Object.keys(STATUS_COLORS).map(status => <option key={status}>{status}</option>)}
                  </select>
                  <button onClick={() => setExpanded(p => ({ ...p, [app._id]: !p[app._id] }))} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[var(--border-glow)] grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {app.student?.skills?.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-[var(--text-muted)] text-xs block">Skills</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {app.student.skills.map(s => <span key={s} className="bg-blue-50 text-[var(--neon-blue)] text-xs px-2 py-0.5 rounded">{s}</span>)}
                      </div>
                    </div>
                  )}
                  <div><span className="text-[var(--text-muted)] text-xs block">Placement</span>{app.student?.placementStatus || '–'}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Send Notification Modal */}
      {notifModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="modal-card w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-glow)]">
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">Send Notification</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>To {selectedIds.length} selected applicant{selectedIds.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setNotifModal(false)} className="text-[var(--text-muted)] text-2xl leading-none">×</button>
            </div>
            <form onSubmit={sendSelectedNotification} className="p-5 space-y-4">
              <div>
                <label className="label">Notification Type</label>
                <select className="input" value={notifForm.type} onChange={e => setNotifForm(p => ({ ...p, type: e.target.value }))}>
                  {['General', 'Internship Alert', 'Interview', 'Reminder', 'Result'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Title</label>
                <input className="input" required placeholder="Notification title..." value={notifForm.title} onChange={e => setNotifForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea className="input" rows={3} required placeholder="Write your message here..." value={notifForm.message} onChange={e => setNotifForm(p => ({ ...p, message: e.target.value }))} />
              </div>
              <div className="text-xs rounded-lg p-3 flex gap-2" style={{ background: 'rgba(176,64,255,0.08)', border: '1px solid rgba(176,64,255,0.2)', color: 'var(--text-muted)' }}>
                <Bell size={14} style={{ color: 'var(--neon-purple)', flexShrink: 0, marginTop: 1 }} />
                Sending to <strong style={{ color: 'var(--neon-purple)' }}>{selectedIds.length}</strong> applicant{selectedIds.length !== 1 ? 's' : ''} via Email & WhatsApp.
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setNotifModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={sendingNotif} className="btn-primary flex-1"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #b040ff)' }}>
                  {sendingNotif ? 'Sending...' : `Send to ${selectedIds.length}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
