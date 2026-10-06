import { useEffect, useState } from 'react';
import api from '../api/axios';
import EmptyState from '../components/EmptyState';

const PRIORITY = {
  normal:    { pill: 'bg-slate-100 text-slate-700',   bar: 'border-slate-300',  icon: '📢' },
  important: { pill: 'bg-amber-100 text-amber-800',   bar: 'border-amber-400',  icon: '⚠️' },
  urgent:    { pill: 'bg-red-100 text-red-800',       bar: 'border-red-500',    icon: '🚨' },
};

export default function LmsAnnouncements() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/lms/me/announcements')
      .then((r) => setItems(r.data.announcements || []))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500 text-center py-8">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📢 Announcements</h1>
        <p className="text-sm text-gray-500 mt-1">Updates from your lecturers</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          {error}
        </div>
      )}

      {items.length === 0 ? (
     <EmptyState
  icon="🔔"
  title="No announcements yet"
  description="You'll see updates from your units here."
/>
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const p = PRIORITY[a.priority] || PRIORITY.normal;
            return (
              <div
                key={a._id}
                className={`bg-white rounded-xl shadow-sm border-l-4 ${p.bar} p-4`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    {a.unit && (
                      <p className="text-xs font-mono text-purple-700 mb-1">
                        {a.unit.code} · {a.unit.name}
                      </p>
                    )}
                    <h3 className="font-semibold text-gray-800">{a.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.priority !== 'normal' && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${p.pill}`}>
                        {p.icon} {a.priority}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{a.body}</p>
                {a.attachmentUrl && (
                  <a
                    href={a.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
                  >
                    📎 {a.attachmentName || 'Attachment'}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
