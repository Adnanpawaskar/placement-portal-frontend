import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FileText, Clock, CheckCircle, XCircle, Calendar, Building2, MapPin, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import useScrollReveal from '../../hooks/useScrollReveal';

const STATUS_CFG = {
  'Applied':             { cls: 'badge-ongoing',    icon: FileText,     step: 1 },
  'Shortlisted':         { cls: 'badge-in-process', icon: Clock,        step: 2 },
  'Interview Scheduled': { cls: 'badge-internship', icon: Calendar,     step: 3 },
  'Offer Extended':      { cls: 'badge-placed',     icon: CheckCircle,  step: 4 },
  'Selected':            { cls: 'badge-placed',     icon: CheckCircle,  step: 5 },
  'Placed':              { cls: 'badge-placed',     icon: CheckCircle,  step: 5 },
  'Rejected':            { cls: 'badge-not-placed', icon: XCircle,      step: 0 },
  'On Hold':             { cls: 'badge-not-done',   icon: Clock,        step: 2 },
};
const PIPELINE = ['Applied','Shortlisted','Interview Scheduled','Offer Extended','Selected'];
const STATUS_TRANSITION = { 'Applied':'Shortlisted','Shortlisted':'Interview Scheduled','Interview Scheduled':'Offer Extended','Offer Extended':'Selected' };

export default function MyApplications() {
  useScrollReveal();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [expanded, setExpanded] = useState({});
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState('');
  const [hasJoiningLetter, setHasJoiningLetter] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/applications/my'),
      api.get('/internships/my-applications'),
      api.get('/students/profile'),
    ])
      .then(([jobRes, internshipRes, profileRes]) => {
        const jobApps = (jobRes.data.applications || []).map(app => ({ ...app, type: 'Job', item: app.job }));
        const internshipApps = (internshipRes.data.applications || []).map(app => ({
          ...app,
          type: 'Internship',
          item: app.internship,
          job: {
            ...(app.internship || {}),
            jobType: 'Internship',
            salary: app.internship?.stipend?.amount ? { min: app.internship.stipend.amount, max: app.internship.stipend.amount } : undefined,
          },
        }));
        setApps([...jobApps, ...internshipApps].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)));
        setHasJoiningLetter(!!profileRes.data.student?.joiningLetter?.filename);
        setError('');
      })
      .catch(err => {
        setApps([]);
        setError(err.response?.data?.message || 'Unable to load applications');
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = apps.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});
  const filtered = apps.filter(a => (filter === 'All' || a.status === filter) && (typeFilter === 'All' || a.type === typeFilter));

  const handleStatusUpdate = async (appId, nextStatus) => {
    setStatusUpdating(true);
    try {
      const res = await api.put(`/applications/${appId}/status/self`, { status: nextStatus, note: `Changed to ${nextStatus}` });
      setApps(prev => prev.map(app => app._id === appId ? { ...app, ...res.data.application } : app));
      toast.success(`Status updated to ${nextStatus}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update status'); }
    finally { setStatusUpdating(false); }
  };

  const uploadLetter = async (file) => {
    if (!file) return;
    const data = new FormData();
    data.append('joiningLetter', file);
    try {
      await api.post('/students/profile/joining-letter', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setHasJoiningLetter(true);
      toast.success('Letter uploaded! You can now mark the application as Selected.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Letter upload failed');
    }
  };

  const markOutcome = async (app) => {
    try {
      if (app.type === 'Internship') {
        await api.put('/students/profile', {
          internshipStatus: 'Completed',
          internshipCompany: app.job?.company || '',
          internshipDuration: app.job?.duration || '',
          internshipStipend: app.job?.stipend?.amount || 0,
        });
        toast.success('Internship details updated');
      } else {
        await api.put('/students/profile', {
          placementStatus: 'Placed',
          placedAt: app.job?.company || '',
          packageOffered: app.job?.salary?.max || app.job?.salary?.min || 0,
        });
        toast.success('Placement details updated');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--neon-cyan)' }} />
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="scroll-reveal">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--neon-cyan)', letterSpacing: '0.08em' }}>MY APPLICATIONS</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>{apps.length} total applications</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 scroll-reveal delay-100">
        {[
          { l: 'Total',      v: apps.length,                                                                              color: 'var(--neon-blue)' },
          { l: 'Active',     v: apps.filter(a => !['Rejected','Placed','Selected'].includes(a.status)).length,           color: 'var(--neon-orange)' },
          { l: 'Interviews', v: counts['Interview Scheduled'] || 0,                                                       color: 'var(--neon-purple)' },
          { l: 'Offers',     v: (counts['Offer Extended'] || 0) + (counts['Selected'] || 0),                             color: 'var(--neon-green)' },
        ].map(s => (
          <div key={s.l} className="card text-center py-3">
            <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'Orbitron, sans-serif' }}>{s.v}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filters — type + status on one row */}
      <div className="flex gap-2 flex-wrap items-center scroll-reveal delay-200">
        {/* Type pills */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glow)' }}>
          {['All', 'Job', 'Internship'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: typeFilter === t ? 'var(--neon-blue)' : 'transparent',
                color: typeFilter === t ? '#000' : 'var(--text-secondary)',
                fontFamily: 'Rajdhani, sans-serif',
                boxShadow: typeFilter === t ? '0 0 8px rgba(0,212,255,0.4)' : 'none'
              }}>
              {t === 'Job' ? '💼' : t === 'Internship' ? '🎓' : ''} {t}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 self-center" style={{ background: 'var(--border-glow)' }} />

        {/* Status pills */}
        {['All', ...Object.keys(STATUS_CFG)].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
            style={{
              background: filter === s ? 'var(--neon-cyan)' : 'transparent',
              color: filter === s ? '#000' : 'var(--text-secondary)',
              border: `1px solid ${filter === s ? 'var(--neon-cyan)' : 'var(--border-glow)'}`,
              fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em',
              boxShadow: filter === s ? '0 0 8px rgba(0,255,245,0.3)' : 'none'
            }}>
            {s} {s !== 'All' && counts[s] ? `(${counts[s]})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {error || (filter === 'All' ? 'No applications yet. Browse jobs and start applying!' : `No ${filter} applications found.`)}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((app, idx) => {
          const cfg = STATUS_CFG[app.status] || STATUS_CFG['Applied'];
          const Icon = cfg.icon;
          const isExp = expanded[app._id];
          return (
            <div key={app._id} className={`card scroll-reveal delay-${Math.min(idx * 100, 400)}`}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,255,245,0.08)', border: '1px solid rgba(0,255,245,0.2)' }}>
                  <Building2 size={20} style={{ color: 'var(--neon-cyan)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>{app.job?.title}</h3>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{app.job?.company}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="badge badge-not-done text-xs">{app.type}</span>
                      <span className={`badge ${cfg.cls} text-xs flex items-center gap-1`}><Icon size={11} /> {app.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs flex-wrap" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>
                    {app.job?.location && <span className="flex items-center gap-1"><MapPin size={11} />{app.job.location}</span>}
                    {app.job?.jobType && <span className="badge badge-not-done text-xs">{app.job.jobType}</span>}
                    <span className="flex items-center gap-1"><Clock size={11} />Applied {new Date(app.appliedAt).toLocaleDateString('en-IN')}</span>
                  </div>

                  {/* Pipeline */}
                  {app.status !== 'Rejected' && (
                    <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
                      {PIPELINE.map((step, i) => {
                        const done = cfg.step > i;
                        const active = cfg.step === i + 1;
                        return (
                          <div key={step} className="flex items-center flex-shrink-0">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                              style={{
                                background: active ? 'var(--neon-cyan)' : done ? 'var(--neon-green)' : 'transparent',
                                border: `2px solid ${active ? 'var(--neon-cyan)' : done ? 'var(--neon-green)' : 'var(--border-glow)'}`,
                                color: (active || done) ? '#000' : 'var(--text-muted)',
                                boxShadow: active ? '0 0 8px var(--neon-cyan)' : done ? '0 0 8px var(--neon-green)' : 'none',
                                fontSize: '9px'
                              }}>
                              {done ? '✓' : i + 1}
                            </div>
                            {i < PIPELINE.length - 1 && (
                              <div className="w-5 h-0.5 flex-shrink-0" style={{ background: done ? 'var(--neon-green)' : 'var(--border-glow)' }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button onClick={() => setExpanded(p => ({ ...p, [app._id]: !p[app._id] }))}
                  className="flex-shrink-0 mt-1" style={{ color: 'var(--text-muted)' }}>
                  {isExp ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                </button>
              </div>

              {isExp && (
                <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px solid var(--border-glow)' }}>
                  {app.interviewDate && (
                    <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(176,64,255,0.08)', border: '1px solid rgba(176,64,255,0.2)' }}>
                      <p className="font-semibold" style={{ color: 'var(--neon-purple)', fontFamily: 'Rajdhani, sans-serif' }}>📅 Interview Scheduled</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(app.interviewDate).toLocaleDateString('en-IN')}
                        {app.interviewTime && ` at ${app.interviewTime}`}
                        {app.interviewVenue && ` · ${app.interviewVenue}`}
                      </p>
                    </div>
                  )}
                  {app.type === 'Job' && app.status === 'Interview Scheduled' ? (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs font-semibold self-center" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>Interview clear?</span>
                      <button type="button" disabled={statusUpdating}
                        onClick={() => handleStatusUpdate(app._id, 'Offer Extended')}
                        className="btn-primary px-3 py-1 text-xs">
                        Yes
                      </button>
                      <button type="button" disabled={statusUpdating}
                        onClick={() => handleStatusUpdate(app._id, 'Rejected')}
                        className="btn-secondary px-3 py-1 text-xs">
                        No
                      </button>
                    </div>
                  ) : app.type === 'Job' && app.status === 'Offer Extended' ? (
                    /* Offer Extended → Selected requires joining letter */
                    <div className="space-y-2">
                      {hasJoiningLetter ? (
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--neon-green)', fontFamily: 'Rajdhani, sans-serif' }}>
                            ✅ Letter uploaded
                          </span>
                          <button type="button" disabled={statusUpdating}
                            onClick={() => handleStatusUpdate(app._id, 'Selected')}
                            className="btn-primary px-3 py-1 text-xs">
                            {statusUpdating ? 'Updating...' : 'Mark as Selected'}
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(255,140,0,0.07)', border: '1px solid rgba(255,140,0,0.35)' }}>
                          <p className="text-xs font-semibold" style={{ color: 'var(--neon-orange)', fontFamily: 'Rajdhani, sans-serif' }}>
                            📎 Upload your offer / joining letter to mark as Selected
                          </p>
                          <label className="btn-primary px-3 py-1 text-xs flex items-center gap-1 cursor-pointer w-fit"
                            style={{ background: 'var(--neon-orange)', border: 'none' }}>
                            <Upload size={12} /> Upload Letter
                            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => uploadLetter(e.target.files?.[0])} />
                          </label>
                        </div>
                      )}
                    </div>
                  ) : app.type === 'Job' && STATUS_TRANSITION[app.status] && (
                    <button type="button" disabled={statusUpdating}
                      onClick={() => handleStatusUpdate(app._id, STATUS_TRANSITION[app.status])}
                      className="btn-primary px-3 py-1 text-xs">
                      {statusUpdating ? 'Updating...' : `Mark as ${STATUS_TRANSITION[app.status]}`}
                    </button>
                  )}
                  {['Offer Extended', 'Selected', 'Placed'].includes(app.status) && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <button type="button" onClick={() => markOutcome(app)} className="btn-primary px-3 py-1 text-xs">
                        Update {app.type === 'Internship' ? 'Internship' : 'Placement'} Details
                      </button>
                      {/* Show letter upload only if not already uploaded, and not already shown above */}
                      {(app.status !== 'Offer Extended' || hasJoiningLetter) && (
                        <label className="btn-secondary px-3 py-1 text-xs flex items-center gap-1 cursor-pointer">
                          <Upload size={12} /> {hasJoiningLetter ? 'Replace Letter' : 'Upload Letter'}
                          <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => uploadLetter(e.target.files?.[0])} />
                        </label>
                      )}
                    </div>
                  )}
                  {app.statusHistory?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>History</p>
                      <div className="space-y-2">
                        {[...app.statusHistory].reverse().map((h, hi) => (
                          <div key={hi} className="flex items-start gap-3 text-sm">
                            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--neon-blue)' }} />
                            <div>
                              <span className="font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>{h.status}</span>
                              {h.note && <span className="ml-2" style={{ color: 'var(--text-muted)' }}>— {h.note}</span>}
                              <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{new Date(h.changedAt || h.createdAt).toLocaleDateString('en-IN')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {app.job?.salary?.min && <p className="text-sm" style={{ color: 'var(--neon-green)', fontFamily: 'Rajdhani, sans-serif' }}>💰 Salary: ₹{app.job.salary.min}–{app.job.salary.max}K</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
