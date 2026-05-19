import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { GraduationCap, Eye, EyeOff, Zap } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center cyber-grid" style={{ background: 'var(--bg-primary)' }}>
      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: '20%', left: '15%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '15%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(176,64,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="w-full max-w-md px-4 animate-fadeSlideUp">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-float"
            style={{ background: 'linear-gradient(135deg, #001a33, #003366)', border: '1px solid var(--neon-blue)', boxShadow: '0 0 30px rgba(0,212,255,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
            <GraduationCap size={28} style={{ color: 'var(--neon-blue)' }} />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--neon-blue)', letterSpacing: '0.1em' }}>PLACEMENT CELL</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.08em' }}>ACCESS YOUR PORTAL</p>
        </div>

        {/* Card */}
        <div className="modal-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input
                className="input"
                type="email"
                placeholder="you@university.edu"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-2.5" style={{ color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base">
              {loading ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Authenticating...</>
              ) : (
                <><Zap size={16} /> Sign In</>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>
              New student?{' '}
              <Link to="/register" style={{ color: 'var(--neon-blue)', fontWeight: 600, textDecoration: 'none' }}>Register here</Link>
            </p>
          </div>


        </div>
      </div>
    </div>
  );
}
