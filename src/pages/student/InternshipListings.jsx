import useScrollReveal from '../../hooks/useScrollReveal';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Search, MapPin, Clock, ChevronRight, GraduationCap, Users } from 'lucide-react';

const MODES = ['All', 'On-site', 'Remote', 'Hybrid'];

export default function InternshipListings() {
  useScrollReveal();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [studentCourse, setStudentCourse] = useState('');

  useEffect(() => {
    api.get('/students/profile')
      .then(res => setStudentCourse(res.data.student?.course || ''))
      .catch(() => {});
  }, []);

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: 'Open', page, limit: 12 });
      if (search) params.append('search', search);
      if (mode !== 'All') params.append('mode', mode);
      const res = await api.get(`/internships?${params}`);
      setInternships(res.data.internships || []);
      setTotalPages(res.data.pages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInternships(); }, [page, mode]);
  useEffect(() => { setPage(1); fetchInternships(); }, [search]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="scroll-reveal">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--neon-purple)', letterSpacing: '0.08em' }}>🎓 INTERNSHIP LISTINGS</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>
          {studentCourse
            ? <>Showing internships for <span style={{ color: 'var(--neon-purple)' }}>{studentCourse}</span> · {totalCount} available</>
            : 'Gain real-world experience with internship opportunities'}
        </p>
      </div>

      {/* Search + Mode filters — same layout as JobListings */}
      <div className="flex gap-3 flex-wrap scroll-reveal delay-100">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-2.5" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9" placeholder="Search internships, companies..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {MODES.map(m => (
            <button key={m} onClick={() => { setMode(m); setPage(1); }}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: mode === m ? 'var(--neon-purple)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${mode === m ? 'var(--neon-purple)' : 'var(--border-glow)'}`,
                fontFamily: 'Rajdhani, sans-serif',
                boxShadow: mode === m ? '0 0 12px rgba(176,64,255,0.4)' : 'none'
              }}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--neon-purple)' }} />
        </div>
      ) : internships.length === 0 ? (
        <div className="card text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">No internships available for your course</p>
          <p className="text-sm mt-1">
            {search ? 'Try a different search term' : 'New internships will appear here when posted'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {internships.map((intern, i) => (
            <Link key={intern._id} to={`/student/internships/${intern._id}`}
              className={`card hover:shadow-md transition-all group block scroll-reveal delay-${Math.min(i * 100, 400)}`}
              style={{ textDecoration: 'none', position: 'relative' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium mb-1 inline-block"
                    style={{ background: 'rgba(176,64,255,0.12)', color: 'var(--neon-purple)', border: '1px solid rgba(176,64,255,0.3)' }}>
                    {intern.mode || 'On-site'}
                  </span>
                  <h3 className="font-bold text-sm mb-0.5 group-hover:text-[var(--neon-purple)] transition-colors" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>{intern.title}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{intern.company}</p>
                </div>
                {intern.isPPO && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--neon-green)', border: '1px solid rgba(0,255,136,0.3)' }}>
                    PPO
                  </span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap mb-3">
                {intern.duration && <span className="badge badge-ongoing text-xs">⏱ {intern.duration}</span>}
                {intern.stipend?.amount > 0 && <span className="badge badge-placed text-xs">₹{intern.stipend.amount.toLocaleString()}/mo</span>}
                {intern.eligibility?.allowedCourses?.length > 0 && (
                  <span className="badge badge-internship text-xs">
                    {intern.eligibility.allowedCourses.slice(0, 2).join(', ')}{intern.eligibility.allowedCourses.length > 2 ? '...' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                <span className="flex items-center gap-1"><MapPin size={10} />{intern.location}</span>
                <span className="flex items-center gap-1"><Clock size={10} />{new Date(intern.applicationDeadline).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border-glow)' }}>
                <div className="flex items-center gap-3">
                  {intern.eligibility?.minCGPA > 0 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Min CGPA: {intern.eligibility.minCGPA}</span>}
                  {intern.applicantsCount > 0 && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Users size={10} /> {intern.applicantsCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold flex items-center gap-1 ml-auto" style={{ color: 'var(--neon-purple)' }}>Apply Now <ChevronRight size={13} /></span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 scroll-reveal">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary disabled:opacity-40 text-sm px-3 py-1.5">← Prev</button>
          <span className="px-4 py-1.5 text-sm rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glow)', color: 'var(--neon-purple)', fontFamily: 'JetBrains Mono, monospace' }}>
            {page} / {totalPages}
          </span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary disabled:opacity-40 text-sm px-3 py-1.5">Next →</button>
        </div>
      )}
    </div>
  );
}
