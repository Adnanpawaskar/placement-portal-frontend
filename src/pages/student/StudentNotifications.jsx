import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Bell, CheckCheck } from 'lucide-react';
import useScrollReveal from '../../hooks/useScrollReveal';

const typeBadge = {
  'Job Alert':         'badge-job',
  'Internship Alert':  'badge-internship',
  'Interview':         'badge-interview',
  'Reminder':          'badge-reminder',
  'Result':            'badge-result',
  'General':           'badge-general',
};
const typeEmoji = { 'Job Alert':'💼','Internship Alert':'🎓','Interview':'🎙️','Reminder':'⏰','Result':'🏆','General':'📢' };

export default function StudentNotifications() {
  useScrollReveal();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications/my').then(res => setNotifications(res.data.notifications)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--neon-cyan)' }} />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between scroll-reveal">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--neon-cyan)', letterSpacing: '0.08em' }}>NOTIFICATIONS</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>Your alerts and updates</p>
        </div>
        {unreadCount > 0 && (
          <span className="badge badge-ongoing">{unreadCount} unread</span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
          <Bell size={48} className="mx-auto mb-3 opacity-30" />
          <p style={{ fontFamily: 'Rajdhani, sans-serif' }}>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <div key={n._id}
              className={`card scroll-reveal delay-${Math.min(i * 100, 400)} transition-all duration-300`}
              style={{ borderColor: !n.isRead ? 'rgba(0,255,245,0.2)' : 'var(--border-glow)', background: !n.isRead ? 'rgba(0,255,245,0.03)' : 'var(--bg-card)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 flex-1">
                  <div className="text-xl flex-shrink-0 mt-0.5">{typeEmoji[n.type] || '📢'}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`badge text-xs ${typeBadge[n.type] || 'badge-general'}`}>{n.type}</span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--neon-cyan)', boxShadow: '0 0 6px var(--neon-cyan)' }} />}
                    </div>
                    <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.03em' }}>{n.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>{n.message}</p>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                {!n.isRead && (
                  <button onClick={() => markRead(n._id)}
                    className="flex items-center gap-1 text-xs whitespace-nowrap font-semibold transition-all"
                    style={{ color: 'var(--neon-cyan)', fontFamily: 'Rajdhani, sans-serif' }}>
                    <CheckCheck size={14} /> Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
