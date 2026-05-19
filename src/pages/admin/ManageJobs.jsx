import useScrollReveal from '../../hooks/useScrollReveal';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Users, Search, X, Briefcase, GraduationCap, Download } from 'lucide-react';

const ALL_COURSES = ['B.Tech','M.Tech','BCA','MCA','BBA','MBA','B.Sc','M.Sc','B.Com','M.Com'];
const JOB_TYPES   = ['Full-time','Part-time','Contract','Remote'];

const emptyForm = {
  title:'', company:'', description:'', requirements:'', location:'',
  postType:'Job', jobType:'Full-time',
  applicationDeadline:'', driveDate:'',
  salary:{ min:'', max:'' }, stipend:{ min:'', max:'' }, duration:'', isPPO: false,
  eligibility:{ minCGPA:'', allowedCourses:[], allowedBranches:'' },
  skills:'', rounds:'', status:'Open'
};

const internshipToForm = (item) => ({
  ...emptyForm,
  ...item,
  postType: 'Internship',
  jobType: 'Full-time',
  stipend: {
    min: item.stipend?.amount ?? item.stipend?.min ?? '',
    max: item.stipend?.max ?? '',
  },
  duration: item.duration || '',
  isPPO: item.isPPO || false,
  eligibility: {
    minCGPA: item.eligibility?.minCGPA || '',
    allowedCourses: item.eligibility?.allowedCourses || [],
    allowedBranches: item.eligibility?.allowedBranches?.join(', ') || '',
  },
  skills: item.skills?.join(', ') || '',
  rounds: item.rounds?.join(', ') || '',
  applicationDeadline: item.applicationDeadline ? item.applicationDeadline.split('T')[0] : '',
  driveDate: item.startDate ? item.startDate.split('T')[0] : '',
});

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Job'); // 'Job' | 'Internship'
  const [showModal, setShowModal] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '100');

      if (tab === 'Internship') {
        const res = await api.get(`/internships?${params.toString()}`);
        setJobs((res.data.internships || []).map(item => ({
          ...item,
          postType: 'Internship',
          stipend: {
            ...item.stipend,
            min: item.stipend?.amount ?? item.stipend?.min ?? 0,
            max: item.stipend?.max ?? '',
          },
        })));
      } else {
        params.append('postType', 'Job');
        const res = await api.get(`/jobs?${params.toString()}`);
        setJobs(res.data.jobs || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [tab, search, statusFilter]);

  const openCreate = () => {
    setEditJob(null);
    setForm({ ...emptyForm, postType: tab, jobType: tab === 'Internship' ? 'Full-time' : 'Full-time' });
    setShowModal(true);
  };

  const openEdit = (job) => {
    setEditJob(job);
    if (tab === 'Internship') {
      setForm(internshipToForm(job));
      setShowModal(true);
      return;
    }
    setForm({
      ...job,
      postType: job.postType || 'Job',
      salary: { min: job.salary?.min || '', max: job.salary?.max || '' },
      stipend: { min: job.stipend?.min || '', max: job.stipend?.max || '' },
      duration: job.duration || '',
      isPPO: job.isPPO || false,
      eligibility: {
        minCGPA: job.eligibility?.minCGPA || '',
        allowedCourses: job.eligibility?.allowedCourses || [],
        allowedBranches: job.eligibility?.allowedBranches?.join(', ') || '',
      },
      skills: job.skills?.join(', ') || '',
      rounds: job.rounds?.join(', ') || '',
      applicationDeadline: job.applicationDeadline ? job.applicationDeadline.split('T')[0] : '',
      driveDate: job.driveDate ? job.driveDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const toggleCourse = (course) => {
    const courses = form.eligibility.allowedCourses;
    const updated = courses.includes(course) ? courses.filter(c => c !== course) : [...courses, course];
    setForm(p => ({ ...p, eligibility: { ...p.eligibility, allowedCourses: updated } }));
  };

  const handleSave = async () => {
    if (!form.title || !form.company || !form.applicationDeadline) {
      toast.error('Title, company and deadline are required'); return;
    }
    setSaving(true);
    try {
      const commonPayload = {
        title: form.title,
        company: form.company,
        description: form.description,
        requirements: form.requirements,
        location: form.location,
        applicationDeadline: form.applicationDeadline,
        status: form.status,
        isPPO: form.isPPO,
        eligibility: {
          minCGPA: Number(form.eligibility.minCGPA) || 0,
          allowedCourses: form.eligibility.allowedCourses,
          allowedBranches: form.eligibility.allowedBranches ? form.eligibility.allowedBranches.split(',').map(s => s.trim()).filter(Boolean) : [],
        },
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      const payload = tab === 'Internship'
        ? {
            ...commonPayload,
            duration: form.duration,
            startDate: form.driveDate || undefined,
            mode: form.jobType === 'Remote' ? 'Remote' : 'On-site',
            stipend: { amount: Number(form.stipend.min) || 0, period: 'month' },
            eligibility: {
              ...commonPayload.eligibility,
              minSemester: 1,
              maxSemester: 8,
            },
          }
        : {
            ...commonPayload,
            postType: 'Job',
            jobType: form.jobType,
            driveDate: form.driveDate,
            salary: { min: Number(form.salary.min) || 0, max: Number(form.salary.max) || 0 },
            stipend: { min: Number(form.stipend.min) || 0, max: Number(form.stipend.max) || 0 },
            rounds: form.rounds ? form.rounds.split(',').map(s => s.trim()).filter(Boolean) : [],
          };
      if (editJob) {
        await api.put(tab === 'Internship' ? `/internships/${editJob._id}` : `/jobs/${editJob._id}`, payload);
        toast.success(`${tab} updated!`);
      } else {
        await api.post(tab === 'Internship' ? '/internships' : '/jobs', payload);
        toast.success(`${tab} posted! Students notified.`);
      }
      setShowModal(false); fetchJobs();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this posting? All applications will also be removed.')) return;
    try { await api.delete(tab === 'Internship' ? `/internships/${id}` : `/jobs/${id}`); toast.success('Deleted'); fetchJobs(); }
    catch { toast.error('Failed to delete'); }
  };

  const downloadBulkResumes = async (jobId, company) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/students/resume/download-bulk/${jobId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { toast.error('No resumes found'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${company}_resumes.zip`; a.click();
      toast.success('Resumes downloaded!');
    } catch { toast.error('Download failed'); }
  };

  const isInternship = tab === 'Internship';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Manage Postings</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Post {tab === 'Job' ? 'New Job' : 'New Internship'}
        </button>
      </div>

      {/* Tab switcher + Search + Filter on same line */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 bg-[var(--bg-secondary)] rounded-xl p-1 border border-[var(--border-glow)] w-fit flex-shrink-0">
          {[['Job','💼 Jobs'], ['Internship','🎓 Internships']].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === val ? 'bg-transparent shadow text-[var(--neon-blue)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
          <input className="input pl-9" placeholder={`Search ${tab.toLowerCase()}s...`} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-40 flex-shrink-0" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option>Open</option>
          <option>Closed</option>
          <option>Draft</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-card)] border-b border-[var(--border-glow)]">
              <tr>
                {['Title', 'Company', isInternship ? 'Stipend/Duration' : 'Salary', 'Courses', 'Deadline', 'Applicants', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="8" className="text-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--neon-blue)] mx-auto" /></td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-12 text-[var(--text-muted)]">No {tab.toLowerCase()}s posted yet</td></tr>
              ) : jobs.map(job => (
                <tr key={job._id} className="hover:bg-[var(--bg-card-hover)]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--text-primary)]">{job.title}</div>
                    <div className="text-xs text-[var(--text-muted)]">{job.location}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{job.company}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                    {isInternship
                      ? <span>{job.stipend?.min ? `₹${job.stipend.min}–${job.stipend.max || '?'}/mo` : '—'}{job.duration ? ` · ${job.duration}` : ''}{job.isPPO ? ' · PPO' : ''}</span>
                      : <span>{job.salary?.min ? `₹${job.salary.min}–${job.salary.max || '?'} LPA` : '—'}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                    {job.eligibility?.allowedCourses?.length ? job.eligibility.allowedCourses.join(', ') : 'All'}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs whitespace-nowrap">
                    {new Date(job.applicationDeadline).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={isInternship ? `/admin/internships/${job._id}/applicants` : `/admin/jobs/${job._id}/applicants`} className="flex items-center gap-1 text-[var(--neon-blue)] hover:underline text-xs">
                      <Users size={13} /> {job.applicantsCount}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${job.status === 'Open' ? 'bg-green-100 text-[var(--neon-green)]' : job.status === 'Closed' ? 'badge badge-not-placed' : 'badge-not-done'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(job)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--neon-blue)] hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => downloadBulkResumes(job._id, job.company)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--neon-green)] hover:bg-green-50 rounded-lg transition-colors" title="Download all resumes"><Download size={14} /></button>
                      <button onClick={() => handleDelete(job._id)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--neon-pink)] hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="modal-card w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-glow)]">
              <div className="flex items-center gap-2">
                {isInternship ? <GraduationCap size={20} className="text-[var(--neon-purple)]" /> : <Briefcase size={20} className="text-[var(--neon-blue)]" />}
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{editJob ? 'Edit' : 'Post New'} {form.postType}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">{form.postType} Title *</label>
                  <input className="input" placeholder={isInternship ? 'e.g. Frontend Development Intern' : 'e.g. Software Engineer'} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Company *</label>
                  <input className="input" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Location *</label>
                  <input className="input" placeholder="Mumbai / Remote / Hybrid" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                </div>

                {!isInternship && (
                  <div>
                    <label className="label">Job Type</label>
                    <select className="input" value={form.jobType} onChange={e => setForm(p => ({ ...p, jobType: e.target.value }))}>
                      {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                )}

                {isInternship && (
                  <>
                    <div>
                      <label className="label">Duration</label>
                      <input className="input" placeholder="e.g. 3 months, 6 months" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Stipend Min (₹/month)</label>
                      <input className="input" type="number" value={form.stipend.min} onChange={e => setForm(p => ({ ...p, stipend: { ...p.stipend, min: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="label">Stipend Max (₹/month)</label>
                      <input className="input" type="number" value={form.stipend.max} onChange={e => setForm(p => ({ ...p, stipend: { ...p.stipend, max: e.target.value } }))} />
                    </div>
                    <div className="col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.isPPO} onChange={e => setForm(p => ({ ...p, isPPO: e.target.checked }))} className="accent-blue-600 w-4 h-4" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">Pre-Placement Offer (PPO) opportunity</span>
                      </label>
                    </div>
                  </>
                )}

                {!isInternship && (
                  <>
                    <div>
                      <label className="label">Salary Min (LPA)</label>
                      <input className="input" type="number" value={form.salary.min} onChange={e => setForm(p => ({ ...p, salary: { ...p.salary, min: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="label">Salary Max (LPA)</label>
                      <input className="input" type="number" value={form.salary.max} onChange={e => setForm(p => ({ ...p, salary: { ...p.salary, max: e.target.value } }))} />
                    </div>
                  </>
                )}

                <div>
                  <label className="label">Application Deadline *</label>
                  <input className="input" type="date" value={form.applicationDeadline} onChange={e => setForm(p => ({ ...p, applicationDeadline: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Drive Date (optional)</label>
                  <input className="input" type="date" value={form.driveDate} onChange={e => setForm(p => ({ ...p, driveDate: e.target.value }))} />
                </div>

                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <option>Open</option><option>Closed</option><option>Draft</option>
                  </select>
                </div>
                <div>
                  <label className="label">Min CGPA</label>
                  <input className="input" type="number" step="0.1" min="0" max="10" value={form.eligibility.minCGPA}
                    onChange={e => setForm(p => ({ ...p, eligibility: { ...p.eligibility, minCGPA: e.target.value } }))} />
                </div>

                {/* Allowed Courses Checkboxes */}
                <div className="col-span-2">
                  <label className="label">Allowed Courses</label>
                  <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-glow)]">
                    {ALL_COURSES.map(course => (
                      <label key={course} className="flex items-center gap-2 cursor-pointer hover:bg-transparent rounded-lg p-1.5 transition-colors">
                        <input type="checkbox" checked={form.eligibility.allowedCourses.includes(course)}
                          onChange={() => toggleCourse(course)} className="accent-blue-600 w-4 h-4 flex-shrink-0" />
                        <span className="text-sm text-[var(--text-primary)]">{course}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Leave all unchecked = all courses eligible</p>
                </div>

                <div className="col-span-2">
                  <label className="label">{form.postType} Description *</label>
                  <textarea className="input" rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="label">Requirements</label>
                  <textarea className="input" rows={2} value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="label">Required Skills (comma-separated)</label>
                  <input className="input" placeholder="JavaScript, React, Node.js" value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="label">Selection Rounds (comma-separated)</label>
                  <input className="input" placeholder="Aptitude Test, Technical Interview, HR" value={form.rounds} onChange={e => setForm(p => ({ ...p, rounds: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : editJob ? `Update ${form.postType}` : `Post ${form.postType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
