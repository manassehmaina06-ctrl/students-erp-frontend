import { useEffect, useState } from 'react';
import api from '../api/axios';

const GRADE_COLORS = {
  A: 'bg-green-100 text-green-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-yellow-100 text-yellow-800',
  D: 'bg-orange-100 text-orange-800',
  E: 'bg-red-100 text-red-800',
};

const TYPE_LABEL = {
  assignment: 'Assignment',
  cat:        'CAT',
  exam:       'Exam',
  project:    'Project',
  practical:  'Practical',
};

export default function LmsResults() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/registrations/me/marks')
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (error)   return <div className="p-8 text-red-600">{error}</div>;

  if (!data?.units || data.units.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-slate-500">No results available yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Marks will appear here once your lecturers post them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-sm text-slate-500">
          Semester <span className="font-medium text-slate-800">{data.semester}</span>
        </p>
      </div>

      {data.units.map((u) => {
        const s = u.summary;
        const hasMarks = u.assessments.some((a) => a.score != null);
        return (
          <div key={u.unit._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-500">{u.unit.code}</span>
                  <h3 className="font-semibold text-slate-800">{u.unit.name}</h3>
                  <span className="text-xs text-slate-400">{u.unit.credits} credits</span>
                </div>
              </div>
              {hasMarks ? (
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${GRADE_COLORS[s.grade] || 'bg-gray-100'}`}>
                    Grade {s.grade}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">{s.final} / 100</p>
                </div>
              ) : (
                <span className="text-xs text-slate-400">No marks yet</span>
              )}
            </div>

            {!hasMarks ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                Marks have not been posted for this unit yet.
              </div>
            ) : (
              <>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-2">Assessment</th>
                      <th className="px-6 py-2">Type</th>
                      <th className="px-6 py-2">Weight</th>
                      <th className="px-6 py-2 text-right">Score</th>
                      <th className="px-6 py-2 text-right">Contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {u.assessments.map((a) => {
                      const pct = a.score != null ? (a.score / a.maxScore) * 100 : null;
                      const contribution = pct != null ? (pct * a.weight) / 100 : null;
                      return (
                        <tr key={a._id} className="border-t border-slate-100">
                          <td className="px-6 py-3 font-medium text-slate-800">{a.name}</td>
                          <td className="px-6 py-3 text-xs text-slate-500">{TYPE_LABEL[a.type] || a.type}</td>
                          <td className="px-6 py-3 text-xs text-slate-500">{a.weight}%</td>
                          <td className="px-6 py-3 text-right">
                            {a.score != null
                              ? <span className="font-medium text-slate-800">{a.score} / {a.maxScore}</span>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-6 py-3 text-right text-xs text-slate-600">
                            {contribution != null ? contribution.toFixed(2) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="bg-slate-50 px-6 py-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Coursework</p>
                    <p className="font-bold text-slate-800">{s.coursework}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Exam</p>
                    <p className="font-bold text-slate-800">{s.exam}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Final</p>
                    <p className="font-bold text-slate-800">{s.final}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}