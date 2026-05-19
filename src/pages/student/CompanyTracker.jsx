import useScrollReveal from '../../hooks/useScrollReveal';
import { useState, useEffect } from 'react';
import { Building2, Star, Search, Briefcase, GraduationCap, MapPin, Clock, ChevronRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

// Static company insights (tips, interview info)
const COMPANY_INFO = {
  'TCS':          { sector: 'IT Services', type: 'Service', tier: 'Mass Recruiter', pkg: '3.5–7',  rating: 4,   campusFreq: 'Every Year',   rounds: 'Written → TR → HR', tips: 'Focus on aptitude (TCS NQT). Strong basics in Java and SQL. Verbal ability matters.' },
  'Infosys':      { sector: 'IT Services', type: 'Service', tier: 'Mass Recruiter', pkg: '3.6–8',  rating: 4,   campusFreq: 'Every Year',   rounds: 'Online Test → TR → HR', tips: 'InfyTQ certification boosts chances. Practice HackerRank problems.' },
  'Wipro':        { sector: 'IT Services', type: 'Service', tier: 'Mass Recruiter', pkg: '3.5–6.5',rating: 3.5, campusFreq: 'Every Year',   rounds: 'NLTH → TR → HR', tips: 'Wipro Elite NLTH is the key exam. Practice previous Wipro papers.' },
  'Cognizant':    { sector: 'IT Services', type: 'Service', tier: 'Mass Recruiter', pkg: '4–7',    rating: 3.5, campusFreq: 'Every Year',   rounds: 'GenC Test → TR → HR', tips: 'Brush up on OOPS and DBMS for GenC Elevate track.' },
  'Accenture':    { sector: 'IT Consulting',type: 'Service',tier: 'Mass Recruiter', pkg: '4.5–8',  rating: 4,   campusFreq: 'Every Year',   rounds: 'Cognitive + Tech → TR → HR', tips: 'Communication skills tested heavily. Mock GDs help.' },
  'Amazon':       { sector: 'E-Commerce/Cloud',type: 'Product',tier: 'Dream',      pkg: '18–40',  rating: 5,   campusFreq: 'Selective',    rounds: 'OA → 4–5 Interviews (LP + Technical)', tips: 'Master DSA on LeetCode. Leadership Principles are critical. STAR format.' },
  'Microsoft':    { sector: 'Software/Cloud',type: 'Product', tier: 'Dream',       pkg: '20–45',  rating: 5,   campusFreq: 'Selective',    rounds: 'Coding Test → 3–4 PI Rounds', tips: 'Focus on trees, graphs and DP. Be collaborative and clear.' },
  'Google':       { sector: 'Technology',  type: 'Product',  tier: 'Super Dream',  pkg: '30–60',  rating: 5,   campusFreq: 'Rare/Off-campus', rounds: 'Online Round → 4–5 Google Interviews', tips: 'Top-tier DSA is mandatory. Practice Google Kickstart.' },
  'Deloitte':     { sector: 'Consulting',  type: 'Consulting',tier: 'Good Package',pkg: '6–12',   rating: 4,   campusFreq: 'Most Years',   rounds: 'Aptitude → GD → Case Interview → HR', tips: 'Case study prep is crucial. Strong business communication.' },
  'Goldman Sachs':{ sector: 'Finance/Tech',type: 'Finance',   tier: 'Super Dream', pkg: '20–50',  rating: 5,   campusFreq: 'Selective',    rounds: 'HackerRank OA → 3–4 Technical Rounds', tips: 'Coding + finance fundamentals. Strong math/stats is a plus.' },
  'Capgemini':    { sector: 'IT Services', type: 'Service',   tier: 'Mass Recruiter',pkg: '3.8–6', rating: 3.5, campusFreq: 'Every Year',   rounds: 'Game-based Assessment → TR → HR', tips: 'Practice logical puzzles and pseudo-code tests.' },
  'L&T Technology':{ sector: 'Engineering',type: 'Core',      tier: 'Good Package',pkg: '5–10',   rating: 4,   campusFreq: 'Most Years',   rounds: 'Written → GD → TR → HR', tips: 'Strong core domain knowledge needed. Projects stand out.' },
};

const TIERS = ['All', 'Mass Recruiter', 'Good Package', 'Dream', 'Super Dream'];
const TYPES = ['All', 'Service', 'Product', 'Consulting', 'Finance', 'Core'];
const VIEWS = ['Live Drives', 'Company Insights'];

const tierColor = { 'Mass Recruiter': '#00d4ff', 'Good Package': '#00ff88', 'Dream': '#b040ff', 'Super Dream': '#ff8c00' };
const tierBg   = { 'Mass Recruiter': 'rgba(0,212,255,0.1)', 'Good Package': 'rgba(0,255,136,0.1)', 'Dream': 'rgba(176,64,255,0.1)', 'Super Dream': 'rgba(255,140,0,0.1)' };
const tierBorder={ 'Mass Recruiter': 'rgba(0,212,255,0.3)', 'Good Package': 'rgba(0,255,136,0.3)', 'Dream': 'rgba(176,64,255,0.3)', 'Super Dream': 'rgba(255,140,0,0.3)' };

export default function CompanyTracker() {
  useScrollReveal();
  const [activeView, setActiveView] = useState('Live Drives');
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('All');
  const [type, setType] = useState('All');
  const [selected, setSelected] = useState(null);

  // Live drives state
  const [liveJobs, setLiveJobs] = useState([]);
  const [liveInternships, setLiveInternships] = useState([]);
  const [loadingLive, setLoadingLive] = useState(true);
  const [driveTab, setDriveTab] = useState('Jobs');
  const [studentCourse, setStudentCourse] = useState('');

  // Load student profile
  useEffect(() => {
    api.get('/students/profile')
      .then(res => setStudentCourse(res.data.student?.course || ''))
      .catch(() => {});
  }, []);

  // Fetch live open jobs + internships for this student (backend filters by course automatically)
  useEffect(() => {
    if (activeView !== 'Live Drives') return;
    setLoadingLive(true);
    Promise.all([
      api.get('/jobs?status=Open&postType=Job&limit=50'),
      api.get('/internships?status=Open&limit=50')
    ])
      .then(([jobsRes, internsRes]) => {
        setLiveJobs(jobsRes.data.jobs || []);
        setLiveInternships(internsRes.data.internships || []);
      })
      .catch(() => {})
      .finally(() => setLoadingLive(false));
  }, [activeView]);

  // Company Insights filtering
  const allCompanies = Object.entries(COMPANY_INFO).map(([name, info]) => ({ name, ...info }));
  const filteredCompanies = allCompanies.filter(c => {
    const q = search.toLowerCase();
    return (!q || c.name.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q))
      && (tier === 'All' || c.tier === tier)
      && (type === 'All' || c.type === type);
  });

  // Group live postings by company
  const groupByCompany = (items) => {
    const map = {};
    items.forEach(item => {
      const co = item.company;
      if (!map[co]) map[co] = [];
      map[co].push(item);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  };

  const liveItems = driveTab === 'Jobs' ? liveJobs : liveInternships;
  const grouped = groupByCompany(liveItems);
  const filteredGrouped = search
    ? grouped.filter(([co]) => co.toLowerCase().includes(search.toLowerCase()))
    : grouped;

  const isDeadlineSoon = (date) => {
    const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    return diff <= 3 && diff > 0;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="scroll-reveal">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Building2 className="text-[var(--neon-blue)]" size={24} />Company Tracker
        </h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">
          {studentCourse
            ? <>Live drives for <span style={{ color: 'var(--neon-cyan)' }}>{studentCourse}</span> · company insights &amp; interview tips</>
            : 'Live campus drives · company insights & interview tips'}
        </p>
      </div>

      {/* View toggle + search on one row */}
      <div className="flex items-center gap-3 flex-wrap scroll-reveal delay-50">
        <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-xl p-1 border border-[var(--border-glow)]">
          {VIEWS.map(v => (
            <button key={v} onClick={() => setActiveView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeView === v ? 'bg-transparent text-[var(--neon-blue)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
              {v === 'Live Drives' ? '🔴 ' : '📊 '}{v}
            </button>
        ))}
        </div>

        {/* Shared search bar */}
        <div className="relative flex-1 min-w-40 max-w-xs">
          <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
          <input className="input pl-9 py-2 text-sm" placeholder={activeView === 'Live Drives' ? 'Search company...' : 'Search company or sector...'} value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Jobs / Internships mini-toggle — only for Live Drives */}
        {activeView === 'Live Drives' && (
          <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-xl p-1 border border-[var(--border-glow)]">
            {['Jobs', 'Internships'].map(t => (
              <button key={t} onClick={() => setDriveTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${driveTab === t ? 'text-[var(--neon-blue)]' : 'text-[var(--text-muted)]'}`}>
                {t === 'Jobs' ? '💼' : '🎓'} {t}
              </button>
            ))}
          </div>
        )}

        {activeView === 'Live Drives' && (
          <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {liveItems.length} open {driveTab.toLowerCase()}
          </span>
        )}
      </div>

      {activeView === 'Live Drives' && (
        <div className="space-y-5 scroll-reveal">
          {loadingLive ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--neon-blue)' }} />
            </div>
          ) : filteredGrouped.length === 0 ? (
            <div className="card text-center py-16 text-[var(--text-muted)]">
              <Building2 size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg">No active {driveTab.toLowerCase()} for your course</p>
              <p className="text-sm mt-1">New drives will appear here as they're posted</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGrouped.map(([company, items]) => (
                <div key={company} className="card border border-[var(--border-glow)]">
                  {/* Company header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                        style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,212,255,0.2)' }}>
                        {company.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-[var(--text-primary)]">{company}</h3>
                        <p className="text-xs text-[var(--text-muted)]">{items.length} active {driveTab === 'Jobs' ? 'position' : 'internship'}{items.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {COMPANY_INFO[company] && (
                      <span className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ color: tierColor[COMPANY_INFO[company].tier] || 'var(--text-secondary)', background: tierBg[COMPANY_INFO[company].tier] || 'transparent', border: `1px solid ${tierBorder[COMPANY_INFO[company].tier] || 'var(--border-glow)'}` }}>
                        {COMPANY_INFO[company].tier}
                      </span>
                    )}
                  </div>

                  {/* Postings list */}
                  <div className="space-y-2">
                    {items.map(item => (
                      <Link
                        key={item._id}
                        to={driveTab === 'Jobs' ? `/student/jobs/${item._id}` : `/student/internships/${item._id}`}
                        className="flex items-center justify-between p-3 rounded-xl group transition-all"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glow)', textDecoration: 'none' }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-[var(--text-primary)] truncate">{item.title}</span>
                            {isDeadlineSoon(item.applicationDeadline) && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                                style={{ background: 'rgba(255,45,154,0.15)', color: 'var(--neon-pink)', border: '1px solid rgba(255,45,154,0.3)' }}>
                                Closing Soon
                              </span>
                            )}
                            {item.isPPO && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                                style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--neon-green)', border: '1px solid rgba(0,255,136,0.3)' }}>
                                PPO
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1"><MapPin size={10} />{item.location}</span>
                            {driveTab === 'Jobs' && item.salary?.min > 0 && (
                              <span>₹{item.salary.min}–{item.salary.max || '?'} LPA</span>
                            )}
                            {driveTab === 'Internships' && item.stipend?.amount > 0 && (
                              <span>₹{item.stipend.amount.toLocaleString()}/mo · {item.duration}</span>
                            )}
                            <span className="flex items-center gap-1"><Clock size={10} />Due {new Date(item.applicationDeadline).toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>
                        <ChevronRight size={15} className="flex-shrink-0 ml-3 text-[var(--text-muted)] group-hover:text-[var(--neon-blue)] transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── COMPANY INSIGHTS VIEW ─── */}
      {activeView === 'Company Insights' && (
        <div className="space-y-5 scroll-reveal">
          <div className="flex flex-wrap gap-3">
            <select className="input py-2 text-sm w-auto" value={tier} onChange={e => setTier(e.target.value)}>
              {TIERS.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="input py-2 text-sm w-auto" value={type} onChange={e => setType(e.target.value)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCompanies.map(c => {
              // Count live postings for this company
              const liveJobCount = liveJobs.filter(j => j.company === c.name).length;
              const liveInternCount = liveInternships.filter(i => i.company === c.name).length;
              const hasLive = liveJobCount + liveInternCount > 0;

              return (
                <div key={c.name} className="card hover:shadow-md transition-all cursor-pointer border border-[var(--border-glow)] hover:border-blue-200 relative" onClick={() => setSelected(c)}>
                  {hasLive && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--neon-green)', border: '1px solid rgba(0,255,136,0.3)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" /> Live Drive
                    </span>
                  )}
                  <div className="flex items-start justify-between mb-3 pr-20">
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)] text-lg">{c.name}</h3>
                      <p className="text-[var(--text-muted)] text-xs mt-0.5">{c.sector}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-medium absolute top-10 right-3"
                      style={{ color: tierColor[c.tier] || 'var(--text-secondary)', background: tierBg[c.tier] || 'transparent', border: `1px solid ${tierBorder[c.tier] || 'var(--border-glow)'}` }}>
                      {c.tier}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => <Star key={i} size={13} className={i < Math.floor(c.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'} />)}
                    <span className="text-xs text-[var(--text-muted)] ml-1">{c.rating}/5</span>
                  </div>
                  <div className="flex gap-2 flex-wrap text-xs mb-3">
                    <span className="badge-not-done px-2 py-1 rounded">💰 ₹{c.pkg} LPA</span>
                    <span className="badge-not-done px-2 py-1 rounded">📅 {c.campusFreq}</span>
                    {liveJobCount > 0 && <span className="px-2 py-1 rounded text-[var(--neon-blue)]" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>💼 {liveJobCount} job{liveJobCount > 1 ? 's' : ''}</span>}
                    {liveInternCount > 0 && <span className="px-2 py-1 rounded text-[var(--neon-purple)]" style={{ background: 'rgba(176,64,255,0.1)', border: '1px solid rgba(176,64,255,0.2)' }}>🎓 {liveInternCount} intern{liveInternCount > 1 ? 's' : ''}</span>}
                  </div>
                  <p className="text-[var(--neon-blue)] text-xs mt-3 font-medium">View details →</p>
                </div>
              );
            })}
          </div>

          {/* Detail Modal */}
          {selected && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
              <div style={{ background: '#0d1e35', border: '1px solid #1e3a5f', boxShadow: '0 0 60px rgba(0,212,255,0.15)' }}
                className="rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{selected.name}</h2>
                      <p style={{ color: 'var(--text-muted)' }}>{selected.sector} · {selected.type}</p>
                    </div>
                    <button onClick={() => setSelected(null)} style={{ color: 'var(--text-muted)', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
                  </div>

                  {/* Live drives for this company */}
                  {(() => {
                    const coJobs = liveJobs.filter(j => j.company === selected.name);
                    const coInterns = liveInternships.filter(i => i.company === selected.name);
                    if (coJobs.length + coInterns.length === 0) return null;
                    return (
                      <div className="mb-5 p-3 rounded-xl" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}>
                        <h4 className="font-semibold text-sm mb-2 text-[var(--neon-green)]">🔴 Active Drives for Your Course</h4>
                        <div className="space-y-1.5">
                          {coJobs.map(j => (
                            <Link key={j._id} to={`/student/jobs/${j._id}`} onClick={() => setSelected(null)}
                              className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-white/5 transition-colors"
                              style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                              <span className="flex items-center gap-2"><Briefcase size={11} className="text-[var(--neon-blue)]" />{j.title} · {j.location}</span>
                              <ChevronRight size={12} className="text-[var(--neon-blue)]" />
                            </Link>
                          ))}
                          {coInterns.map(i => (
                            <Link key={i._id} to={`/student/internships/${i._id}`} onClick={() => setSelected(null)}
                              className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-white/5 transition-colors"
                              style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                              <span className="flex items-center gap-2"><GraduationCap size={11} className="text-[var(--neon-purple)]" />{i.title} · {i.duration}</span>
                              <ChevronRight size={12} className="text-[var(--neon-purple)]" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[['💰 Package', `₹${selected.pkg} LPA`], ['📊 Tier', selected.tier], ['📅 Campus Visit', selected.campusFreq], ['🎯 Type', selected.type]].map(([l, v]) => (
                      <div key={l} style={{ background: '#0a1628', border: '1px solid #1e3a5f' }} className="rounded-lg p-3">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{l}</p>
                        <p className="font-semibold text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>📋 Interview Rounds</h4>
                      <p style={{ color: 'var(--text-secondary)', background: '#0a1628', border: '1px solid #1e3a5f' }} className="text-sm p-3 rounded-lg">{selected.rounds}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>💡 Insider Tips</h4>
                      <p style={{ color: '#7aa3c8', background: 'rgba(255,140,0,0.08)', borderLeft: '4px solid #ff8c00' }} className="text-sm p-3 rounded-lg">{selected.tips}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
