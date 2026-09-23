import { useEffect, useState } from 'react';
import api from '../api/axios';

const CATEGORY_LABEL = {
  lecture_notes: 'Lecture Notes',
  past_papers:   'Past Papers',
  slides:        'Slides',
  reading_list:  'Reading List',
  other:         'Other',
};

const CATEGORY_ORDER = ['lecture_notes', 'slides', 'past_papers', 'reading_list', 'other'];

export default function LmsMaterials() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/units/me/resources')
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  const fmtBytes = (n) => {
    if (!n) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;

  if (!data?.units?.length) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-slate-500">No materials yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Once your lecturers upload notes, slides, or past papers, they'll appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-sm text-slate-500">
          Semester <span className="font-medium text-slate-800">{data.semester}</span>
        </p>
      </div>

      {data.units.map((u) => {
        const isOpen = expanded === u.unit._id;
        const total = u.resources.length;
        return (
          <div key={u.unit._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : u.unit._id)}
              className="w-full text-left p-5 hover:bg-slate-50 transition"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-500">{u.unit.code}</span>
                    <h3 className="font-semibold text-slate-800">{u.unit.name}</h3>
                    <span className="text-xs text-slate-400">{u.unit.credits} credits</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {total} {total === 1 ? 'resource' : 'resources'}
                  </p>
                </div>
                <span className="text-xs text-amber-600">
                  {isOpen ? '▲ Hide' : '▼ View'}
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-slate-100">
                {total === 0 ? (
                  <p className="p-6 text-center text-slate-400 text-sm">No materials uploaded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {[...u.resources]
                      .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category))
                      .map((r) => (
                        <div key={r._id} className="p-4 flex items-start gap-4">
                          <div className="text-2xl">📄</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                {CATEGORY_LABEL[r.category] || r.category}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {fmtBytes(r.fileSize)} · uploaded {new Date(r.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="font-medium text-sm text-slate-800">{r.title}</p>
                            {r.description && <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>}
                          </div>
                          <a
                            href={`http://localhost:5000${r.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg whitespace-nowrap"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}