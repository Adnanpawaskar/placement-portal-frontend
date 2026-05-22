import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuthLogin } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      toast.error(error);
      navigate('/login', { replace: true });
      return;
    }

    if (!token) {
      toast.error('OAuth login did not return a session');
      navigate('/login', { replace: true });
      return;
    }

    completeOAuthLogin(token)
      .then(user => {
        toast.success(`Welcome, ${user.name}!`);
        const target = user.role === 'admin' ? '/admin' : user.role === 'recruiter' ? '/recruiter' : '/student';
        navigate(target, { replace: true });
      })
      .catch(err => {
        toast.error(err.response?.data?.message || 'OAuth login failed');
        navigate('/login', { replace: true });
      });
  }, [completeOAuthLogin, navigate, params]);

  return (
    <div className="min-h-screen flex items-center justify-center cyber-grid" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--neon-blue)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>Completing secure login...</p>
      </div>
    </div>
  );
}
