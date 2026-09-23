import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const TYPE_ICON = {
  'payment.submitted':    '💳',
  'payment.confirmed':    '✅',
  'payment.rejected':     '⚠️',
  'billing.added':        '🧾',
  'semester.billed':      '📚',
  'application.admitted': '🎉',
  'application.rejected': '❌',
  'enrollment.complete':  '🎓',
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen]     = useState(false);
  const [items, setItems]   = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  // Poll unread count every 30s
  useEffect(() => {
    const fetchCount = () => {
      api.get('/notifications/unread-count')
        .then((r) => setUnread(r.data.count || 0))
        .catch(() => {});
    };
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const r = await api.get('/notifications');
        setItems(r.data || []);
      } catch { setItems([]); }
      setLoading(false);
    }
  };

  const openItem = async (n) => {
    if (!n.read) {
      try {
        await api.post(`/notifications/${n._id}/read`);
        setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
        setUnread((c) => Math.max(0, c - 1));
      } catch { /* ignore */ }
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    try {
      await api.post('/notifications/read-all');
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={toggle}
        className="relative p-2 rounded-lg hover:bg-white/10 transition"
        title="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-sm">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-blue-600 hover:text-blue-800">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-gray-400 text-center">Loading…</p>
            ) : items.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No notifications</p>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  onClick={() => openItem(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 flex gap-3 ${
                    !n.read ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <span className="text-lg shrink-0">{TYPE_ICON[n.type] || '🔔'}</span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm ${!n.read ? 'font-semibold' : ''} text-gray-800 truncate`}>
                      {n.title}
                    </div>
                    {n.body && <div className="text-xs text-gray-500 line-clamp-2">{n.body}</div>}
                    <div className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
