import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import EmptyState from '../components/EmptyState';

const PILL = {
  pending:   'bg-yellow-100 text-yellow-800',
  submitted: 'bg-blue-100 text-blue-800',
  graded:    'bg-green-100 text-green-800',
  overdue:   'bg-red-100 text-red-800',
};

export default function LmsAssignments() {
  const [data, setData]       = useState({ semester: null, assignments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('all'); // all | pending | submitted | graded

  useEffect(() => {
    api.get('/lms/me/assignments')
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  const list = (data.assignments || []).filter((a) => {
    if (filter === 'all') return true;
    return a.derivedStatus === filter;
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
        {data.semester && (
          <p className="text-sm text-gray-500 mt-1">Semester {data.semester}</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'pending', 'submitted', 'graded'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-8">Loading…</p>
      ) : list.length === 0 ? (
    <EmptyState
  icon="📝"
  title={filter === 'all' ? 'No assignments yet' : `No ${filter} assignments`}
  description={filter === 'all'
    ? 'Check back soon — your lecturers will post them here.'
    : 'Try a different filter.'}
/>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <Link
              key={a._id}
              to={`/lms/assignments/${a._id}`}
              className="block bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 p-4"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-purple-700 truncate">
  {a.unitId?.code} · {a.unitId?.name}
</p>
                  <h3 className="font-semibold text-gray-800 mt-1">{a.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Due {new Date(a.dueDate).toLocaleDateString()} · Max {a.maxScore}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${PILL[a.derivedStatus] || PILL.pending}`}
                  >
                    {a.derivedStatus}
                  </span>
                  <span className="text-gray-400 text-sm">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}