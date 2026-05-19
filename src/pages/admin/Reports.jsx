import useScrollReveal from '../../hooks/useScrollReveal';
import { useEffect, useState } from 'react';
import api from '../../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { TrendingUp, Award, Users, Download, FileSpreadsheet, BookOpen, ClipboardList } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];
const COURSES = ['', 'B.Tech', 'M.Tech', 'BCA', 'MCA', 'BBA', 'MBA', 'B.Sc', 'M.Sc'];
const TONE = {
  blue: { main: '#00d4ff', bg: 'rgba(0,212,255,0.08)', soft: 'rgba(0,212,255,0.15)', border: 'rgba(0,212,255,0.35)' },
  green: { main: '#00ff88', bg: 'rgba(0,255,136,0.08)', soft: 'rgba(0,255,136,0.15)', border: 'rgba(0,255,136,0.35)' },
  purple: { main: '#b040ff', bg: 'rgba(176,64,255,0.08)', soft: 'rgba(176,64,255,0.15)', border: 'rgba(176,64,255,0.35)' },
  orange: { main: '#ff8c00', bg: 'rgba(255,140,0,0.08)', soft: 'rgba(255,140,0,0.15)', border: 'rgba(255,140,0,0.35)' },
};

// ── Helper: download a blob as file ──────────────────────────────────────────
function downloadBlob(content, filename, mime = 'text/csv') {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: mime + ';charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Fetch CSV directly from backend (server-side export) ─────────────────────
async function fetchAndDownload(url, filename) {
  try {
    const token = localStorage.getItem('token');
    const res = await api.get(url, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    const text = await res.data.text();
    downloadBlob(text, filename);
  } catch (err) {
    console.error(err);
    alert('Export failed. Please try again.');
  }
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function buildOverallReportCsv(placementReport, appReport) {
  const lines = [];
  const addSection = (title, rows) => {
    if (lines.length) lines.push('');
    lines.push(csvCell(title));
    rows.forEach(row => lines.push(row.map(csvCell).join(',')));
  };

  addSection('Overall Summary', [
    ['Metric', 'Value'],
    ['Total Students', placementReport?.total ?? 0],
    ['Placed Students', placementReport?.placed ?? 0],
    ['In Process', placementReport?.inProcess ?? 0],
    ['Not Placed', placementReport?.unplaced ?? 0],
    ['Placement Rate', `${placementReport?.placementRate ?? 0}%`],
    ['Average Package', placementReport?.avgPackage ? `INR ${placementReport.avgPackage}L` : ''],
    ['Maximum Package', placementReport?.maxPackage ? `INR ${placementReport.maxPackage}L` : ''],
  ]);

  addSection('Course Wise Placement', [
    ['Course', 'Total', 'Placed', 'Unplaced', 'Rate'],
    ...(placementReport?.courseWise || []).map(c => [c.course, c.total, c.placed, c.total - c.placed, `${c.rate}%`]),
  ]);

  addSection('Top Companies', [
    ['Company', 'Placed Students'],
    ...(placementReport?.topCompanies || []).map(c => [c.company, c.count]),
  ]);

  addSection('Application Status', [
    ['Status', 'Count'],
    ...(appReport?.statusCounts || []).map(s => [s._id, s.count]),
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

export default function Reports() {
  const [placementReport, setPlacementReport] = useState(null);
  const [appReport, setAppReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState('');
  const [exporting, setExporting] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = courseFilter ? `?course=${courseFilter}` : '';
      const [pr, ar] = await Promise.all([
        api.get(`/reports/placement${params}`),
        api.get('/reports/applications')
      ]);
      setPlacementReport(pr.data.report);
      setAppReport(ar.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, [courseFilter]);

  const handleExport = async (type) => {
    setExporting(type);
    if (type === 'overall') {
      const csv = buildOverallReportCsv(placementReport, appReport);
      downloadBlob(csv, `overall_report${courseFilter ? '_' + courseFilter : ''}.csv`);
      setExporting('');
      return;
    }

    const course = courseFilter ? `?course=${courseFilter}` : '';
    const map = {
      placed:       [`/reports/export/placed${course}`,       `placed_students${courseFilter ? '_' + courseFilter : ''}.csv`],
      allStudents:  [`/reports/export/all-students${course}`, `all_students${courseFilter ? '_' + courseFilter : ''}.csv`],
      applications: [`/reports/export/applications`,          'all_applications.csv'],
    };
    const [url, filename] = map[type];
    await fetchAndDownload(url, filename);
    setExporting('');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--neon-blue)]" />
    </div>
  );

  const statCards = placementReport ? [
    { label: 'Total Students', value: placementReport.total, icon: Users, color: 'blue', sub: `${placementReport.unplaced} unplaced` },
    { label: 'Placed', value: placementReport.placed, icon: Award, color: 'green', sub: `${placementReport.inProcess} in process` },
    { label: 'Placement Rate', value: `${placementReport.placementRate}%`, icon: TrendingUp, color: 'purple', sub: 'of all students' },
    { label: 'Avg Package', value: `₹${placementReport.avgPackage}L`, icon: Award, color: 'orange', sub: `Max ₹${placementReport.maxPackage}L` },
  ] : [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports & Analytics</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Placement statistics and downloadable exports</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="input w-40 py-2 text-sm" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
            {COURSES.map(c => <option key={c} value={c}>{c || 'All Courses'}</option>)}
          </select>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { key: 'overall', icon: FileSpreadsheet, label: 'Export Overall Report', sub: 'Summary, charts data, placed list', color: 'orange' },
          { key: 'placed', icon: Award, label: 'Export Placed Students', sub: 'Name, email, company, package', color: 'green' },
          { key: 'allStudents', icon: Users, label: 'Export All Students', sub: 'Full profile + placement status', color: 'blue' },
          { key: 'applications', icon: ClipboardList, label: 'Export Applications', sub: 'All job applications + status', color: 'purple' },
        ].map(({ key, icon: Icon, label, sub, color }) => (
          <button
            key={key}
            onClick={() => handleExport(key)}
            disabled={!!exporting}
            className="flex items-center gap-3 p-4 rounded-xl transition-all text-left disabled:opacity-60 disabled:cursor-wait"
            style={{
              background: TONE[color].bg,
              border: `1px solid ${TONE[color].border}`,
              boxShadow: `0 0 18px ${TONE[color].bg}`,
              color: TONE[color].main,
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: TONE[color].soft, border: `1px solid ${TONE[color].border}` }}
            >
              {exporting === key
                ? <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: TONE[color].main }} />
                : <Icon size={20} style={{ color: TONE[color].main }} />}
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: TONE[color].main }}>
                <Download size={12} className="inline mr-1" />
                {exporting === key ? 'Downloading...' : label}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      {placementReport && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">{label}</div>
                  <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">{value}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</div>
                </div>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{
                    background: TONE[color].soft,
                    border: `1px solid ${TONE[color].border}`,
                    boxShadow: `0 0 15px ${TONE[color].bg}`,
                  }}
                >
                  <Icon size={20} style={{ color: TONE[color].main }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Companies */}
        {placementReport?.topCompanies?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">🏢 Top Recruiting Companies</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={placementReport.topCompanies} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="company" type="category" tick={{ fontSize: 12 }} width={110} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Students Placed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Application Status Pie */}
        {appReport?.statusCounts?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">📊 Applications by Status</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={appReport.statusCounts} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={85}
                  label={({ _id, percent }) => `${_id}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {appReport.statusCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Course-wise placement */}
        {placementReport?.courseWise?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">🎓 Course-wise Placement</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={placementReport.courseWise}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="course" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="placed" fill="#10b981" name="Placed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" fill="#e2e8f0" name="Total" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Most Applied Jobs */}
        {appReport?.jobWise?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">💼 Most Applied Jobs</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={appReport.jobWise}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="title" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v, _, p) => [v, p.payload.company]} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Applications" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Placed Students Table */}
      {placementReport?.placedStudents?.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-glow)] flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text-primary)]">
              🏆 Placed Students ({placementReport.placed})
            </h2>
            <span className="text-sm text-[var(--text-muted)]">Max Package: ₹{placementReport.maxPackage}L</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-card)] border-b border-[var(--border-glow)]">
                <tr>
                  {['#', 'Name', 'Email', 'Course', 'CGPA', 'Company', 'Package'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {placementReport.placedStudents.map((s, i) => (
                  <tr key={i} className="hover:bg-[var(--bg-card)] transition-colors">
                    <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{s.name || '—'}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{s.email || '—'}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{s.course || '—'}</td>
                    <td className="px-4 py-3">
                      {s.cgpa ? (
                        <span className={`font-semibold ${s.cgpa >= 8 ? 'text-[var(--neon-green)]' : s.cgpa >= 6 ? 'text-[var(--neon-orange)]' : 'text-[var(--neon-pink)]'}`}>
                          {s.cgpa}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--neon-blue)]">{s.company || '—'}</td>
                    <td className="px-4 py-3">
                      {s.package ? <span className="text-[var(--neon-green)] font-bold">₹{s.package}L</span> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 text-[var(--text-muted)]">
          <Award size={40} className="mx-auto mb-3 opacity-30" />
          <p>No placed students yet{courseFilter ? ` in ${courseFilter}` : ''}.</p>
          <p className="text-xs mt-1">Mark students as "Placed" in Manage Students to see them here.</p>
        </div>
      )}
    </div>
  );
}
