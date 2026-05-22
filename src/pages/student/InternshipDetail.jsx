import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CheckCircle, ChevronLeft, Clock, GraduationCap, MapPin, Users } from 'lucide-react';

export default function InternshipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/internships/${id}`), api.get('/internships/my-applications')])
      .then(([internshipRes, appRes]) => {
        setInternship(internshipRes.data.internship);
        setApplied((appRes.data.applications || []).some(app => app.internship?._id === id || app.internship === id));
      })
      .catch(() => {
        toast.error('Internship not found');
        navigate('/student/internships');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.post(`/internships/${id}/apply`);
      setApplied(true);
      setInternship(prev => prev ? { ...prev, applicantsCount: (prev.applicantsCount || 0) + 1 } : prev);
      toast.success('Internship application submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--neon-purple)' }} />
    </div>
  );
  if (!internship) return null;

  const isExpired = new Date(internship.applicationDeadline) < new Date();

  return (
    <div className="max-w-3xl animate-fadeIn">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm mb-6 transition-colors" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>
        <ChevronLeft size={17} /> Back to Internships
      </button>

      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(176,64,255,0.10)', border: '1px solid var(--neon-purple)', color: 'var(--neon-purple)' }}>
            <GraduationCap size={26} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold mb-0.5" style={{ color: 'var(--text-primary)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.04em' }}>{internship.title}</h1>
            <p className="text-base mb-3" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>{internship.company}</p>
            <div className="flex flex-wrap gap-3 text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>
              <span className="flex items-center gap-1.5"><MapPin size={14} />{internship.location}</span>
              <span className="flex items-center gap-1.5"><Clock size={14} />{internship.duration}</span>
              <span className="flex items-center gap-1.5"><Users size={14} />{internship.applicantsCount || 0} applicants</span>
              <span style={{ color: isExpired ? 'var(--neon-pink)' : 'var(--text-muted)' }}>Deadline: {new Date(internship.applicationDeadline).toLocaleDateString('en-IN')}{isExpired && ' (Expired)'}</span>
            </div>
          </div>
        </div>
        {internship.stipend?.amount > 0 && (
          <div className="mt-4 p-3 inline-block rounded-xl" style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)' }}>
            <span className="font-semibold" style={{ color: 'var(--neon-green)', fontFamily: 'Rajdhani, sans-serif' }}>
              Rs. {internship.stipend.amount.toLocaleString('en-IN')}/{internship.stipend.period || 'month'}
            </span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--neon-purple)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>INTERNSHIP DESCRIPTION</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>{internship.description}</p>
          </div>
          {internship.requirements && (
            <div className="card">
              <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--neon-blue)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>REQUIREMENTS</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>{internship.requirements}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--neon-cyan)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}>ELIGIBILITY</h2>
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
              {internship.eligibility?.minCGPA > 0 && <div>Min CGPA: <strong style={{ color: 'var(--neon-green)' }}>{internship.eligibility.minCGPA}</strong></div>}
              {internship.eligibility?.allowedCourses?.length > 0 && <div>Courses: <strong style={{ color: 'var(--text-primary)' }}>{internship.eligibility.allowedCourses.join(', ')}</strong></div>}
              {internship.eligibility?.allowedBranches?.length > 0 && <div>Branches: <strong style={{ color: 'var(--text-primary)' }}>{internship.eligibility.allowedBranches.join(', ')}</strong></div>}
            </div>
          </div>
          <div className="card">
            {applied ? (
              <div className="flex items-center gap-2 justify-center py-2 font-semibold" style={{ color: 'var(--neon-green)', fontFamily: 'Rajdhani, sans-serif' }}>
                <CheckCircle size={18} /> Applied Successfully!
              </div>
            ) : internship.status !== 'Open' || isExpired ? (
              <div className="text-center py-2 font-semibold" style={{ color: 'var(--neon-pink)', fontFamily: 'Rajdhani, sans-serif' }}>Applications Closed</div>
            ) : (
              <button onClick={handleApply} disabled={applying} className="btn-primary w-full py-3">{applying ? 'Applying...' : 'Apply Now'}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
