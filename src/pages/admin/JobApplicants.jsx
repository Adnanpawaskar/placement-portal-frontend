import useScrollReveal from '../../hooks/useScrollReveal';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Search, ChevronDown, ChevronUp, ExternalLink, FileText, User, CheckSquare, Square, Bell, Package } from 'lucide-react';

const statusColors = {
  'Applied': 'bg-blue-100 text-[var(--neon-blue)]',
  'Shortlisted': 'badge badge-in-process',
  'Interview Scheduled': 'bg-purple-100 text-[var(--neon-purple)]',
  'Selected': 'bg-green-100 text-[var(--neon-green)]',
  'Rejected': 'badge badge-not-placed',
  'On Hold': 'bg-slate-100 text-[var(--text-secondary)]',
};

export default function JobApplicants() {
  const { id } = useParams();
  const [applications, setApplications] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState({});
  const [updateModal, setUpdateModal] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: '', note: '', interviewDate: '', interviewTime: '', interviewVenue: '' });
  const [updating, setUpdating] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [downloadingSelected, setDownloadingSelected] = useState(false);

  // Notification modal
  const [notifModal, setNotifModal] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'General' });
  const [sendingNotif, setSendingNotif] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/jobs/${id}/applicants`),
      api.get(`/jobs/${id}`)
    ]).then(([appRes, jobRes]) => {
      setApplications(appRes.data.applications || []);
      setJobTitle(jobRes.data.job?.title || '');
      setCompany(jobRes.data.job?.company || '');
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const openUpdate = (app) => {
    setUpdateModal(app.applicationId);
    setUpdateForm({ status: app.status, note: '', interviewDate: '', interviewTime: '', interviewVenue: '' });
  };

  const submitUpdate = async (e) => {
    e.preventDefault(); setUpdating(true);
    try {
      await api.put(`/applications/${updateModal}/status`, updateForm);
      toast.success('Status updated! Student notified via email & WhatsApp.');
      setUpdateModal(null);
      const res = await api.get(`/jobs/${id}/applicants`);
      setApplications(res.data.applications || []);
    } catch { toast.error('Update failed'); }
    finally { setUpdating(false); }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Roll No', 'Course', 'Branch', 'CGPA', '10th%', '12th%', 'Skills', 'Status', 'Applied At', 'LinkedIn', 'GitHub'];
    const rows = filtered.map(a => [
      a.student?.name, a.student?.email, a.student?.phone, a.student?.rollNumber,
      a.student?.course, a.student?.branch, a.student?.cgpa,
      a.student?.percentage10th, a.student?.percentage12th,
      (a.student?.skills || []).join('; '), a.status,
      new Date(a.appliedAt).toLocaleDateString('en-IN'),
      a.student?.linkedIn, a.student?.github
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${company}_${jobTitle}_applicants.csv`; a.click();
    toast.success('CSV exported!');
  };

  const filtered = applications.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.student?.name?.toLowerCase().includes(q) || a.student?.email?.toLowerCase().includes(q) || a.student?.rollNumber?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleSelect = (appId) => setSelectedIds(prev => prev.includes(appId) ? prev.filter(x => x !== appId) : [...prev, appId]);
  const toggleSelectAll = () => {
    const allIds = filtered.map(a => a.applicationId);
    setSelectedIds(prev => prev.length === allIds.length ? [] : allIds);
  };

  const downloadSelectedResumes = async () => {
    if (selectedIds.length === 0) { toast.error('Select at least one applicant'); return; }
    // Get student IDs from selected application IDs
    const selectedApps = applications.filter(a => selectedIds.includes(a.applicationId));
    const studentIds = selectedApps.map(a => a.student?._id || a.student?.id).filter(Boolean);
    if (studentIds.length === 0) { toast.error('No student IDs found'); return; }
    setDownloadingSelected(true);
    try {
      const res = await api.post('/admin/resumes/download-selective', { studentIds }, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/zip' }));
      const a = document.createElement('a'); a.href = url; a.download = `${company}_${jobTitle}_resumes_${Date.now()}.zip`; a.click();
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
      // Get user IDs for selected applicants
      const selectedApps = applications.filter(a => selectedIds.includes(a.applicationId));
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

  if (loading) return <div className="flex items-center justify-center min-h-64 text-[var(--text-muted)]">Loading applicants...</div>;

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.map(a => a.applicationId).filter(id => selectedIds.includes(id) || true).length && filtered.every(a => selectedIds.includes(a.applicationId));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <Link to="/admin/jobs" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--neon-blue)] text-sm mb-4">
          <ArrowLeft size={16} /> Back to Jobs
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{jobTitle}</h1>
            <p className="text-[var(--text-muted)]">{company} · {applications.length} applicants</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={downloadSelectedResumes}
                  disabled={downloadingSelected}
                  className="btn-primary flex items-center gap-2 text-sm"
                  style={{ background: 'linear-gradient(135deg, #059669, #00cc77)' }}>
                  <Package size={16} /> {downloadingSelected ? 'Downloading...' : `Download Resumes (${selectedIds.length})`}
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

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
          <input className="input pl-9 py-2" placeholder="Search by name, email, roll no..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input py-2 w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {Object.keys(statusColors).map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Select all bar */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid var(--border-glow)' }}>
          <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm" style={{ color: 'var(--neon-blue)' }}>
            {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            <span>{allSelected ? 'Deselect All' : `Select All (${filtered.length})`}</span>
          </button>
          {selectedIds.length > 0 && (
            <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
              {selectedIds.length} selected
            </span>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 && <div className="text-center py-12 text-[var(--text-muted)]">No applicants found</div>}
        {filtered.map(app => {
          const isExpanded = expanded[app.applicationId];
          const isSelected = selectedIds.includes(app.applicationId);
          return (
            <div key={app.applicationId} className="card border"
              style={{ borderColor: isSelected ? 'var(--neon-blue)' : 'var(--border-glow)', background: isSelected ? 'rgba(0,212,255,0.04)' : undefined }}>
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button onClick={() => toggleSelect(app.applicationId)} className="mt-1 flex-shrink-0" style={{ color: isSelected ? 'var(--neon-blue)' : 'var(--text-muted)' }}>
                  {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-[var(--neon-blue)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--text-primary)]">{app.student?.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[app.status]}`}>{app.status}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-[var(--text-muted)] mt-1 flex-wrap">
                    <span>{app.student?.email}</span>
                    {app.student?.phone && <span>{app.student?.phone}</span>}
                    {app.student?.rollNumber && <span>#{app.student?.rollNumber}</span>}
                    <span>{app.student?.course}{app.student?.branch ? ` – ${app.student?.branch}` : ''}</span>
                    {app.student?.cgpa && <span>CGPA: {app.student?.cgpa}</span>}
                    <span>Applied: {new Date(app.appliedAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {app.resumeUrl && (
                    <a href={`http://localhost:5000${app.resumeUrl}`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs py-1 px-2 flex items-center gap-1">
                      <FileText size={12} /> Resume
                    </a>
                  )}
                  <button onClick={() => openUpdate(app)} className="btn-primary text-xs py-1 px-3">Update</button>
                  <button onClick={() => setExpanded(p => ({ ...p, [app.applicationId]: !p[app.applicationId] }))} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[var(--border-glow)] grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-[var(--text-muted)] text-xs block">10th %</span>{app.student?.percentage10th || '–'}</div>
                  <div><span className="text-[var(--text-muted)] text-xs block">12th %</span>{app.student?.percentage12th || '–'}</div>
                  <div><span className="text-[var(--text-muted)] text-xs block">Placement</span>{app.student?.placementStatus}</div>
                  <div className="col-span-2 md:col-span-1">
                    <span className="text-[var(--text-muted)] text-xs block">Skills</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(app.student?.skills || []).map(s => <span key={s} className="bg-blue-50 text-[var(--neon-blue)] text-xs px-2 py-0.5 rounded">{s}</span>)}
                    </div>
                  </div>
                  {app.student?.linkedIn && <div><span className="text-[var(--text-muted)] text-xs block">LinkedIn</span><a href={app.student.linkedIn} target="_blank" className="text-[var(--neon-blue)] text-xs flex items-center gap-1" rel="noreferrer"><ExternalLink size={10} /> View</a></div>}
                  {app.student?.github && <div><span className="text-[var(--text-muted)] text-xs block">GitHub</span><a href={app.student.github} target="_blank" className="text-[var(--neon-blue)] text-xs flex items-center gap-1" rel="noreferrer"><ExternalLink size={10} /> View</a></div>}
                  {app.coverLetter && <div className="col-span-2 md:col-span-4"><span className="text-[var(--text-muted)] text-xs block">Cover Letter</span><p className="text-[var(--text-secondary)] text-xs mt-1">{app.coverLetter}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Update Status Modal */}
      {updateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="modal-card w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-glow)]">
              <h3 className="font-bold text-[var(--text-primary)]">Update Application Status</h3>
              <button onClick={() => setUpdateModal(null)} className="text-[var(--text-muted)] text-2xl leading-none">×</button>
            </div>
            <form onSubmit={submitUpdate} className="p-5 space-y-4">
              <div>
                <label className="label">New Status</label>
                <select className="input" value={updateForm.status} onChange={e => setUpdateForm(p => ({ ...p, status: e.target.value }))} required>
                  <option value="">Select status...</option>
                  {Object.keys(statusColors).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Note (optional)</label>
                <textarea className="input" rows={2} placeholder="Message for the student..." value={updateForm.note} onChange={e => setUpdateForm(p => ({ ...p, note: e.target.value }))} />
              </div>
              {updateForm.status === 'Interview Scheduled' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Interview Date</label><input type="date" className="input" value={updateForm.interviewDate} onChange={e => setUpdateForm(p => ({ ...p, interviewDate: e.target.value }))} /></div>
                    <div><label className="label">Time</label><input type="time" className="input" value={updateForm.interviewTime} onChange={e => setUpdateForm(p => ({ ...p, interviewTime: e.target.value }))} /></div>
                  </div>
                  <div><label className="label">Venue / Link</label><input className="input" placeholder="Room 301 / Zoom link..." value={updateForm.interviewVenue} onChange={e => setUpdateForm(p => ({ ...p, interviewVenue: e.target.value }))} /></div>
                </>
              )}
              <div className="text-xs text-[var(--text-muted)] bg-blue-50 rounded-lg p-3 flex gap-2">
                <span>📧📱</span> Student will be notified via <strong>Email & WhatsApp</strong>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setUpdateModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={updating} className="btn-primary flex-1">{updating ? 'Updating...' : 'Update & Notify'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Notification to Selected Modal */}
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
                  {['General', 'Job Alert', 'Interview', 'Reminder', 'Result'].map(t => <option key={t}>{t}</option>)}
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
                Notification will be sent to <strong style={{ color: 'var(--neon-purple)' }}>{selectedIds.length}</strong> selected applicant{selectedIds.length !== 1 ? 's' : ''} via Email & WhatsApp.
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
