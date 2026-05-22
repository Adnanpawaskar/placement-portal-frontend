import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { GraduationCap, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';

const COURSES = ['B.Tech','M.Tech','BCA','MCA','BBA','MBA','B.Sc','M.Sc'];

// Name: only letters and single spaces between words, no numbers, no symbols
const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

// Roll Number: only digits (0-9), no letters, no symbols
const rollNumberRegex = /^\d+$/;

// Email: must start with a letter, then can have letters/digits,
// followed by @gmail.com only (no other domains, no symbols before @)
const emailRegex = /^[A-Za-z][A-Za-z0-9]*@gmail\.com$/;

// Phone: Indian mobile number — starts with 6,7,8, or 9 followed by exactly 9 more digits = 10 digits total
const phoneRegex = /^[6-9]\d{9}$/;

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{6,}$/;

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

  // Name: strip anything that isn't a letter or space, collapse multiple spaces
  const updateName = (value) => {
    const cleaned = value.replace(/[^A-Za-z ]/g, '').replace(/  +/g, ' ');
    setForm(p => ({ ...p, name: cleaned }));
  };

  // Email: lowercase trim only
  const updateEmail = (value) => setForm(p => ({ ...p, email: value.trim().toLowerCase() }));

  // Roll Number: only digits allowed
  const updateRollNumber = (value) => setForm(p => ({ ...p, rollNumber: value.replace(/\D/g, '') }));

  // Phone: only digits, max 10
  const updatePhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setForm(p => ({ ...p, phone: digits }));
  };

  const validateDetails = () => {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const rollNumber = form.rollNumber.trim();
    const phone = form.phone.trim();

    if (!name) { toast.error('Full name is required'); return false; }
    if (!nameRegex.test(name)) { toast.error('Name can only contain letters and spaces — no numbers or symbols'); return false; }

    if (!email) { toast.error('Email address is required'); return false; }
    if (!emailRegex.test(email)) { toast.error('Email must start with a letter, contain only letters/numbers, and end with @gmail.com'); return false; }

    if (rollNumber && !rollNumberRegex.test(rollNumber)) { toast.error('Roll number can contain digits only (0–9) — no letters or symbols'); return false; }

    if (phone && !phoneRegex.test(phone)) { toast.error('Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)'); return false; }

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

  // Live field feedback helpers
  const nameOk = form.name.trim() && nameRegex.test(form.name.trim());
  const nameErr = form.name.trim() && !nameRegex.test(form.name.trim());
  const emailOk = form.email && emailRegex.test(form.email);
  const emailErr = form.email && !emailRegex.test(form.email);
  const rollOk = form.rollNumber && rollNumberRegex.test(form.rollNumber);
  const rollErr = form.rollNumber && !rollNumberRegex.test(form.rollNumber);
  const phoneOk = form.phone && phoneRegex.test(form.phone);
  const phoneErr = form.phone && !phoneRegex.test(form.phone);

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

                {/* Full Name */}
                <div className="col-span-2">
                  <label className="label">Full Name *</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Your full name (letters only)"
                    value={form.name}
                    onChange={e => updateName(e.target.value)}
                    style={nameErr ? { borderColor: 'var(--neon-pink)' } : nameOk ? { borderColor: 'var(--neon-green)' } : {}}
                    required
                  />
                  {nameErr && <p className="text-xs mt-1" style={{ color: 'var(--neon-pink)', fontFamily: 'Rajdhani, sans-serif' }}>Only letters and spaces allowed — no numbers or symbols</p>}
                </div>

                {/* Email */}
                <div className="col-span-2">
                  <label className="label">Email Address *</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="example@gmail.com"
                    value={form.email}
                    onChange={e => updateEmail(e.target.value)}
                    style={emailErr ? { borderColor: 'var(--neon-pink)' } : emailOk ? { borderColor: 'var(--neon-green)' } : {}}
                    required
                  />
                  {emailErr && <p className="text-xs mt-1" style={{ color: 'var(--neon-pink)', fontFamily: 'Rajdhani, sans-serif' }}>Must start with a letter, use letters/digits only, end with @gmail.com</p>}
                </div>

                {/* Roll Number */}
                <div>
                  <label className="label">Roll Number</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. 2021001"
                    value={form.rollNumber}
                    onChange={e => updateRollNumber(e.target.value)}
                    style={rollErr ? { borderColor: 'var(--neon-pink)' } : rollOk ? { borderColor: 'var(--neon-green)' } : {}}
                    inputMode="numeric"
                  />
                  {rollErr && <p className="text-xs mt-1" style={{ color: 'var(--neon-pink)', fontFamily: 'Rajdhani, sans-serif' }}>Roll number must contain digits only</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="label">Phone</label>
                  <input
                    className="input"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={e => updatePhone(e.target.value)}
                    style={phoneErr ? { borderColor: 'var(--neon-pink)' } : phoneOk ? { borderColor: 'var(--neon-green)' } : {}}
                    maxLength={10}
                    inputMode="numeric"
                  />
                  {phoneErr && <p className="text-xs mt-1" style={{ color: 'var(--neon-pink)', fontFamily: 'Rajdhani, sans-serif' }}>Enter valid 10-digit Indian number (starts with 6–9)</p>}
                </div>

                {/* Course */}
                <div className="col-span-2">
                  <label className="label">Course *</label>
                  <select className="input" value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))} required>
                    {COURSES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="label">Password *</label>
                  <div className="relative">
                    <input className="input pr-10"
                      style={form.password && !isPasswordStrong ? { borderColor: 'var(--neon-pink)' } : form.password && isPasswordStrong ? { borderColor: 'var(--neon-green)' } : {}}
                      type={showPw ? 'text' : 'password'} placeholder="Min 6, letter + number"
                      value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                    <button type="button" className="absolute right-3 top-2.5" style={{ color: 'var(--text-muted)' }} onClick={() => setShowPw(v => !v)}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                  {form.password && !isPasswordStrong && <p className="text-xs mt-1" style={{ color: 'var(--neon-pink)', fontFamily: 'Rajdhani, sans-serif' }}>Use at least 6 characters with a letter and a number</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="label">Re-type Password *</label>
                  <div className="relative">
                    <input className="input pr-10"
                      style={pwMismatch ? { borderColor: 'var(--neon-pink)' } : pwMatch ? { borderColor: 'var(--neon-green)' } : {}}
                      type={showConfirm ? 'text' : 'password'} placeholder="Re-type password"
                      value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
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
                <input className="input text-center text-3xl tracking-widest font-bold"
                  style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--neon-cyan)' }}
                  type="text" maxLength={6} placeholder="000000"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required />
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
