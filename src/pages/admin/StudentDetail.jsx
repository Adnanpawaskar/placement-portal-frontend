import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, User, GraduationCap, Briefcase, Award, FileText, Eye, Upload, Download, MessageCircle, X, Send } from 'lucide-react';

const COURSES = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'BBA', 'MBA', 'B.Sc', 'M.Sc'];

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingLetter, setUploadingLetter] = useState(false);
  const resumeRef = useRef();
  const joiningLetterRef = useRef();
  const [waModal, setWaModal] = useState(false);
  const [waMessage, setWaMessage] = useState('');
  const [waSending, setWaSending] = useState(false);

  const loadStudent = () => {
    api.get(`/students/${id}`)
      .then(res => {
        const s = res.data.student;
        setStudent(s);
        setForm({
          name:               s.user?.name || '',
          phone:              s.phone || '',
          course:             s.course || 'B.Tech',
          branch:             s.branch || '',
          rollNumber:         s.rollNumber || '',
          semester:           s.semester || '',
          year:               s.year || '',
          cgpa:               s.cgpa || '',
          percentage10th:     s.percentage10th || '',
          percentage12th:     s.percentage12th || '',
          skills:             s.skills?.join(', ') || '',
          linkedIn:           s.linkedIn || '',
          github:             s.github || '',
          bio:                s.bio || '',
          address:            s.address || '',
          placementStatus:    s.placementStatus || 'Not Placed',
          placedAt:           s.placedAt || '',
          packageOffered:     s.packageOffered || '',
          internshipStatus:   s.internshipStatus || 'Not Done',
          internshipCompany:  s.internshipCompany || '',
          internshipDuration: s.internshipDuration || '',
          internshipStipend:  s.internshipStipend || '',
          isEligible:         s.isEligible !== false,
        });
      })
      .catch(() => { toast.error('Failed to load student'); navigate('/admin/students'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStudent(); }, [id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        cgpa:           form.cgpa          ? Number(form.cgpa)          : undefined,
        percentage10th: form.percentage10th ? Number(form.percentage10th) : undefined,
        percentage12th: form.percentage12th ? Number(form.percentage12th) : undefined,
        semester:       form.semester       ? Number(form.semester)       : undefined,
        year:           form.year           ? Number(form.year)           : undefined,
        packageOffered: form.packageOffered ? Number(form.packageOffered) : undefined,
        internshipStipend: form.internshipStipend ? Number(form.internshipStipend) : undefined,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      await api.put(`/students/${id}`, payload);
      toast.success('Student updated successfully!');
      navigate('/admin/students');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  const sendWhatsAppMsg = async () => {
    if (!waMessage.trim()) return toast.error('Please enter a message');
    const phone = student?.phone;
    if (!phone) return toast.error('Student has no phone number');
    setWaSending(true);
    try {
      await api.post('/notifications/whatsapp', { studentId: id, message: waMessage });
      toast.success('WhatsApp message sent');
      setWaModal(false);
      setWaMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send WhatsApp message');
    } finally {
      setWaSending(false);
    }
  };

  const viewResume = () => {
    if (!student?.resume?.path) return toast.error('No resume available');
    const token = localStorage.getItem('token');
    window.open(`/api/students/resume/view/${id}?token=${token}`, '_blank');
  };

  const downloadResume = async () => {
    try {
      const res = await api.get(`/students/resume/download/${id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(student?.user?.name || 'student').replace(/[^a-zA-Z0-9]/g, '_')}_resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Resume download failed');
    }
  };

  const handleUploadResume = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await api.post(`/students/${id}/resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(student?.resume?.filename ? 'Resume replaced!' : 'Resume uploaded!');
      setStudent(prev => ({ ...prev, resume: res.data.resume }));
    } catch {
      toast.error('Failed to upload resume');
    } finally {
      setUploadingResume(false);
      if (resumeRef.current) resumeRef.current.value = '';
    }
  };

  const handleUploadJoiningLetter = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLetter(true);
    try {
      const formData = new FormData();
      formData.append('joiningLetter', file);
      const res = await api.post(`/students/${id}/joining-letter`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(student?.joiningLetter?.filename ? 'Joining letter replaced!' : 'Joining letter uploaded!');
      setStudent(prev => ({ ...prev, joiningLetter: res.data.joiningLetter }));
    } catch {
      toast.error('Failed to upload joining letter');
    } finally {
      setUploadingLetter(false);
      if (joiningLetterRef.current) joiningLetterRef.current.value = '';
    }
  };

  const viewJoiningLetter = () => {
    if (!student?.joiningLetter?.path) return;
    const token = localStorage.getItem('token');
    window.open(`/api/students/joining-letter/view/${id}?token=${token}`, '_blank');
  };

  const downloadJoiningLetter = async () => {
    try {
      const res = await api.get(`/students/joining-letter/download/${id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      const name = (student?.user?.name || 'student').replace(/[^a-zA-Z0-9]/g, '_');
      const ext = student?.joiningLetter?.filename?.match(/\.[^.]+$/)?.[0] || '.pdf';
      a.href = url;
      a.download = `${name}_joining_letter${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Joining letter download failed');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--neon-blue)' }} />
    </div>
  );

  const Section = ({ title, icon: Icon, color, children }) => (
    <div className="card space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <h2 className="font-bold text-sm" style={{ color, fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em' }}>{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );

  const Field = ({ label, children, full }) => (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="label">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/students')}
            className="btn-secondary flex items-center gap-1 text-sm py-1.5 px-3">
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--neon-blue)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>
              STUDENT DETAIL
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>
              {student?.user?.email} · {student?.rollNumber || 'No Roll No.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {student?.phone && (
            <button onClick={() => { setWaMessage(''); setWaModal(true); }}
              className="btn-secondary flex items-center gap-2 text-sm"
              style={{ borderColor: 'rgba(37,211,102,0.4)', color: '#25D366' }}>
              <MessageCircle size={15} /> WhatsApp
            </button>
          )}
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save size={15} />{saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {waModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(37,211,102,0.3)', boxShadow: '0 0 40px rgba(37,211,102,0.15)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}>
                  <MessageCircle size={18} style={{ color: '#25D366' }} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#25D366', fontFamily: 'Orbitron, sans-serif' }}>SEND WHATSAPP</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>To: {student?.user?.name} · {student?.phone}</p>
                </div>
              </div>
              <button onClick={() => setWaModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/10"
                style={{ color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Quick Templates */}
            <div className="space-y-1">
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Quick Templates</p>
              <div className="flex flex-wrap gap-2">
                {[
                  `Hi ${student?.user?.name?.split(' ')[0]}, please check your placement portal for an important update.`,
                  `Hi ${student?.user?.name?.split(' ')[0]}, your interview has been scheduled. Please log in to the portal for details.`,
                  `Congratulations ${student?.user?.name?.split(' ')[0]}! You have been placed. Please check your portal for next steps.`,
                ].map((t, i) => (
                  <button key={i} onClick={() => setWaMessage(t)}
                    className="text-xs px-2 py-1 rounded-lg transition-all"
                    style={{ background: 'rgba(37,211,102,0.08)', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)' }}>
                    Template {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Message</label>
              <textarea
                className="input w-full"
                rows={4}
                placeholder="Type your WhatsApp message here..."
                value={waMessage}
                onChange={e => setWaMessage(e.target.value)}
                style={{ resize: 'vertical' }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{waMessage.length} characters</p>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setWaModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={sendWhatsAppMsg} disabled={!waMessage.trim() || waSending}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2 px-4 rounded-xl transition-all"
                style={{
                  background: (!waMessage.trim() || waSending) ? 'rgba(37,211,102,0.2)' : 'rgba(37,211,102,0.9)',
                  color: '#fff',
                  border: '1px solid rgba(37,211,102,0.5)',
                  cursor: (!waMessage.trim() || waSending) ? 'not-allowed' : 'pointer'
                }}>
                <Send size={14} /> {waSending ? 'Sending...' : 'Send WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Card */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)' }}>
            <FileText size={16} style={{ color: 'var(--neon-cyan)' }} />
          </div>
          <h2 className="font-bold text-sm" style={{ color: 'var(--neon-cyan)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em' }}>DOCUMENTS</h2>
        </div>

        {/* Resume Row */}
        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glow)' }}>
          <div className="flex items-center gap-2">
            <FileText size={15} style={{ color: 'var(--neon-cyan)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Resume</p>
              {student?.resume?.filename ? (
                <p className="text-xs" style={{ color: 'var(--neon-cyan)' }}>{student.resume.originalName || student.resume.filename}</p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No resume uploaded yet</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={resumeRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleUploadResume}
              id="resume-upload"
            />
            {student?.resume?.filename && (
              <button onClick={viewResume}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,212,255,0.3)' }}>
                <Eye size={13} /> View
              </button>
            )}
            <label htmlFor="resume-upload"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-all"
              style={{ background: 'rgba(176,64,255,0.1)', color: 'var(--neon-purple)', border: '1px solid rgba(176,64,255,0.3)', opacity: uploadingResume ? 0.6 : 1 }}>
              <Upload size={13} /> {uploadingResume ? 'Uploading...' : student?.resume?.filename ? 'Replace' : 'Add Resume'}
            </label>
            {student?.resume?.filename && (
              <button onClick={downloadResume}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--neon-green)', border: '1px solid rgba(0,255,136,0.3)' }}>
                <Download size={13} /> Download
              </button>
            )}
          </div>
        </div>

        {/* Joining Letter Row */}
        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glow)' }}>
          <div className="flex items-center gap-2">
            <FileText size={15} style={{ color: 'var(--neon-purple)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Joining Letter</p>
              {student?.joiningLetter?.filename ? (
                <p className="text-xs" style={{ color: 'var(--neon-purple)' }}>{student.joiningLetter.originalName || student.joiningLetter.filename}</p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No joining letter uploaded yet</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={joiningLetterRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleUploadJoiningLetter}
              id="joining-letter-upload"
            />
            {student?.joiningLetter?.filename && (
              <button onClick={viewJoiningLetter}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: 'rgba(176,64,255,0.1)', color: 'var(--neon-purple)', border: '1px solid rgba(176,64,255,0.3)' }}>
                <Eye size={13} /> View
              </button>
            )}
            <label htmlFor="joining-letter-upload"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-all"
              style={{ background: 'rgba(176,64,255,0.1)', color: 'var(--neon-purple)', border: '1px solid rgba(176,64,255,0.3)', opacity: uploadingLetter ? 0.6 : 1 }}>
              <Upload size={13} /> {uploadingLetter ? 'Uploading...' : student?.joiningLetter?.filename ? 'Replace' : 'Add Joining Letter'}
            </label>
            {student?.joiningLetter?.filename ? (
              <button onClick={downloadJoiningLetter}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--neon-green)', border: '1px solid rgba(0,255,136,0.3)' }}>
                <Download size={13} /> Download
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Personal */}
      <Section title="PERSONAL INFO" icon={User} color="var(--neon-cyan)">
        <Field label="Full Name"><input className="input" value={form.name} onChange={e => set('name', e.target.value)} /></Field>
        <Field label="Phone"><input className="input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
        <Field label="Roll Number"><input className="input" value={form.rollNumber} onChange={e => set('rollNumber', e.target.value)} /></Field>
        <Field label="Eligible for Placement">
          <select className="input" value={form.isEligible ? 'true' : 'false'} onChange={e => set('isEligible', e.target.value === 'true')}>
            <option value="true">Yes</option>
            <option value="false">No (Debarred)</option>
          </select>
        </Field>
        <Field label="Address" full><textarea className="input" rows={2} value={form.address} onChange={e => set('address', e.target.value)} /></Field>
        <Field label="Bio" full><textarea className="input" rows={3} value={form.bio} onChange={e => set('bio', e.target.value)} /></Field>
      </Section>

      {/* Academic */}
      <Section title="ACADEMIC INFO" icon={GraduationCap} color="var(--neon-blue)">
        <Field label="Course">
          <select className="input" value={form.course} onChange={e => set('course', e.target.value)}>
            {COURSES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Branch"><input className="input" placeholder="e.g. CSE, ECE" value={form.branch} onChange={e => set('branch', e.target.value)} /></Field>
        <Field label="Semester">
          <select className="input" value={form.semester} onChange={e => set('semester', e.target.value)}>
            <option value="">Select</option>
            {Array.from({length:12},(_,i)=>i+1).map(s=><option key={s} value={s}>Semester {s}</option>)}
          </select>
        </Field>
        <Field label="Year">
          <select className="input" value={form.year} onChange={e => set('year', e.target.value)}>
            <option value="">Select</option>
            {[1,2,3,4,5].map(y=><option key={y} value={y}>Year {y}</option>)}
          </select>
        </Field>
        <Field label="CGPA"><input className="input" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={e => set('cgpa', e.target.value)} /></Field>
        <Field label="10th %"><input className="input" type="number" step="0.1" min="0" max="100" value={form.percentage10th} onChange={e => set('percentage10th', e.target.value)} /></Field>
        <Field label="12th %"><input className="input" type="number" step="0.1" min="0" max="100" value={form.percentage12th} onChange={e => set('percentage12th', e.target.value)} /></Field>
        <Field label="Skills (comma separated)" full>
          <input className="input" placeholder="React, Python, SQL..." value={form.skills} onChange={e => set('skills', e.target.value)} />
        </Field>
        <Field label="LinkedIn"><input className="input" placeholder="linkedin.com/in/..." value={form.linkedIn} onChange={e => set('linkedIn', e.target.value)} /></Field>
        <Field label="GitHub"><input className="input" placeholder="github.com/..." value={form.github} onChange={e => set('github', e.target.value)} /></Field>
      </Section>

      {/* Internship */}
      <Section title="INTERNSHIP INFO" icon={Briefcase} color="var(--neon-purple)">
        <Field label="Internship Status">
          <select className="input" value={form.internshipStatus} onChange={e => set('internshipStatus', e.target.value)}>
            <option>Not Done</option>
            <option>Ongoing</option>
            <option>Completed</option>
          </select>
        </Field>
        <Field label="Company"><input className="input" placeholder="Company name" value={form.internshipCompany} onChange={e => set('internshipCompany', e.target.value)} /></Field>
        <Field label="Duration"><input className="input" placeholder="e.g. 3 months" value={form.internshipDuration} onChange={e => set('internshipDuration', e.target.value)} /></Field>
        <Field label="Stipend (₹/month)"><input className="input" type="number" placeholder="e.g. 15000" value={form.internshipStipend} onChange={e => set('internshipStipend', e.target.value)} /></Field>
      </Section>

      {/* Placement */}
      <Section title="PLACEMENT INFO" icon={Award} color="var(--neon-green)">
        <Field label="Placement Status">
          <select className="input" value={form.placementStatus} onChange={e => set('placementStatus', e.target.value)}>
            <option>Not Placed</option>
            <option>In Process</option>
            <option>Placed</option>
          </select>
        </Field>
        <Field label="Placed At (Company)">
          <input className="input" placeholder="e.g. Google India" value={form.placedAt}
            onChange={e => set('placedAt', e.target.value)}
            disabled={form.placementStatus !== 'Placed'} />
        </Field>
        <Field label="Package Offered (LPA)">
          <input className="input" type="number" step="0.5" placeholder="e.g. 12" value={form.packageOffered}
            onChange={e => set('packageOffered', e.target.value)}
            disabled={form.placementStatus !== 'Placed'} />
        </Field>
      </Section>

      <div className="flex justify-end pb-6">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-8">
          <Save size={15} />{saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
