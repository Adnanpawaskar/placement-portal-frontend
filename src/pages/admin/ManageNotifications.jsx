import { useEffect, useState, useRef } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Bell, Send, Users, BookOpen, Briefcase, GraduationCap, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import useScrollReveal from '../../hooks/useScrollReveal';

const TYPES = ['General', 'Job Alert', 'Internship Alert', 'Interview', 'Reminder', 'Result'];
const COURSES = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'BBA', 'MBA', 'B.Sc', 'M.Sc'];

const typeBadgeClass = {
  'Job Alert': 'badge-job',
  'Internship Alert': 'badge-internship',
  'Interview': 'badge-interview',
  'Reminder': 'badge-reminder',
  'General': 'badge-general',
  'Result': 'badge-result',
};

const typeIcon = {
  'Job Alert': '💼',
  'Internship Alert': '🎓',
  'Interview': '🎙️',
  'Reminder': '⏰',
  'General': '📢',
  'Result': '🏆',
};

const emptyForm = { title: '', message: '', type: 'General', targetAll: true, targetCourses: [] };

export default function ManageNotifications() {
  useScrollReveal();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchNotifications = () => {
    setLoading(true);
    api.get('/notifications').then(res => setNotifications(res.data.notifications)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { fetchNotifications(); }, []);

  const openCreate = (preset = {}) => {
    setEditingId(null);
    setForm({ ...emptyForm, ...preset });
    setShowModal(true);
  };

  const openEdit = (n) => {
    setEditingId(n._id);
    setForm({
      title: n.title,
      message: n.message,
      type: n.type,
      targetAll: n.targetAll,
      targetCourses: n.targetCourses?.length ? n.targetCourses : n.targetCourse ? [n.targetCourse] : []
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setForm(emptyForm); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSending(true);
    try {
      if (editingId) {
        await api.put(`/notifications/${editingId}`, { title: form.title, message: form.message, type: form.type });
        toast.success('Notification updated!');
      } else {
        const payload = { ...form, targetCourses: form.targetCourses || [] };
        if (payload.targetCourses.length) {
          payload.targetAll = false;
          payload.targetCourse = payload.targetCourses[0];
        }
        const res = await api.post('/notifications', payload);
        const delivery = res.data.delivery;
        const whatsappInfo = delivery ? ` WhatsApp sent: ${delivery.whatsappSent || 0}.` : '';
        toast.success(`Notification sent via app, email & WhatsApp!${whatsappInfo}`);
      }
      closeModal();
      fetchNotifications();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSending(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.delete(`/notifications/${deleteConfirm._id}`);
      toast.success('Notification deleted');
      setDeleteConfirm(null);
      fetchNotifications();
    } catch (err) { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const toggleTargetCourse = (course) => {
    setForm(p => {
      const current = p.targetCourses || [];
      const targetCourses = current.includes(course)
        ? current.filter(c => c !== course)
        : [...current, course];
      return { ...p, targetCourses, targetAll: targetCourses.length === 0 };
    });
  };

  const templates = [
    { icon: <Briefcase size={18} />, label: 'Job Announcement', type: 'Job Alert', title: 'New Job Opportunity', message: 'A new job opportunity has been posted on the portal. Log in to view details and apply.', color: 'var(--neon-blue)' },
    { icon: <GraduationCap size={18} />, label: 'Internship Alert', type: 'Internship Alert', title: 'Internship Opportunity', message: 'A new internship has been posted for your course. Log in to apply now.', color: 'var(--neon-purple)' },
    { icon: <Bell size={18} />, label: 'General Broadcast', type: 'General', title: '', message: '', color: 'var(--text-secondary)' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between scroll-reveal">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--neon-blue)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
            NOTIFICATIONS
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>
            Send · Update · Delete — via App, Email & WhatsApp
          </p>
        </div>
        <button onClick={() => openCreate()} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Send New
        </button>
      </div>

      {/* Quick templates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((t, i) => (
          <button key={t.label}
            onClick={() => openCreate({ type: t.type, title: t.title, message: t.message })}
            className={`scroll-reveal delay-${(i + 1) * 100} flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-300`}
            style={{ background: 'var(--bg-card)', border: `1px solid var(--border-glow)`, color: t.color }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid currentColor`, opacity: 0.9 }}>
              {t.icon}
            </div>
            <span className="font-semibold text-sm" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em' }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 scroll-reveal delay-200">
        {[
          { label: 'Total Sent', val: notifications.length, color: 'var(--neon-blue)' },
          { label: 'This Month', val: notifications.filter(n => new Date(n.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length, color: 'var(--neon-purple)' },
          { label: 'Job Alerts', val: notifications.filter(n => n.type === 'Job Alert').length, color: 'var(--neon-green)' },
        ].map(s => (
          <div key={s.label} className="card py-3 text-center">
            <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'Orbitron, sans-serif' }}>{s.val}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3" style={{ borderColor: 'var(--neon-blue)' }} />
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>No notifications yet</div>
        ) : notifications.map((n, idx) => (
          <div key={n._id}
            className={`card scroll-reveal delay-${Math.min(idx * 100, 400)} flex items-start gap-4`}
            style={{ borderColor: 'var(--border-glow)' }}>
            {/* Icon */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid var(--border-glow)' }}>
              {typeIcon[n.type] || '📢'}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.03em', fontSize: '0.95rem' }}>{n.title}</span>
                <span className={`badge text-xs ${typeBadgeClass[n.type] || 'badge-general'}`}>{n.type}</span>
                {(n.targetCourses?.length ? n.targetCourses : n.targetCourse ? [n.targetCourse] : []).map(course => (
                  <span key={course} className="badge badge-internship text-xs">📚 {course}</span>
                ))}
                {n.targetAll && <span className="badge badge-placed text-xs">All Students</span>}
              </div>
              <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>{n.message}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                {n.sentBy?.name || 'Admin'} · {new Date(n.createdAt).toLocaleString('en-IN')} · {n.recipients?.length || 0} recipients
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => openEdit(n)}
                title="Edit notification"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid var(--border-glow)', color: 'var(--neon-blue)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 12px rgba(0,212,255,0.4)'; e.currentTarget.style.borderColor = 'var(--neon-blue)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border-glow)'; }}>
                <Pencil size={13} />
              </button>
              <button
                onClick={() => setDeleteConfirm(n)}
                title="Delete notification"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                style={{ background: 'rgba(255,45,154,0.08)', border: '1px solid var(--border-glow)', color: 'var(--neon-pink)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 12px rgba(255,45,154,0.4)'; e.currentTarget.style.borderColor = 'var(--neon-pink)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border-glow)'; }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Send / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
          <div className="modal-card w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-glow)' }}>
              <h3 className="font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--neon-blue)', fontSize: '0.9rem', letterSpacing: '0.08em' }}>
                {editingId ? '✏️ EDIT NOTIFICATION' : '📢 SEND NOTIFICATION'}
              </h3>
              <button onClick={closeModal} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Title *</label>
                <input className="input" placeholder="Notification title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Message *</label>
                <textarea className="input" rows={4} placeholder="Write your message here..." value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required />
              </div>

              {!editingId && (
                <div>
                  <label className="label">Target Audience</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
                      <input type="radio" checked={form.targetAll && (form.targetCourses || []).length === 0} onChange={() => setForm(p => ({ ...p, targetAll: true, targetCourses: [] }))} style={{ accentColor: 'var(--neon-blue)' }} />
                      <Users size={14} /> All Students
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
                      <input type="radio" checked={(form.targetCourses || []).length > 0} onChange={() => setForm(p => ({ ...p, targetAll: false, targetCourses: ['B.Tech'] }))} style={{ accentColor: 'var(--neon-blue)' }} />
                      <BookOpen size={14} /> Specific Course(s)
                    </label>
                    {(form.targetCourses || []).length > 0 && (
                      <div className="ml-5 grid grid-cols-2 gap-2 pt-1">
                        {COURSES.map(course => (
                          <label key={course} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg"
                            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-glow)', background: (form.targetCourses || []).includes(course) ? 'rgba(0,212,255,0.08)' : 'transparent' }}>
                            <input type="checkbox" checked={(form.targetCourses || []).includes(course)} onChange={() => toggleTargetCourse(course)} style={{ accentColor: 'var(--neon-blue)' }} />
                            <span className="text-sm">{course}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!editingId && (
                <div className="flex items-center gap-2 text-xs p-3 rounded-lg"
                  style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
                  <span>📧</span> Also sent via <strong style={{ color: 'var(--neon-blue)' }}>Email</strong> and <strong style={{ color: 'var(--neon-green)' }}>WhatsApp</strong>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={sending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {editingId ? <Pencil size={14} /> : <Send size={14} />}
                  {sending ? (editingId ? 'Updating...' : 'Sending...') : (editingId ? 'Update' : 'Send')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
          <div className="modal-card w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(255,45,154,0.1)', border: '1px solid var(--neon-pink)', boxShadow: '0 0 20px rgba(255,45,154,0.3)' }}>
              <AlertTriangle size={24} style={{ color: 'var(--neon-pink)' }} />
            </div>
            <h3 className="font-bold mb-2" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--text-primary)', fontSize: '0.85rem', letterSpacing: '0.08em' }}>DELETE NOTIFICATION</h3>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
              Are you sure you want to delete:
            </p>
            <p className="font-semibold mb-6" style={{ color: 'var(--neon-pink)', fontFamily: 'Rajdhani, sans-serif' }}>"{deleteConfirm.title}"</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1 flex items-center justify-center gap-2">
                <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
