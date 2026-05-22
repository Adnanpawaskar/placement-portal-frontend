import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Search, MapPin, Clock, ChevronRight, GraduationCap } from 'lucide-react';
import useScrollReveal from '../../hooks/useScrollReveal';

const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Remote'];

export default function JobListings() {
  useScrollReveal();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [studentCourse, setStudentCourse] = useState('');

  // Load student profile once to show their course in the header
  useEffect(() => {
    api.get('/students/profile')
      .then(res => setStudentCourse(res.data.student?.course || ''))
      .catch(() => {});
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Backend automatically filters by student's course via JWT — no extra param needed
      const params = new URLSearchParams({ status: 'Open', postType: 'Job', page, limit: 12 });
      if (search) params.append('search', search);
      if (jobType !== 'All') params.append('jobType', jobType);
      const res = await api.get(`/jobs?${params}`);
      setJobs(res.data.jobs || []);
      setTotalPages(res.data.pages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [page, jobType]);
  useEffect(() => { setPage(1); fetchJobs(); }, [search]);

  const isDeadlineSoon = (date) => {
    const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    return diff <= 3 && diff > 0;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="scroll-reveal">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--neon-blue)', letterSpacing: '0.08em' }}>💼 JOB LISTINGS</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>
          {studentCourse
            ? <>Showing jobs eligible for <span style={{ color: 'var(--neon-cyan)' }}>{studentCourse}</span> · {totalCount} available</>
            : 'Full-time, part-time and contract opportunities'}
        </p>
      </div>

      {/* Search + Filter row */}
      <div className="flex gap-3 flex-wrap scroll-reveal delay-100">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-2.5" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9" placeholder="Search jobs, companies..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {JOB_TYPES.map(t => (
            <button key={t} onClick={() => { setJobType(t); setPage(1); }}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: jobType === t ? 'var(--neon-blue)' : 'transparent',
                color: jobType === t ? '#000' : 'var(--text-secondary)',
                border: `1px solid ${jobType === t ? 'var(--neon-blue)' : 'var(--border-glow)'}`,
                fontFamily: 'Rajdhani, sans-serif',
                boxShadow: jobType === t ? '0 0 12px rgba(0,212,255,0.4)' : 'none'
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--neon-blue)' }} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">No jobs found for your course</p>
          <p className="text-sm mt-1">
            {search ? 'Try a different search term' : 'New openings will appear here as companies post drives'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job, i) => (
            <Link key={job._id} to={`/student/jobs/${job._id}`}
              className={`card scroll-reveal delay-${Math.min(i * 100, 400)} block group`}
              style={{ textDecoration: 'none', position: 'relative' }}>
              {isDeadlineSoon(job.applicationDeadline) && (
                <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(255,45,154,0.15)', color: 'var(--neon-pink)', border: '1px solid rgba(255,45,154,0.3)' }}>
                  Closing Soon
                </span>
              )}
              <h3 className="font-bold text-sm mb-0.5 pr-20" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>{job.title}</h3>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{job.company}</p>
              <div className="flex gap-2 flex-wrap mb-3">
                <span className="badge badge-ongoing text-xs">{job.jobType}</span>
                {job.salary?.min > 0 && <span className="badge badge-placed text-xs">₹{job.salary.min}–{job.salary.max} LPA</span>}
                {job.eligibility?.allowedCourses?.length > 0 && (
                  <span className="badge badge-internship text-xs">{job.eligibility.allowedCourses.slice(0, 2).join(', ')}{job.eligibility.allowedCourses.length > 2 ? '...' : ''}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>
                <span className="flex items-center gap-1"><Clock size={10} />{new Date(job.applicationDeadline).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border-glow)' }}>
                {job.eligibility?.minCGPA > 0 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Min CGPA: {job.eligibility.minCGPA}</span>}
                <span className="text-xs font-semibold flex items-center gap-1 ml-auto" style={{ color: 'var(--neon-blue)' }}>View & Apply <ChevronRight size={13} /></span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 scroll-reveal">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary disabled:opacity-40 text-sm px-3 py-1.5">← Prev</button>
          <span className="px-4 py-1.5 text-sm rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glow)', color: 'var(--neon-blue)', fontFamily: 'JetBrains Mono, monospace' }}>
            {page} / {totalPages}
          </span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary disabled:opacity-40 text-sm px-3 py-1.5">Next →</button>
        </div>
      )}
    </div>
  );
}
