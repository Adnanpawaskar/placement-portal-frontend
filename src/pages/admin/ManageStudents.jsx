import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, Download, Eye, CheckSquare, Square, Filter } from 'lucide-react';
import useScrollReveal from '../../hooks/useScrollReveal';

const statusBadge = (s) => {
  const map = { 'Placed': 'badge-placed', 'Not Placed': 'badge-not-placed', 'In Process': 'badge-in-process' };
  return map[s] || 'badge-not-placed';
};
const internshipBadge = (s) => {
  const map = { 'Completed': 'badge-completed', 'Ongoing': 'badge-ongoing', 'Not Done': 'badge-not-done' };
  return map[s] || 'badge-not-done';
};

export default function ManageStudents() {
  useScrollReveal();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('');
  const [branch, setBranch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cgpaFilter, setCgpaFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [internshipFilter, setInternshipFilter] = useState('');
  const [resumeFilter, setResumeFilter] = useState('');
  const [joiningLetterFilter, setJoiningLetterFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingSelected, setDownloadingSelected] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchStudents = async (overridePage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: overridePage ?? page, limit: 15 });
      if (search) params.append('search', search);
      if (course) params.append('course', course);
      if (branch) params.append('branch', branch);
      if (statusFilter) params.append('status', statusFilter);
      if (cgpaFilter) params.append('cgpa', cgpaFilter);
      if (semesterFilter) params.append('semester', semesterFilter);
      if (internshipFilter) params.append('internshipStatus', internshipFilter);
      if (resumeFilter) params.append('hasResume', resumeFilter);
      if (joiningLetterFilter) params.append('hasJoiningLetter', joiningLetterFilter);
      const res = await api.get(`/students?${params}`);
      setStudents(res.data.students);
      setTotal(res.data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, [page, course, branch, statusFilter, cgpaFilter, semesterFilter, internshipFilter, resumeFilter, joiningLetterFilter]);

  // Debounce search so it doesn't race with other filters
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchStudents(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const toggleStatus = async (studentId) => {
    try {
      const res = await api.put(`/admin/students/${studentId}/toggle`);
      toast.success(res.data.message);
      fetchStudents();
    } catch (err) { toast.error('Failed to update status'); }
  };

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => selectedIds.length === students.length ? setSelectedIds([]) : setSelectedIds(students.map(s => s._id));

  const downloadAllResumes = async () => {
    setDownloadingAll(true);
    try {
      const params = new URLSearchParams();
      if (course) params.append('course', course);
      if (branch) params.append('branch', branch);
      if (statusFilter) params.append('status', statusFilter);
      if (cgpaFilter) params.append('cgpa', cgpaFilter);
      if (semesterFilter) params.append('semester', semesterFilter);
      if (internshipFilter) params.append('internshipStatus', internshipFilter);
      if (resumeFilter) params.append('hasResume', resumeFilter);
      if (joiningLetterFilter) params.append('hasJoiningLetter', joiningLetterFilter);
      if (search) params.append('search', search);
      const res = await api.get(`/admin/resumes/download-all?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/zip' }));
      const a = document.createElement('a'); a.href = url; a.download = `all-resumes-${Date.now()}.zip`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Resumes downloaded!');
    } catch (err) { toast.error(err.response?.status === 404 ? 'No resumes found for the selected filters' : 'Failed to download resumes'); }
    finally { setDownloadingAll(false); }
  };

  const downloadSelectedResumes = async () => {
    if (selectedIds.length === 0) { toast.error('Select at least one student'); return; }
    setDownloadingSelected(true);
    try {
      const res = await api.post('/admin/resumes/download-selective', { studentIds: selectedIds }, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/zip' }));
      const a = document.createElement('a'); a.href = url; a.download = `selected-resumes-${Date.now()}.zip`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`${selectedIds.length} resume(s) downloaded!`);
    } catch (err) { toast.error(err.response?.status === 404 ? 'No resumes found for selected students' : 'Failed to download selected resumes'); }
    finally { setDownloadingSelected(false); }
  };

  const downloadResume = async (studentId, name = 'student') => {
    try {
      const res = await api.get(`/students/resume/download/${studentId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Resume download failed');
    }
  };

  const downloadJoiningLetter = async (student) => {
    try {
      const res = await api.get(`/students/joining-letter/download/${student._id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      const name = (student.user?.name || 'student').replace(/[^a-zA-Z0-9]/g, '_');
      const ext = student.joiningLetter?.filename?.match(/\.[^.]+$/)?.[0] || '.pdf';
      a.href = url;
      a.download = `${name}_joining_letter${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Joining letter download failed');
    }
  };

  const clearFilters = () => { setCourse(''); setBranch(''); setStatusFilter(''); setCgpaFilter(''); setSemesterFilter(''); setInternshipFilter(''); setResumeFilter(''); setJoiningLetterFilter(''); setSearch(''); setPage(1); };
  const activeFilters = [course, branch, statusFilter, cgpaFilter, semesterFilter, internshipFilter, resumeFilter, joiningLetterFilter].filter(Boolean).length;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 scroll-reveal">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--neon-blue)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
            MANAGE STUDENTS
          </h1>
          <span className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>{total} students enrolled</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedIds.length > 0 && (
            <button onClick={downloadSelectedResumes} disabled={downloadingSelected}
              className="flex items-center gap-2 text-sm py-2 px-3 rounded-lg font-semibold transition-all"
              style={{ background: 'rgba(176,64,255,0.1)', border: '1px solid var(--neon-purple)', color: 'var(--neon-purple)', fontFamily: 'Rajdhani, sans-serif' }}>
              <Download size={14} />{downloadingSelected ? 'Downloading...' : `Download ${selectedIds.length} Resume(s)`}
            </button>
          )}
          <button onClick={downloadAllResumes} disabled={downloadingAll} className="btn-primary flex items-center gap-2 text-sm py-2">
            <Download size={14} />{downloadingAll ? 'Downloading...' : 'Download All Resumes'}
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3 items-center scroll-reveal delay-100">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-2.5" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary flex items-center gap-2 text-sm"
          style={activeFilters > 0 ? { borderColor: 'var(--neon-blue)', color: 'var(--neon-blue)', background: 'rgba(0,212,255,0.06)' } : {}}>
          <Filter size={14} />Filters
          {activeFilters > 0 && (
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--neon-blue)', color: '#000' }}>{activeFilters}</span>
          )}
        </button>
        {activeFilters > 0 && (
          <button onClick={clearFilters} className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--neon-pink)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>✕ Clear</button>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="card scroll-reveal py-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="label">Course</label>
            <select className="input text-sm" value={course} onChange={e => { setCourse(e.target.value); setPage(1); }}>
              <option value="">All Courses</option>
              {['B.Tech', 'M.Tech', 'BCA', 'MCA', 'BBA', 'MBA', 'B.Sc', 'M.Sc'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Branch</label>
            <input className="input text-sm" placeholder="e.g. CSE" value={branch} onChange={e => { setBranch(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="label">Placement Status</label>
            <select className="input text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option>Placed</option><option>Not Placed</option><option>In Process</option>
            </select>
          </div>
          <div>
            <label className="label">Min CGPA</label>
            <select className="input text-sm" value={cgpaFilter} onChange={e => { setCgpaFilter(e.target.value); setPage(1); }}>
              <option value="">Any CGPA</option>
              {[6, 6.5, 7, 7.5, 8, 8.5, 9].map(v => <option key={v} value={v}>≥ {v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Semester</label>
            <select className="input text-sm" value={semesterFilter} onChange={e => { setSemesterFilter(e.target.value); setPage(1); }}>
              <option value="">All Semesters</option>
              {Array.from({ length: 8 }, (_, i) => i + 1).map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Internship Status</label>
            <select className="input text-sm" value={internshipFilter} onChange={e => { setInternshipFilter(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option>Not Done</option><option>Ongoing</option><option>Completed</option>
            </select>
          </div>
          <div>
            <label className="label">Resume</label>
            <select className="input text-sm" value={resumeFilter} onChange={e => { setResumeFilter(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="true">Uploaded</option>
              <option value="false">Not Uploaded</option>
            </select>
          </div>
          <div>
            <label className="label">Joining Letter</label>
            <select className="input text-sm" value={joiningLetterFilter} onChange={e => { setJoiningLetterFilter(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="true">Uploaded</option>
              <option value="false">Not Uploaded</option>
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="scroll-reveal delay-200" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glow)', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--neon-blue), transparent)', opacity: 0.6 }} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-3">
                  <button onClick={toggleSelectAll} style={{ color: 'var(--text-muted)' }}>
                    {selectedIds.length === students.length && students.length > 0
                      ? <CheckSquare size={15} style={{ color: 'var(--neon-blue)' }} />
                      : <Square size={15} />}
                  </button>
                </th>
                {['Name & Contact', 'Roll Number', 'Course / Branch', 'Sem', 'CGPA', 'Resume', 'Joined', 'Internship', 'Placement', 'Actions'].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-bold" style={{ color: 'var(--neon-blue)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" className="text-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: 'var(--neon-blue)' }} />
                </td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan="11" className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No students found</td></tr>
              ) : students.map(s => (
                <tr key={s._id} style={{ background: selectedIds.includes(s._id) ? 'rgba(0,212,255,0.04)' : 'transparent' }}>
                  <td className="px-3 py-3">
                    <button onClick={() => toggleSelect(s._id)} style={{ color: 'var(--text-muted)' }}>
                      {selectedIds.includes(s._id) ? <CheckSquare size={15} style={{ color: 'var(--neon-blue)' }} /> : <Square size={15} />}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>{s.user?.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{s.user?.email}</div>
                    {s.phone && <div className="text-xs" style={{ color: 'var(--neon-blue)', fontFamily: 'JetBrains Mono, monospace' }}>📱 {s.phone}</div>}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: 'rgba(0,212,255,0.08)', color: 'var(--neon-blue)', border: '1px solid rgba(0,212,255,0.2)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{s.rollNumber || '—'}</span>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <div className="font-semibold" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>{s.course}</div>
                    {s.branch && <div style={{ color: 'var(--text-muted)' }}>{s.branch}</div>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Sem {s.semester || '—'}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Yr {s.year || '—'}</div>
                  </td>
                  <td className="px-3 py-3">
                    {s.cgpa ? (
                      <div>
                        <span className="font-bold text-sm" style={{ color: s.cgpa >= 8 ? '#00ff88' : s.cgpa >= 6 ? '#ff8c00' : '#ff2d9a' }}>{s.cgpa}</span>
                        {s.averageCGPA && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>avg {s.averageCGPA}</div>}
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      {s.resume?.filename ? (
                        <button onClick={() => downloadResume(s._id, s.user?.name)} className="text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 w-fit" style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--neon-green)', border: '1px solid rgba(0,255,136,0.3)' }}>
                          <Download size={11} /> Resume Uploaded
                        </button>
                      ) : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No resume</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      {s.joiningLetter?.filename ? (
                        <button onClick={() => downloadJoiningLetter(s)} className="text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 w-fit" style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--neon-green)', border: '1px solid rgba(0,255,136,0.3)' }}>
                          <Download size={11} /> Download
                        </button>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`badge text-xs ${internshipBadge(s.internshipStatus)}`}>{s.internshipStatus || 'Not Done'}</span>
                    {s.internshipCompany && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.internshipCompany}</div>}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`badge ${statusBadge(s.placementStatus)}`}>{s.placementStatus}</span>
                    {s.placedAt && <div className="text-xs mt-0.5" style={{ color: 'var(--neon-green)' }}>{s.placedAt}</div>}
                  </td>
                  
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/admin/students/${s._id}`}
                        className="text-xs px-2 py-1 rounded-full font-semibold transition-all flex items-center gap-1"
                        style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,212,255,0.3)' }}>
                        <Eye size={11} /> View
                      </Link>
                      <button onClick={() => toggleStatus(s._id)}
                        className="text-xs px-2 py-1 rounded-full font-semibold transition-all"
                        style={s.user?.isActive
                          ? { background: 'rgba(255,45,154,0.1)', color: 'var(--neon-pink)', border: '1px solid rgba(255,45,154,0.3)' }
                          : { background: 'rgba(0,255,136,0.1)', color: 'var(--neon-green)', border: '1px solid rgba(0,255,136,0.3)' }}>
                        {s.user?.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center text-sm scroll-reveal delay-300" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>
        <span>Showing {students.length} of {total} {selectedIds.length > 0 && `· ${selectedIds.length} selected`}</span>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1 px-3 disabled:opacity-30 text-xs">Prev</button>
          <span className="py-1 px-3 rounded-lg text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glow)', color: 'var(--neon-blue)' }}>{page}</span>
          <button disabled={students.length < 15} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1 px-3 disabled:opacity-30 text-xs">Next</button>
        </div>
      </div>
    </div>
  );
}
