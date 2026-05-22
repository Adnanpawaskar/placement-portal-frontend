import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, FileText, Bell, Award, X, ChevronRight } from 'lucide-react';
import useScrollReveal from '../../hooks/useScrollReveal';

const STATUS_BADGE = {
  'Applied':             { cls: 'badge-ongoing',    label: 'Applied' },
  'Shortlisted':         { cls: 'badge-in-process', label: 'Shortlisted' },
  'Interview Scheduled': { cls: 'badge-internship', label: 'Interview' },
  'Selected':            { cls: 'badge-placed',     label: 'Selected' },
  'Rejected':            { cls: 'badge-not-placed', label: 'Rejected' },
  'On Hold':             { cls: 'badge-not-done',   label: 'On Hold' },
};

export default function StudentDashboard() {
  useScrollReveal();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/students/profile').catch(() => ({ data: { student: null } })),
      api.get('/applications/my').catch(() => ({ data: { applications: [] } })),
      api.get('/jobs?status=Open&limit=5').catch(() => ({ data: { jobs: [] } })),
      api.get('/notifications/my').catch(() => ({ data: { notifications: [] } }))
    ]).then(([p, a, j, n]) => {
      setProfile(p.data.student);
      setApplications(a.data.applications || []);
      setJobs(j.data.jobs || []);
      setNotifications((n.data.notifications || []).slice(0, 3));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--neon-cyan)' }} />
    </div>
  );

  // Safe defaults so nothing is blank for newly registered students
  const safeProfile = profile || {};
  const unread = notifications.filter(n => !n.isRead);
  const completion = [
    !!safeProfile.phone,
    !!safeProfile.cgpa,
    !!(safeProfile.skills?.length),
    !!(safeProfile.resume?.filename),
    !!safeProfile.linkedIn,
    !!safeProfile.dateOfBirth,
    !!safeProfile.address
  ].filter(Boolean).length * 100 / 7;
  const placed = applications.filter(a => a.status === 'Selected').length;
  const shortlisted = applications.filter(a => ['Shortlisted','Interview Scheduled'].includes(a.status)).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Notification banner */}
      {!bannerDismissed && unread.length > 0 && (
        <div className="scroll-reveal flex items-center justify-between gap-4 px-5 py-3 rounded-xl"
          style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.3)', boxShadow: '0 0 20px rgba(0,212,255,0.1)' }}>
          <div className="flex items-center gap-3">
            <Bell size={16} style={{ color: 'var(--neon-cyan)' }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>
                {unread.length} unread notification{unread.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{unread[0]?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/student/notifications" className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--neon-cyan)', color: '#000' }}>View All</Link>
            <button onClick={() => setBannerDismissed(true)} style={{ color: 'var(--text-muted)' }}><X size={15} /></button>
          </div>
        </div>
      )}

      {/* Hero welcome */}
      <div className="scroll-reveal relative rounded-2xl p-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #001a33 0%, #002d55 50%, #0a1628 100%)', border: '1px solid rgba(0,255,245,0.2)', boxShadow: '0 0 40px rgba(0,212,255,0.1)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,var(--neon-cyan),transparent)' }} />
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: 200, height: 200, background: 'radial-gradient(circle, rgba(0,255,245,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--neon-cyan)', letterSpacing: '0.05em' }}>
          Welcome, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>Track your placement journey</p>
        <div className="flex gap-8">
          {[
            { val: applications.length, label: 'Applications' },
            { val: placed, label: 'Offers' },
            { val: jobs.length, label: 'Open Jobs' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-bold" style={{ color: 'var(--neon-cyan)', fontFamily: 'Orbitron, sans-serif' }}>{s.val}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>


      {/* Placement Status Banner — shown when placed */}
      {safeProfile.placementStatus === 'Placed' && safeProfile.placedAt && (
        <div className="scroll-reveal rounded-2xl p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #001a0d 0%, #003322 60%, #0a1628 100%)', border: '1px solid rgba(0,255,136,0.4)', boxShadow: '0 0 40px rgba(0,255,136,0.15)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,#00ff88,transparent)' }} />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.4)', boxShadow: '0 0 20px rgba(0,255,136,0.2)' }}>
              <Award size={28} style={{ color: '#00ff88' }} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'rgba(0,255,136,0.7)', fontFamily: 'Rajdhani, sans-serif' }}>🎉 PLACEMENT CONFIRMED</p>
              <p className="text-xl font-bold" style={{ color: '#00ff88', fontFamily: 'Orbitron, sans-serif' }}>{safeProfile.placedAt}</p>
              {safeProfile.packageOffered > 0 && (
                <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
                  Package: <span style={{ color: '#00ff88', fontWeight: 700 }}>₹{safeProfile.packageOffered} LPA</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Internship Status Banner — shown when doing/done internship */}
      {safeProfile.internshipStatus === 'Ongoing' && safeProfile.internshipCompany && (
        <div className="scroll-reveal rounded-2xl p-4"
          style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.3)' }}>
          <div className="flex items-center gap-3">
            <Briefcase size={20} style={{ color: 'var(--neon-blue)' }} />
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>CURRENT INTERNSHIP</p>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>{safeProfile.internshipCompany}
                {safeProfile.internshipStipend > 0 && <span style={{ color: 'var(--neon-blue)' }}> · ₹{safeProfile.internshipStipend.toLocaleString()}/month</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Applied', value: applications.length, icon: FileText, color: 'var(--neon-blue)' },
          { label: 'Shortlisted', value: shortlisted, icon: Award, color: 'var(--neon-orange)' },
          { label: 'Offers', value: placed, icon: Award, color: 'var(--neon-green)' },
          { label: 'Open Jobs', value: jobs.length, icon: Briefcase, color: 'var(--neon-purple)' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <div key={label} className={`card scroll-reveal delay-${i * 100} text-center`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Orbitron, sans-serif' }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile completion */}
        <div className="card scroll-reveal-left">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--neon-cyan)', letterSpacing: '0.06em' }}>PROFILE</h3>
            <Link to="/student/profile" className="text-xs font-semibold" style={{ color: 'var(--neon-blue)' }}>Update →</Link>
          </div>
          <div className="mb-1 flex justify-between text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>
            <span>Completion</span>
            <span style={{ color: 'var(--neon-cyan)' }}>{Math.round(completion)}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: 'var(--border-glow)' }}>
            <div className="h-2 rounded-full transition-all"
              style={{ width: `${completion}%`, background: 'linear-gradient(90deg, var(--neon-blue), var(--neon-cyan))', boxShadow: '0 0 8px rgba(0,212,255,0.5)' }} />
          </div>
          <div className="mt-4 space-y-2 text-xs" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {!safeProfile.resume?.filename && <div style={{ color: 'var(--neon-orange)' }}>⚠ Upload resume to apply</div>}
            {!safeProfile.cgpa && <div style={{ color: 'var(--neon-orange)' }}>⚠ Add your CGPA</div>}
            {!safeProfile.skills?.length && <div style={{ color: 'var(--neon-orange)' }}>⚠ Add your skills</div>}
            {completion >= 100 && <div style={{ color: 'var(--neon-green)' }}>✓ Profile complete!</div>}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card col-span-1 lg:col-span-2 scroll-reveal-right">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--neon-purple)', letterSpacing: '0.06em' }}>APPLICATIONS</h3>
            <Link to="/student/applications" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--neon-blue)' }}>
              View all <ChevronRight size={13} />
            </Link>
          </div>
          {applications.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <Briefcase size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No applications yet</p>
              <Link to="/student/jobs" className="text-xs font-semibold" style={{ color: 'var(--neon-blue)' }}>Browse jobs</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {applications.slice(0, 4).map(app => {
                const cfg = STATUS_BADGE[app.status] || STATUS_BADGE['Applied'];
                return (
                  <div key={app._id} className="flex items-center justify-between py-2 px-3 rounded-lg"
                    style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-glow)' }}>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>{app.job?.title}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{app.job?.company}</div>
                    </div>
                    <span className={`badge ${cfg.cls} text-xs`}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Latest Jobs */}
      <div className="card scroll-reveal delay-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--neon-blue)', letterSpacing: '0.06em' }}>LATEST OPENINGS</h3>
          <Link to="/student/jobs" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--neon-blue)' }}>See all <ChevronRight size={13} /></Link>
        </div>
        {jobs.length === 0 ? (
          <p className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>No open positions currently</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {jobs.slice(0, 3).map(job => (
              <Link key={job._id} to={`/student/jobs/${job._id}`}
                className="block p-4 rounded-xl transition-all duration-300"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glow)', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,212,255,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>{job.title}</div>
                <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{job.company}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge badge-ongoing text-xs">{job.jobType}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{job.location}</span>
                </div>
                <div className="text-xs mt-2" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                  Deadline: {new Date(job.applicationDeadline).toLocaleDateString('en-IN')}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
