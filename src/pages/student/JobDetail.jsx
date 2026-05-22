import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MapPin, Clock, Briefcase, Users, ChevronLeft, CheckCircle } from 'lucide-react';
import useScrollReveal from '../../hooks/useScrollReveal';

export default function JobDetail() {
  useScrollReveal();
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/jobs/${id}`), api.get('/applications/my')])
      .then(([jobRes, appRes]) => {
        setJob(jobRes.data.job);
        setApplied(appRes.data.applications.some(a => a.job?._id === id || a.job === id));
      })
      .catch(() => { toast.error('Job not found'); navigate('/student/jobs'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.post(`/applications/${id}/apply`, { coverLetter });
      setApplied(true); setShowForm(false);
      toast.success('Application submitted!');
    } catch (err) { toast.error(err.response?.data?.message || 'Application failed'); }
    finally { setApplying(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--neon-blue)' }} />
    </div>
  );
  if (!job) return null;

  const isExpired = new Date(job.applicationDeadline) < new Date();

  return (
    <div className="max-w-3xl animate-fadeIn">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm mb-6 transition-colors"
        style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--neon-blue)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
        <ChevronLeft size={17} /> Back to Jobs
      </button>

      <div className="card mb-6 scroll-reveal">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #001a44, #003388)', border: '1px solid var(--neon-blue)', color: 'var(--neon-blue)', fontFamily: 'Orbitron, sans-serif', boxShadow: '0 0 15px rgba(0,212,255,0.3)' }}>
            {job.company[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold mb-0.5" style={{ color: 'var(--text-primary)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.04em' }}>{job.title}</h1>
            <p className="text-base mb-3" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>{job.company}</p>
            <div className="flex flex-wrap gap-3 text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>
              <span className="flex items-center gap-1.5"><MapPin size={14} />{job.location}</span>
              <span className="flex items-center gap-1.5"><Briefcase size={14} />{job.jobType}</span>
              <span className="flex items-center gap-1.5"><Users size={14} />{job.applicantsCount} applicants</span>
              <span className={`flex items-center gap-1.5`} style={{ color: isExpired ? 'var(--neon-pink)' : 'var(--text-muted)' }}>
                <Clock size={14} />Deadline: {new Date(job.applicationDeadline).toLocaleDateString('en-IN')}{isExpired && ' (Expired)'}
              </span>
            </div>
          </div>
        </div>
        {job.salary?.min && (
          <div className="mt-4 p-3 inline-block rounded-xl"
            style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)' }}>
            <span className="font-semibold" style={{ color: 'var(--neon-green)', fontFamily: 'Rajdhani, sans-serif' }}>
              💰 ₹{job.salary.min}L – ₹{job.salary.max}L per annum
            </span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card scroll-reveal-left">
            <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--neon-blue)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>JOB DESCRIPTION</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>{job.description}</p>
          </div>
          {job.requirements && (
            <div className="card scroll-reveal-left delay-100">
              <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--neon-purple)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>REQUIREMENTS</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>{job.requirements}</p>
            </div>
          )}
          {job.rounds?.length > 0 && (
            <div className="card scroll-reveal-left delay-200">
              <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--neon-orange)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>SELECTION PROCESS</h2>
              <div className="flex flex-wrap gap-2">
                {job.rounds.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                    style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: 'var(--neon-blue)', fontFamily: 'Rajdhani, sans-serif' }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'var(--neon-blue)', color: '#000' }}>{i + 1}</span>
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card scroll-reveal-right">
            <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--neon-cyan)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>ELIGIBILITY</h2>
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
              {job.eligibility.minCGPA > 0 && <div>Min CGPA: <strong style={{ color: 'var(--neon-green)' }}>{job.eligibility.minCGPA}</strong></div>}
              {job.eligibility.minPercentage > 0 && <div>Min %: <strong style={{ color: 'var(--neon-green)' }}>{job.eligibility.minPercentage}%</strong></div>}
              {job.eligibility.allowedCourses?.length > 0 && <div>Courses: <strong style={{ color: 'var(--text-primary)' }}>{job.eligibility.allowedCourses.join(', ')}</strong></div>}
              {job.eligibility.allowedBranches?.length > 0 && <div>Branches: <strong style={{ color: 'var(--text-primary)' }}>{job.eligibility.allowedBranches.join(', ')}</strong></div>}
            </div>
          </div>

          {job.skills?.length > 0 && (
            <div className="card scroll-reveal-right delay-100">
              <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--neon-purple)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>REQUIRED SKILLS</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map(s => <span key={s} className="badge badge-not-done text-xs">{s}</span>)}
              </div>
            </div>
          )}

          {job.driveDate && (
            <div className="card scroll-reveal-right delay-200">
              <h2 className="font-bold text-sm mb-1" style={{ color: 'var(--neon-orange)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>DRIVE DATE</h2>
              <p className="font-semibold" style={{ color: 'var(--neon-orange)', fontFamily: 'JetBrains Mono, monospace' }}>{new Date(job.driveDate).toLocaleDateString('en-IN')}</p>
            </div>
          )}

          <div className="card scroll-reveal-right delay-300">
            {applied ? (
              <div className="flex items-center gap-2 justify-center py-2 font-semibold" style={{ color: 'var(--neon-green)', fontFamily: 'Rajdhani, sans-serif' }}>
                <CheckCircle size={18} /> Applied Successfully!
              </div>
            ) : job.status !== 'Open' || isExpired ? (
              <div className="text-center py-2 font-semibold" style={{ color: 'var(--neon-pink)', fontFamily: 'Rajdhani, sans-serif' }}>Applications Closed</div>
            ) : showForm ? (
              <div className="space-y-3">
                <label className="label">Cover Letter (optional)</label>
                <textarea className="input" rows={4} placeholder="Write a short note..." value={coverLetter} onChange={e => setCoverLetter(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                  <button onClick={handleApply} disabled={applying} className="btn-primary flex-1 text-sm">{applying ? 'Applying...' : 'Submit'}</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowForm(true)} className="btn-primary w-full py-3">Apply Now</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
