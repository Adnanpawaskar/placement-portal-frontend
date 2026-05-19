import useScrollReveal from '../../hooks/useScrollReveal';
import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Upload, Save, FileText, Plus, Trash2, TrendingUp, Briefcase } from 'lucide-react';

const COURSES = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'BBA', 'MBA', 'B.Sc', 'M.Sc'];

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [joiningLetterFile, setJoiningLetterFile] = useState(null);
  const [uploadingLetter, setUploadingLetter] = useState(false);
  const [semesterCGPAs, setSemesterCGPAs] = useState([]);

  useEffect(() => {
    api.get('/students/profile').then(res => {
      const s = res.data.student;
      setProfile(s);
      setForm({
        name: s.user?.name || '',
        phone: s.phone || '',
        course: s.course || 'B.Tech',
        branch: s.branch || '',
        semester: s.semester || '',
        year: s.year || '',
        cgpa: s.cgpa || '',
        percentage10th: s.percentage10th || '',
        percentage12th: s.percentage12th || '',
        skills: s.skills?.join(', ') || '',
        linkedIn: s.linkedIn || '',
        github: s.github || '',
        bio: s.bio || '',
        address: s.address || '',
        rollNumber: s.rollNumber || '',
        internshipStatus: s.internshipStatus || 'Not Done',
        internshipCompany: s.internshipCompany || '',
        internshipDuration: s.internshipDuration || '',
        internshipStipend: s.internshipStipend || '',
      });
      setSemesterCGPAs(s.semesterCGPAs || []);
    }).catch(() => toast.error('Failed to load profile')).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, semesterCGPAs };
      const res = await api.put('/students/profile', payload);
      setProfile(res.data.student);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) { toast.error('Please select a file'); return; }
    const formData = new FormData();
    formData.append('resume', resumeFile);
    setUploading(true);
    try {
      const res = await api.post('/students/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(p => ({ ...p, resume: res.data.resume }));
      setResumeFile(null);
      toast.success('Resume uploaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleJoiningLetterUpload = async () => {
    if (!joiningLetterFile) { toast.error('Please select a file'); return; }
    const formData = new FormData();
    formData.append('joiningLetter', joiningLetterFile);
    setUploadingLetter(true);
    try {
      const res = await api.post('/students/profile/joining-letter', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(p => ({ ...p, joiningLetter: res.data.joiningLetter }));
      setJoiningLetterFile(null);
      toast.success('Joining letter uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploadingLetter(false); }
  };

  const addSemesterCGPA = () => {
    const nextSem = semesterCGPAs.length > 0 ? Math.max(...semesterCGPAs.map(s => s.semester)) + 1 : 1;
    if (nextSem > 12) { toast.error('Maximum 12 semesters'); return; }
    setSemesterCGPAs(prev => [...prev, { semester: nextSem, cgpa: '', backlogs: 0 }]);
  };

  const updateSemesterCGPA = (index, field, value) => {
    setSemesterCGPAs(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeSemesterCGPA = (index) => {
    setSemesterCGPAs(prev => prev.filter((_, i) => i !== index));
  };

  const averageCGPA = semesterCGPAs.length > 0
    ? (semesterCGPAs.filter(s => s.cgpa).reduce((sum, s) => sum + parseFloat(s.cgpa || 0), 0) / semesterCGPAs.filter(s => s.cgpa).length).toFixed(2)
    : null;

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--neon-blue)]" /></div>;

  return (
    <div className="max-w-3xl space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Profile</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save size={16} />{saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Personal Info */}
      <div className="card">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4 text-lg">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className="label">Roll Number</label><input className="input" value={form.rollNumber} onChange={e => setForm(p => ({ ...p, rollNumber: e.target.value }))} /></div>
          <div><label className="label">Phone</label><input className="input" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
          <div><label className="label">Email</label><input className="input" type="email" value={profile?.user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} /></div>
          <div className="col-span-2"><label className="label">Address</label><textarea className="input" rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
          <div className="col-span-2"><label className="label">Bio / About</label><textarea className="input" rows={3} placeholder="Tell recruiters about yourself..." value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} /></div>
        </div>
      </div>

      {/* Academic Info */}
      <div className="card">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4 text-lg">Academic Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Course</label>
            <select className="input" value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))}>
              {COURSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="label">Branch / Specialization</label><input className="input" placeholder="e.g. Computer Science" value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} /></div>
          <div><label className="label">Current Semester</label><input className="input" type="number" min="1" max="12" value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))} /></div>
          <div><label className="label">Year of Passing</label><input className="input" type="number" min="2020" max="2035" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} /></div>
          <div><label className="label">Overall CGPA (out of 10)</label><input className="input" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={e => setForm(p => ({ ...p, cgpa: e.target.value }))} /></div>
          <div>
            <label className="label">Average CGPA (auto-calculated)</label>
            <div className="input flex items-center gap-2" style={{ cursor: 'default', opacity: averageCGPA ? 1 : 0.5 }}>
              {averageCGPA
                ? <><span className="font-bold" style={{ color: 'var(--neon-green)' }}>{averageCGPA}</span><span className="text-xs" style={{ color: 'var(--text-muted)' }}>from semester data</span></>
                : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Add semester CGPAs below</span>
              }
            </div>
          </div>
          <div><label className="label">10th Percentage</label><input className="input" type="number" step="0.01" min="0" max="100" value={form.percentage10th} onChange={e => setForm(p => ({ ...p, percentage10th: e.target.value }))} /></div>
          <div><label className="label">12th Percentage</label><input className="input" type="number" step="0.01" min="0" max="100" value={form.percentage12th} onChange={e => setForm(p => ({ ...p, percentage12th: e.target.value }))} /></div>
        </div>
      </div>

      {/* Semester-wise CGPA */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-[var(--neon-blue)]" />
            <h2 className="font-semibold text-[var(--text-primary)] text-lg">Semester-wise CGPA</h2>
          </div>
          <div className="flex items-center gap-3">
            {averageCGPA && (
              <span className="text-sm bg-blue-50 text-[var(--neon-blue)] px-3 py-1 rounded-full font-medium">
                Avg: {averageCGPA}
              </span>
            )}
            <button onClick={addSemesterCGPA} className="btn-secondary flex items-center gap-1 text-sm py-1.5 px-3">
              <Plus size={14} /> Add Semester
            </button>
          </div>
        </div>
        {semesterCGPAs.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6 border-2 border-dashed border-[var(--border-glow)] rounded-xl">
            No semester data added yet. Click "Add Semester" to get started.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase px-1">
              <span className="col-span-3">Semester</span>
              <span className="col-span-4">CGPA (0-10)</span>
              <span className="col-span-4">Backlogs</span>
              <span className="col-span-1"></span>
            </div>
            {semesterCGPAs.sort((a, b) => a.semester - b.semester).map((sem, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-[var(--bg-card)] rounded-xl p-2">
                <div className="col-span-3">
                  <select className="input text-sm py-1.5" value={sem.semester}
                    onChange={e => updateSemesterCGPA(idx, 'semester', parseInt(e.target.value))}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>Sem {n}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4">
                  <input className="input text-sm py-1.5" type="number" step="0.01" min="0" max="10"
                    placeholder="e.g. 8.5" value={sem.cgpa}
                    onChange={e => updateSemesterCGPA(idx, 'cgpa', e.target.value)} />
                </div>
                <div className="col-span-4">
                  <input className="input text-sm py-1.5" type="number" min="0"
                    placeholder="0" value={sem.backlogs}
                    onChange={e => updateSemesterCGPA(idx, 'backlogs', parseInt(e.target.value) || 0)} />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button onClick={() => removeSemesterCGPA(idx)} className="text-red-400 hover:text-[var(--neon-pink)] p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {/* Visual bar */}
            {semesterCGPAs.filter(s => s.cgpa).length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--border-glow)]">
                <p className="text-xs text-[var(--text-muted)] mb-2">CGPA Trend</p>
                <div className="flex items-end gap-1 h-16">
                  {semesterCGPAs.filter(s => s.cgpa).sort((a, b) => a.semester - b.semester).map((sem, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-[var(--text-secondary)] font-medium">{sem.cgpa}</span>
                      <div className="w-full rounded-t-sm bg-blue-500"
                        style={{ height: `${(parseFloat(sem.cgpa) / 10) * 40}px`, minHeight: '4px' }} />
                      <span className="text-xs text-[var(--text-muted)]">S{sem.semester}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Internship Info */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase size={20} className="text-[var(--neon-purple)]" />
          <h2 className="font-semibold text-[var(--text-primary)] text-lg">Internship Details</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Internship Status</label>
            <select className="input" value={form.internshipStatus} onChange={e => setForm(p => ({ ...p, internshipStatus: e.target.value }))}>
              <option value="Not Done">Not Done</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          {form.internshipStatus !== 'Not Done' && (
            <>
              <div><label className="label">Company Name</label><input className="input" placeholder="e.g. Google" value={form.internshipCompany} onChange={e => setForm(p => ({ ...p, internshipCompany: e.target.value }))} /></div>
              <div><label className="label">Duration</label><input className="input" placeholder="e.g. 3 months" value={form.internshipDuration} onChange={e => setForm(p => ({ ...p, internshipDuration: e.target.value }))} /></div>
              <div><label className="label">Stipend (₹/month)</label><input className="input" type="number" placeholder="e.g. 15000" value={form.internshipStipend} onChange={e => setForm(p => ({ ...p, internshipStipend: e.target.value }))} /></div>
            </>
          )}
        </div>
      </div>

      {/* Skills & Links */}
      <div className="card">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4 text-lg">Skills & Links</h2>
        <div className="space-y-4">
          <div><label className="label">Skills (comma-separated)</label><input className="input" placeholder="e.g. JavaScript, React, Node.js, Python" value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} /></div>
          <div><label className="label">LinkedIn Profile URL</label><input className="input" placeholder="https://linkedin.com/in/yourprofile" value={form.linkedIn} onChange={e => setForm(p => ({ ...p, linkedIn: e.target.value }))} /></div>
          <div><label className="label">GitHub Profile URL</label><input className="input" placeholder="https://github.com/yourusername" value={form.github} onChange={e => setForm(p => ({ ...p, github: e.target.value }))} /></div>
        </div>
      </div>

      {/* Resume Upload */}
      <div className="card">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4 text-lg">Resume</h2>
        {profile?.resume ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mb-4">
            <FileText size={20} className="text-[var(--neon-green)]" />
            <div className="flex-1">
              <div className="text-sm font-medium text-green-800">{profile.resume.originalName}</div>
              <div className="text-xs text-[var(--neon-green)]">Uploaded {new Date(profile.resume.uploadedAt).toLocaleDateString('en-IN')}</div>
            </div>
            <a href={`/${profile.resume.path}`} target="_blank" rel="noopener noreferrer"
              className="text-xs bg-[var(--neon-blue)] text-black px-3 py-1.5 rounded-lg hover:bg-blue-700">
              📄 View / Download
            </a>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-sm text-amber-700">
            ⚠️ No resume uploaded. You need a resume to apply for jobs.
          </div>
        )}
        <div className="flex gap-3">
          <input type="file" accept=".pdf,.doc,.docx" className="input flex-1" onChange={e => setResumeFile(e.target.files[0])} />
          <button onClick={handleResumeUpload} disabled={uploading || !resumeFile} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Upload size={16} />{uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">Accepted: PDF, DOC, DOCX. Max 5MB.</p>
      </div>

      {/* Joining / Offer Letter */}
      <div className="card">
        <h2 className="font-semibold text-[var(--text-primary)] mb-1 text-lg flex items-center gap-2">
          <FileText size={18} className="text-[var(--neon-orange)]" /> Joining / Offer Letter
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Upload your offer letter or joining letter after placement / internship selection.</p>
        {profile?.joiningLetter ? (
          <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: 'rgba(255,140,0,0.06)', border: '1px solid rgba(255,140,0,0.3)' }}>
            <FileText size={20} style={{ color: 'var(--neon-orange)' }} />
            <div className="flex-1">
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{profile.joiningLetter.originalName}</div>
              <div className="text-xs" style={{ color: 'var(--neon-orange)' }}>Uploaded {new Date(profile.joiningLetter.uploadedAt).toLocaleDateString('en-IN')}</div>
            </div>
            <a href={`/api/students/joining-letter/view/${profile._id}?token=${localStorage.getItem('token')}`} target="_blank" rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: 'var(--neon-orange)', color: '#000' }}>
              📄 View
            </a>
          </div>
        ) : (
          <div className="p-3 rounded-xl mb-4 text-sm" style={{ background: 'rgba(255,140,0,0.06)', border: '1px dashed rgba(255,140,0,0.3)', color: 'var(--text-muted)' }}>
            No letter uploaded yet.
          </div>
        )}
        <div className="flex gap-3">
          <input type="file" accept=".pdf,.doc,.docx" className="input flex-1" onChange={e => setJoiningLetterFile(e.target.files[0])} />
          <button onClick={handleJoiningLetterUpload} disabled={uploadingLetter || !joiningLetterFile} className="btn-primary flex items-center gap-2 whitespace-nowrap"
            style={{ background: joiningLetterFile ? 'var(--neon-orange)' : undefined, borderColor: 'var(--neon-orange)' }}>
            <Upload size={16} />{uploadingLetter ? 'Uploading...' : 'Upload Letter'}
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">Accepted: PDF, DOC, DOCX. Max 5MB.</p>
      </div>
    </div>
  );
}
