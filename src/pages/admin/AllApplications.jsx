import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { ChevronRight, Download, Search } from 'lucide-react';
import useScrollReveal from '../../hooks/useScrollReveal';

const STATUS_BADGE = {
  'Applied':             'badge-ongoing',
  'Shortlisted':         'badge-in-process',
  'Interview Scheduled': 'badge-internship',
  'Offer Extended':      'badge-placed',
  'Selected':            'badge-placed',
  'Placed':              'badge-placed',
  'Rejected':            'badge-not-placed',
  'On Hold':             'badge-not-done',
};

const COURSES = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'BBA', 'MBA', 'B.Sc', 'M.Sc', 'B.Com', 'M.Com'];

export default function AllApplications() {
  useScrollReveal();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (statusFilter) params.append('status', statusFilter);
    if (courseFilter) params.append('course', courseFilter);
    if (typeFilter) params.append('postType', typeFilter);
    if (search) params.append('search', search);
    api.get(`/applications?${params}`)
      .then(res => {
        setApplications(res.data.applications || []);
        setTotal(res.data.total || 0);
        setError('');
      })
      .catch(err => {
        console.error(err);
        setApplications([]);
        setTotal(0);
        setError(err.response?.data?.message || 'Unable to load applications');
      }).finally(() => setLoading(false));
  }, [page, statusFilter, courseFilter, typeFilter, search]);

  const statuses = ['', 'Applied', 'Shortlisted', 'Interview Scheduled', 'Offer Extended', 'Selected', 'Placed', 'Rejected', 'On Hold', 'Withdrawn'];

  const downloadResume = async (student) => {
    try {
      const res = await api.get(`/students/resume/download/${student._id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(student.user?.name || 'student').replace(/[^a-zA-Z0-9]/g, '_')}_resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Resume download failed');
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between scroll-reveal">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--neon-blue)', letterSpacing: '0.08em' }}>ALL APPLICATIONS</h1>
          <span className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>{total} total applications</span>
        </div>
      </div>

      <div className="space-y-3 scroll-reveal delay-100">
        <div className="flex flex-wrap gap-2">
          {statuses.map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: statusFilter === s ? 'var(--neon-blue)' : 'transparent',
                color: statusFilter === s ? '#000' : 'var(--text-secondary)',
                border: `1px solid ${statusFilter === s ? 'var(--neon-blue)' : 'var(--border-glow)'}`,
                fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em',
                boxShadow: statusFilter === s ? '0 0 12px rgba(0,212,255,0.3)' : 'none'
              }}>
              {s || 'All Status'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-56">
            <Search size={15} className="absolute left-3 top-9" style={{ color: 'var(--text-muted)' }} />
            <label className="label">Search</label>
            <input className="input pl-9 py-2 text-sm" placeholder="Name, email, roll no, course..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="w-48">
            <label className="label">Course</label>
            <select className="input py-2 text-sm" value={courseFilter} onChange={e => { setCourseFilter(e.target.value); setPage(1); }}>
              <option value="">All Courses</option>
              {COURSES.map(course => <option key={course} value={course}>{course}</option>)}
            </select>
          </div>
          <div className="w-40">
            <label className="label">Type</label>
            <select className="input py-2 text-sm" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              <option value="Job">Job</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
          {(statusFilter || courseFilter || typeFilter || search) && (
            <button onClick={() => { setStatusFilter(''); setCourseFilter(''); setTypeFilter(''); setSearch(''); setPage(1); }} className="btn-secondary py-2 px-3 text-xs">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="scroll-reveal delay-200" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glow)', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,var(--neon-blue),transparent)', opacity: 0.6 }} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Student', 'Course', 'Position', 'Type', 'Company', 'Applied On', 'Status', 'Resume', 'View'].map(h => (
                  <th key={h} className="text-left px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="text-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: 'var(--neon-blue)' }} />
                </td></tr>
              ) : applications.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-12" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>{error || 'No applications found'}</td></tr>
              ) : applications.map(app => {
                const position = app.position || app.job;
                const applicationType = app.applicationType || position?.postType || 'Job';
                return (
                <tr key={`${applicationType}-${app._id}`}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>{app.student?.user?.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{app.student?.user?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>{app.student?.course || '-'}</td>
                  <td className="px-4 py-3 font-semibold text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>{position?.title}</td>
                  <td className="px-4 py-3">
                    {applicationType === 'Internship'
                      ? <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(176,64,255,0.1)', color: 'var(--neon-purple)', border: '1px solid rgba(176,64,255,0.3)' }}>Internship</span>
                      : <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--neon-blue)', border: '1px solid rgba(0,212,255,0.3)' }}>Job</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>{position?.company}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{new Date(app.appliedAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_BADGE[app.status] || 'badge-not-done'} text-xs`}>{app.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {app.student?._id ? (
                      <button onClick={() => downloadResume(app.student)} className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--neon-green)', fontFamily: 'Rajdhani, sans-serif' }}>
                        <Download size={12} /> Resume
                      </button>
                    ) : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={applicationType === 'Internship' ? `/admin/internships/${position?._id}/applicants` : `/admin/jobs/${position?._id}/applicants`}
                      className="text-xs font-semibold flex items-center gap-1 transition-colors"
                      style={{ color: 'var(--neon-blue)', textDecoration: 'none', fontFamily: 'Rajdhani, sans-serif' }}>
                      View <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm scroll-reveal delay-300" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>
        <span>Showing {applications.length} of {total}</span>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1 px-3 disabled:opacity-30 text-xs">Prev</button>
          <button disabled={applications.length < 20} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1 px-3 disabled:opacity-30 text-xs">Next</button>
        </div>
      </div>
    </div>
  );
}

