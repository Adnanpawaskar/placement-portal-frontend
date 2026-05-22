import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, LayoutDashboard, Users, Briefcase, Bell, BarChart2, LogOut, Menu, ClipboardList, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/jobs', label: 'Job Postings', icon: Briefcase },
  { to: '/admin/internships', label: 'Internships', icon: GraduationCap },
  { to: '/admin/applications', label: 'Applications', icon: ClipboardList },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/reports', label: 'Analytics', icon: BarChart2 },
];

const DARK_THEME = {
  '--bg-primary': '#060d1f',
  '--bg-secondary': '#0a1628',
  '--bg-card': '#0d1e35',
  '--bg-card-hover': '#112240',
  '--border-glow': '#1e3a5f',
  '--border-accent': '#00d4ff',
  '--neon-blue': '#00d4ff',
  '--neon-cyan': '#00fff5',
  '--neon-purple': '#b040ff',
  '--neon-green': '#00ff88',
  '--neon-pink': '#ff2d9a',
  '--neon-orange': '#ff8c00',
  '--text-primary': '#e8f4fd',
  '--text-secondary': '#7aa3c8',
  '--text-muted': '#3d6080',
};

const LIGHT_THEME = {
  '--bg-primary': '#f0f4f8',
  '--bg-secondary': '#ffffff',
  '--bg-card': '#ffffff',
  '--bg-card-hover': '#f8fafc',
  '--border-glow': '#cbd5e1',
  '--border-accent': '#0066cc',
  '--neon-blue': '#0066cc',
  '--neon-cyan': '#0088bb',
  '--neon-purple': '#7c3aed',
  '--neon-green': '#047857',
  '--neon-pink': '#db2777',
  '--neon-orange': '#b45309',
  '--text-primary': '#0f172a',
  '--text-secondary': '#334155',
  '--text-muted': '#64748b',
};

function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => root.style.setProperty(key, value));
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('adminTheme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('adminTheme', isDark ? 'dark' : 'light');
    document.documentElement.dataset.adminTheme = isDark ? 'dark' : 'light';
    applyTheme(isDark ? DARK_THEME : LIGHT_THEME);
  }, [isDark]);

  useEffect(() => () => {
    delete document.documentElement.dataset.adminTheme;
    applyTheme(DARK_THEME);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const Sidebar = () => (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-secondary)' }}>
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border-glow)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #003366, #0066aa)', border: '1px solid var(--neon-blue)', boxShadow: '0 0 15px rgba(0,212,255,0.4)' }}>
            <GraduationCap size={20} style={{ color: 'var(--neon-blue)' }} />
          </div>
          <div>
            <div className="font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--neon-blue)', letterSpacing: '0.08em' }}>ADMIN PANEL</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>Placement Cell</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-glow)' }}>
        <div className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #003366, #0066aa)', color: 'var(--neon-blue)', border: '1px solid var(--neon-blue)', boxShadow: '0 0 10px rgba(0,212,255,0.3)' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>{user?.name}</div>
            <div className="text-xs font-semibold" style={{ color: 'var(--neon-blue)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.08em' }}>ADMINISTRATOR</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setOpen(false)}>
            <Icon size={16} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pt-3 border-t" style={{ borderColor: 'var(--border-glow)' }}>
        <button
          onClick={() => setIsDark(p => !p)}
          className="sidebar-link w-full text-left"
          style={{ color: isDark ? '#f59e0b' : '#7c3aed' }}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border-glow)' }}>
        <button onClick={handleLogout}
          className="sidebar-link w-full text-left"
          style={{ color: 'var(--neon-pink)' }}>
          <LogOut size={16} /><span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-primary)' }}>
      <aside className="hidden lg:block w-64 flex-shrink-0"
        style={{ borderRight: '1px solid var(--border-glow)', background: 'var(--bg-secondary)' }}>
        <Sidebar />
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64" style={{ background: 'var(--bg-secondary)' }}><Sidebar /></div>
          <div className="flex-1" style={{ background: 'rgba(6,13,31,0.8)', backdropFilter: 'blur(4px)' }}
            onClick={() => setOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden px-4 py-3 flex items-center gap-3"
          style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-glow)' }}>
          <button onClick={() => setOpen(true)} style={{ color: 'var(--neon-blue)' }}>
            <Menu size={22} />
          </button>
          <span className="font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--neon-blue)', letterSpacing: '0.08em' }}>ADMIN PANEL</span>
          <button className="ml-auto" onClick={() => setIsDark(p => !p)} style={{ color: isDark ? '#f59e0b' : '#7c3aed' }}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 cyber-grid">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
