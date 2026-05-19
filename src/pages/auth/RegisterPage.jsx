import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { GraduationCap, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';

const COURSES = ['B.Tech','M.Tech','BCA','MCA','BBA','MBA','B.Sc','M.Sc'];
const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const rollNumberRegex = /^[A-Za-z0-9]+$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]{6,}$/;

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'', course:'B.Tech', rollNumber:'', phone:'' });
  const [otp, setOtp] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const pwMatch = form.password && form.confirmPassword && form.password === form.confirmPassword;
  const pwMismatch = form.confirmPassword && form.password !== form.confirmPassword;
  const isPasswordStrong = passwordRegex.test(form.password);

  const updateName = (value) => setForm(p => ({ ...p, name: value.replace(/[^A-Za-z ]/g, '').replace(/\s+/g, ' ') }));
  const updateEmail = (value) => setForm(p => ({ ...p, email: value.trim().toLowerCase() }));
  const updateRollNumber = (value) => setForm(p => ({ ...p, rollNumber: value.replace(/[^A-Za-z0-9]/g, '').toUpperCase() }));

  const validateDetails = () => {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const rollNumber = form.rollNumber.trim();
    if (!nameRegex.test(name)) { toast.error('Full name can contain only letters and spaces'); return false; }
    if (!emailRegex.test(email)) { toast.error('Please enter a valid email address'); return false; }
    if (rollNumber && !rollNumberRegex.test(rollNumber)) { toast.error('Roll number can contain only letters and numbers'); return false; }
    if (!passwordRegex.test(form.password)) { toast.error('Password must be at least 6 characters and include a letter and a number'); return false; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return false; }
    setForm(p => ({ ...p, name, email, rollNumber }));
    return true;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!validateDetails()) return;
    setOtpSending(true);
    try {
      await api.post('/auth/send-otp', { name: form.name.trim(), email: form.email.trim().toLowerCase() });
      toast.success('OTP sent to your email!'); setStep(2);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send OTP'); }
    finally { setOtpSending(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateDetails()) return;
    setLoading(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), rollNumber: form.rollNumber.trim(), otp });
      toast.success('Registration successful!');
      navigate('/student');
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center cyber-grid p-6" style={{ background: 'var(--bg-primary)' }}>
      <div style={{ position: 'fixed', top: '15%', left: '10%', width: 250, height: 250, background: 'radial-gradient(circle, rgba(176,64,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '15%', right: '10%', width: 250, height: 250, background: 'radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="w-full max-w-lg animate-fadeSlideUp">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #0a1030, #001a44)', border: '1px solid var(--neon-cyan)', boxShadow: '0 0 25px rgba(0,255,245,0.3)' }}>
            <GraduationCap size={24} style={{ color: 'var(--neon-cyan)' }} />
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--neon-cyan)', letterSpacing: '0.08em' }}>CREATE ACCOUNT</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>Join the Placement Portal</p>
          <div className="flex items-center justify-center gap-6 mt-4">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2 text-xs font-semibold"
                style={{ color: step === s ? 'var(--neon-cyan)' : step > s ? 'var(--neon-green)' : 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.06em' }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: step === s ? 'var(--neon-cyan)' : step > s ? 'var(--neon-green)' : 'var(--border-glow)',
                    color: (step === s || step > s) ? '#000' : 'var(--text-muted)',
                    boxShadow: step === s ? '0 0 10px var(--neon-cyan)' : 'none'
                  }}>{s}</span>
                {s === 1 ? 'Your Details' : 'Verify Email'}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-card p-8">
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Full Name *</label>
                  <input className="input" type="text" placeholder="Your full name" value={form.name} onChange={e => updateName(e.target.value)} pattern="[A-Za-z ]+" title="Only letters and spaces are allowed" required />
                </div>
                <div className="col-span-2">
                  <label className="label">Email Address *</label>
                  <input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={e => updateEmail(e.target.value)} pattern="[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}" title="Enter a valid email address" required />
                </div>
                <div>
                  <label className="label">Roll Number</label>
                  <input className="input" placeholder="e.g. BT2021001" value={form.rollNumber} onChange={e => updateRollNumber(e.target.value)} pattern="[A-Za-z0-9]*" title="Only letters and numbers are allowed" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" type="tel" placeholder="+91 XXXXXXXXXX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="label">Course *</label>
                  <select className="input" value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))} required>
                    {COURSES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Password *</label>
                  <div className="relative">
                    <input className="input pr-10" style={form.password && !isPasswordStrong ? { borderColor: 'var(--neon-pink)' } : form.password && isPasswordStrong ? { borderColor: 'var(--neon-green)' } : {}} type={showPw ? 'text' : 'password'} placeholder="Min 6, letter + number" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                    <button type="button" className="absolute right-3 top-2.5" style={{ color: 'var(--text-muted)' }} onClick={() => setShowPw(v => !v)}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                  {form.password && !isPasswordStrong && <p className="text-xs mt-1" style={{ color: 'var(--neon-pink)', fontFamily: 'Rajdhani, sans-serif' }}>Use at least 6 characters with a letter and a number</p>}
                </div>
                <div>
                  <label className="label">Re-type Password *</label>
                  <div className="relative">
                    <input className="input pr-10" style={pwMismatch ? { borderColor: 'var(--neon-pink)' } : pwMatch ? { borderColor: 'var(--neon-green)' } : {}}
                      type={showConfirm ? 'text' : 'password'} placeholder="Re-type password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
                    <button type="button" className="absolute right-3 top-2.5" style={{ color: 'var(--text-muted)' }} onClick={() => setShowConfirm(v => !v)}>{showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                    {pwMatch && <CheckCircle size={14} className="absolute right-9 top-3" style={{ color: 'var(--neon-green)' }} />}
                    {pwMismatch && <XCircle size={14} className="absolute right-9 top-3" style={{ color: 'var(--neon-pink)' }} />}
                  </div>
                  {pwMismatch && <p className="text-xs mt-1" style={{ color: 'var(--neon-pink)', fontFamily: 'Rajdhani, sans-serif' }}>Passwords do not match</p>}
                </div>
              </div>
              <button type="submit" disabled={otpSending || pwMismatch || !isPasswordStrong} className="btn-primary w-full py-3 mt-2">
                {otpSending ? 'Sending OTP...' : 'Send OTP to Email →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(0,255,245,0.06)', border: '1px solid rgba(0,255,245,0.2)', boxShadow: '0 0 20px rgba(0,255,245,0.1)', fontSize: 28 }}>
                  📧
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
                  OTP sent to <strong style={{ color: 'var(--neon-cyan)' }}>{form.email}</strong>
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Valid for 10 minutes</p>
              </div>
              <div>
                <label className="label">Enter OTP</label>
                <input className="input text-center text-3xl tracking-widest font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--neon-cyan)' }}
                  type="text" maxLength={6} placeholder="000000" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required />
              </div>
              <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full py-3">
                {loading ? 'Creating account...' : 'Verify & Create Account'}
              </button>
              <button type="button" className="w-full text-sm transition-colors" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--neon-blue)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                onClick={() => setStep(1)}>← Back to edit details</button>
              <button type="button" className="w-full text-sm font-semibold" style={{ color: 'var(--neon-blue)', fontFamily: 'Rajdhani, sans-serif' }}
                onClick={() => { setOtp(''); handleSendOtp({ preventDefault: () => {} }); }}>Resend OTP</button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold" style={{ color: 'var(--neon-blue)', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
