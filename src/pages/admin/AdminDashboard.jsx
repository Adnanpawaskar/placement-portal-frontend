import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
  Users, Briefcase, FileText, Award, GraduationCap, TrendingUp, BarChart2,
  Building2, ClipboardList, CheckCircle2, XCircle, Clock, Download
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import useScrollReveal from '../../hooks/useScrollReveal';

const NEON_COLORS = ['#00d4ff', '#b040ff', '#00ff88', '#ff8c00', '#ff2d9a', '#00fff5'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glow)', borderRadius: 8, padding: '8px 14px', color: 'var(--text-primary)', fontSize: 13 }}>
        <p style={{ color: 'var(--neon-blue)', marginBottom: 4, fontWeight: 700 }}>{label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
      </div>
    );
  }
  return null;
};

function downloadBlob(content, filename) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function buildOverallReportCsv({ stats, placementReport, appReport, placementByCourse, applicationStats }) {
  const lines = [];
  const addSection = (title, rows) => {
    if (lines.length) lines.push('');
    lines.push(csvCell(title));
    rows.forEach(row => lines.push(row.map(csvCell).join(',')));
  };

  addSection('Overall Summary', [
    ['Metric', 'Value'],
    ['Total Students', stats.totalStudents ?? placementReport?.total ?? 0],
    ['Placed Students', stats.placedStudents ?? placementReport?.placed ?? 0],
    ['Placement Rate', `${stats.placementRate ?? placementReport?.placementRate ?? 0}%`],
    ['Open Jobs', stats.openJobs ?? 0],
    ['Total Jobs', stats.totalJobs ?? 0],
    ['Total Internships', stats.totalInternships ?? 0],
    ['Total Applications', stats.totalApplications ?? appReport?.total ?? 0],
    ['Average Package', placementReport?.avgPackage ? `INR ${placementReport.avgPackage}L` : ''],
    ['Maximum Package', placementReport?.maxPackage ? `INR ${placementReport.maxPackage}L` : ''],
  ]);

  addSection('Course Wise Placement', [
    ['Course', 'Total', 'Placed', 'Unplaced', 'Rate'],
    ...(placementReport?.courseWise || placementByCourse || []).map(c => [
      c.course || c._id,
      c.total,
      c.placed,
      c.unplaced ?? ((c.total || 0) - (c.placed || 0)),
      `${c.rate ?? (c.total ? (((c.placed || 0) / c.total) * 100).toFixed(1) : 0)}%`,
    ]),
  ]);

  addSection('Top Companies', [
    ['Company', 'Placed Students'],
    ...(placementReport?.topCompanies || []).map(c => [c.company, c.count]),
  ]);

  addSection('Application Status', [
    ['Status', 'Count'],
    ...(appReport?.statusCounts || applicationStats || []).map(s => [s._id, s.count]),
  ]);

  addSection('Placed Students', [
    ['Name', 'Email', 'Course', 'CGPA', 'Company', 'Package'],
    ...(placementReport?.placedStudents || []).map(s => [
      s.name,
      s.email,
      s.course,
      s.cgpa,
      s.company,
      s.package ? `INR ${s.package}L` : '',
    ]),
  ]);

  return lines.join('\n');
}

export default function AdminDashboard() {
  useScrollReveal();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placementReport, setPlacementReport] = useState(null);
  const [appReport, setAppReport] = useState(null);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard').catch(() => ({ data: null })),
      api.get('/reports/placement').catch(() => ({ data: { report: null } })),
      api.get('/reports/applications').catch(() => ({ data: null })),
    ]).then(([d, r, ar]) => {
      if (d.data) setData(d.data);
      setPlacementReport(r.data?.report || null);
      setAppReport(ar.data || null);
    }).finally(() => setLoading(false));
  }, []);

  const handleExport = async (type) => {
    setExporting(type);
    if (type === 'overall') {
      try {
        const csv = buildOverallReportCsv({ stats, placementReport, appReport, placementByCourse, applicationStats });
        downloadBlob(csv, `overall_report_${new Date().toISOString().slice(0, 10)}.csv`);
      } catch { alert('Export failed.'); }
      finally { setExporting(''); }
      return;
    }

    const map = {
      placed:       ['/reports/export/placed',       'placed_students.csv'],
      allStudents:  ['/reports/export/all-students', 'all_students.csv'],
      applications: ['/reports/export/applications', 'all_applications.csv'],
    };
    const [url, filename] = map[type];
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const text = await res.data.text();
      downloadBlob(text, filename);
    } catch { alert('Export failed.'); }
    finally { setExporting(''); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--neon-blue)' }} />
    </div>
  );

  const safeData = data || {
    stats: { totalStudents: 0, placedStudents: 0, placementRate: 0, openJobs: 0, totalApplications: 0, totalInternships: 0, openInternships: 0 },
    recentApplications: [], recentJobs: [], applicationStats: [], placementByCourse: [], avgCGPAByCourse: [], internshipStats: []
  };

  const { stats, recentApplications, recentJobs, applicationStats, placementByCourse, avgCGPAByCourse, internshipStats } = safeData;

  const overallAvgCGPA = avgCGPAByCourse?.length
    ? (avgCGPAByCourse.reduce((sum, c) => sum + (c.avgCGPA * c.count), 0) / avgCGPAByCourse.reduce((sum, c) => sum + c.count, 0)).toFixed(2)
    : '—';
  const placedAvgCGPA = placementReport?.placedStudents?.filter(s => s.cgpa).length
    ? (placementReport.placedStudents.filter(s => s.cgpa).reduce((a, s) => a + Number(s.cgpa), 0) / placementReport.placedStudents.filter(s => s.cgpa).length).toFixed(2)
    : '—';

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'var(--neon-blue)', link: '/admin/students' },
    { label: 'Placed', value: `${stats.placedStudents} (${stats.placementRate}%)`, icon: Award, color: 'var(--neon-green)' },
    { label: 'Open Jobs', value: stats.openJobs, icon: Briefcase, color: 'var(--neon-purple)', link: '/admin/jobs' },
    { label: 'Internships', value: stats.openInternships ?? stats.totalInternships ?? 0, icon: GraduationCap, color: 'var(--neon-orange)', link: '/admin/internships' },
    { label: 'Applications', value: stats.totalApplications, icon: FileText, color: 'var(--neon-cyan)', link: '/admin/applications' },
  ];

  // Build internship status chart data
  const internshipChartData = (internshipStats || []).map(s => ({ name: s._id || 'Unknown', value: s.count }));

  // Top companies from placementReport
  const topCompanies = placementReport?.topCompanies?.slice(0, 6) || [];

  // courseWise data
  const courseWise = placementReport?.courseWise || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <h1 className="text-xl font-bold scroll-reveal" style={{ color: 'var(--neon-blue)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
        ADMIN DASHBOARD
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, link }, idx) => (
          <Link key={label} to={link || '#'}
            className={`card scroll-reveal delay-${idx * 100}`}
            style={{ textDecoration: 'none', cursor: link ? 'pointer' : 'default' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>{label}</div>
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Orbitron, sans-serif' }}>{value}</div>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: `${color}15`, border: `1px solid ${color}40`, boxShadow: `0 0 15px ${color}30` }}>
                <Icon size={20} style={{ color }} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* CGPA & Rate Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 scroll-reveal delay-200">
        {[
          { label: 'Avg CGPA (All)', val: overallAvgCGPA, icon: TrendingUp, color: 'var(--neon-blue)' },
          { label: 'Avg CGPA (Placed)', val: placedAvgCGPA, icon: Briefcase, color: 'var(--neon-purple)' },
          { label: 'Placement Rate', val: `${stats.placementRate}%`, icon: Award, color: 'var(--neon-green)' },
        ].map(b => (
          <div key={b.label} className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${b.color}15`, border: `1px solid ${b.color}40`, boxShadow: `0 0 20px ${b.color}25` }}>
              <b.icon size={22} style={{ color: b.color }} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>{b.label}</p>
              <p className="text-2xl font-bold" style={{ color: b.color, fontFamily: 'Orbitron, sans-serif' }}>{b.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── FULL REPORTS SECTION ─── */}
      <div className="card scroll-reveal" style={{ border: '1px solid rgba(0,212,255,0.2)' }}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-sm font-bold" style={{ color: 'var(--neon-blue)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
            OVERALL REPORTS
          </h2>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'overall', label: 'Overall Report', color: 'var(--neon-orange)' },
              { key: 'placed', label: 'Placed Students', color: 'var(--neon-green)' },
              { key: 'allStudents', label: 'All Students', color: 'var(--neon-blue)' },
              { key: 'applications', label: 'Applications', color: 'var(--neon-purple)' },
            ].map(({ key, label, color }) => (
              <button key={key} onClick={() => handleExport(key)} disabled={!!exporting}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: `${color}15`, border: `1px solid ${color}40`, color, opacity: exporting === key ? 0.6 : 1 }}>
                <Download size={12} />
                {exporting === key ? 'Exporting...' : label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary numbers */}
        {placementReport && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Students', val: placementReport.total, icon: Users, color: 'var(--neon-blue)' },
              { label: 'Placed', val: placementReport.placed, icon: CheckCircle2, color: 'var(--neon-green)' },
              { label: 'In Process', val: placementReport.inProcess, icon: Clock, color: 'var(--neon-orange)' },
              { label: 'Not Placed', val: placementReport.unplaced, icon: XCircle, color: 'var(--neon-pink)' },
              { label: 'Avg Package', val: `₹${placementReport.avgPackage}L`, icon: TrendingUp, color: 'var(--neon-purple)' },
              { label: 'Max Package', val: `₹${placementReport.maxPackage}L`, icon: Award, color: 'var(--neon-cyan)' },
              { label: 'Total Jobs', val: stats.totalJobs ?? '—', icon: Briefcase, color: 'var(--neon-blue)' },
              { label: 'Total Internships', val: stats.totalInternships ?? '—', icon: GraduationCap, color: 'var(--neon-orange)' },
            ].map(({ label, val, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
                <Icon size={18} style={{ color, flexShrink: 0 }} />
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
                  <div className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Orbitron, sans-serif' }}>{val}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Placement by Course */}
          <div>
            <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--neon-blue)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>PLACEMENT BY COURSE</h3>
            {placementByCourse?.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={placementByCourse} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="_id" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="placed" name="Placed" fill="#00ff88" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" name="Total" fill="#00d4ff" opacity={0.4} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-44" style={{ color: 'var(--text-muted)' }}>
                <div className="text-center"><BarChart2 size={28} className="mx-auto mb-2 opacity-30" /><p className="text-xs">No data yet</p></div>
              </div>
            )}
          </div>

          {/* Application Status Pie */}
          <div>
            <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--neon-purple)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>APPLICATION STATUS</h3>
            {applicationStats?.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={applicationStats} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={70} strokeWidth={0}>
                    {applicationStats.map((_, i) => <Cell key={i} fill={NEON_COLORS[i % NEON_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontFamily: 'sans-serif', fontSize: 11, color: 'var(--text-muted)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-44" style={{ color: 'var(--text-muted)' }}>
                <div className="text-center"><Award size={28} className="mx-auto mb-2 opacity-30" /><p className="text-xs">No applications yet</p></div>
              </div>
            )}
          </div>

          {/* Internship Status */}
          <div>
            <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--neon-orange)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>INTERNSHIP STATUS (STUDENTS)</h3>
            {internshipChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={internshipChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Students" radius={[4, 4, 0, 0]}>
                    {internshipChartData.map((_, i) => <Cell key={i} fill={NEON_COLORS[i % NEON_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-44" style={{ color: 'var(--text-muted)' }}>
                <div className="text-center"><GraduationCap size={28} className="mx-auto mb-2 opacity-30" /><p className="text-xs">No internship data</p></div>
              </div>
            )}
          </div>

          {/* Course-wise placement rate */}
          <div>
            <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--neon-green)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>COURSE-WISE PLACEMENT RATE</h3>
            {courseWise.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={courseWise} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="course" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rate" name="Rate %" fill="#00ff88" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-44" style={{ color: 'var(--text-muted)' }}>
                <div className="text-center"><BarChart2 size={28} className="mx-auto mb-2 opacity-30" /><p className="text-xs">No course data</p></div>
              </div>
            )}
          </div>
        </div>

        {/* Top Hiring Companies */}
        {topCompanies.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--neon-cyan)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>TOP HIRING COMPANIES</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {topCompanies.map((c, i) => (
                <div key={c.company} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid var(--border-glow)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: `${NEON_COLORS[i % NEON_COLORS.length]}20`, color: NEON_COLORS[i % NEON_COLORS.length] }}>
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{c.company}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.count} placed</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course-wise table */}
        {courseWise.length > 0 && (
          <div>
            <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--neon-blue)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>COURSE-WISE SUMMARY</h3>
            <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-glow)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(0,212,255,0.05)', borderBottom: '1px solid var(--border-glow)' }}>
                    {['Course', 'Total', 'Placed', 'Unplaced', 'Rate'].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courseWise.map((c, i) => (
                    <tr key={c.course} style={{ borderBottom: i < courseWise.length - 1 ? '1px solid var(--border-glow)' : 'none' }}>
                      <td className="px-4 py-2 font-semibold" style={{ color: 'var(--text-primary)' }}>{c.course}</td>
                      <td className="px-4 py-2" style={{ color: 'var(--text-secondary)' }}>{c.total}</td>
                      <td className="px-4 py-2 font-semibold" style={{ color: 'var(--neon-green)' }}>{c.placed}</td>
                      <td className="px-4 py-2" style={{ color: 'var(--neon-pink)' }}>{c.total - c.placed}</td>
                      <td className="px-4 py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: 'rgba(0,255,136,0.12)', color: 'var(--neon-green)', border: '1px solid rgba(0,255,136,0.3)' }}>
                          {c.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card scroll-reveal-left">
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--neon-blue)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>PLACEMENT BY COURSE</h3>
          {placementByCourse?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={placementByCourse} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis dataKey="_id" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="placed" name="Placed" fill="#00ff88" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" name="Total" fill="#00d4ff" opacity={0.4} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-2" style={{ color: 'var(--text-muted)' }}>
              <BarChart2 size={32} style={{ opacity: 0.3 }} />
              <p className="text-xs" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.06em' }}>No placement data yet</p>
            </div>
          )}
        </div>
        <div className="card scroll-reveal-right">
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--neon-purple)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>APPLICATION STATUS</h3>
          {applicationStats?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={applicationStats} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={75} strokeWidth={0}>
                  {applicationStats.map((_, i) => <Cell key={i} fill={NEON_COLORS[i % NEON_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontFamily: 'sans-serif', fontSize: 12, color: 'var(--text-muted)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-2" style={{ color: 'var(--text-muted)' }}>
              <Award size={32} style={{ opacity: 0.3 }} />
              <p className="text-xs" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.06em' }}>No applications yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="card scroll-reveal">
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--neon-orange)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>RECENT JOB POSTINGS</h3>
        {recentJobs?.length > 0 ? (
          <div className="space-y-2">
            {recentJobs.slice(0, 5).map((j, i) => (
              <div key={j._id} className={`flex items-center justify-between py-2 px-3 rounded-lg scroll-reveal delay-${i * 100}`}
                style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(30,58,95,0.5)' }}>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>{j.title}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{j.company} · {j.location}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }}>
                  {j.applicantsCount || 0} applied
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
            <Briefcase size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs" style={{ fontFamily: 'Rajdhani, sans-serif' }}>No jobs posted yet</p>
          </div>
        )}
      </div>

      {/* Recent Applications */}
      <div className="card scroll-reveal delay-100">
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--neon-purple)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>RECENT APPLICATIONS</h3>
        {recentApplications?.length > 0 ? (
          <div className="space-y-2">
            {recentApplications.slice(0, 5).map((a, i) => (
              <div key={a._id} className={`flex items-center justify-between py-2 px-3 rounded-lg scroll-reveal delay-${i * 100}`}
                style={{ background: 'rgba(176,64,255,0.03)', border: '1px solid rgba(30,58,95,0.5)' }}>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>{a.student?.user?.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.job?.title} @ {a.job?.company}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(176,64,255,0.1)', color: '#b040ff', border: '1px solid rgba(176,64,255,0.3)' }}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
            <FileText size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs" style={{ fontFamily: 'Rajdhani, sans-serif' }}>No applications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
