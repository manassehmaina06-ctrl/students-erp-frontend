import { useEffect, useState } from 'react';
import api from '../api/axios';

const STATUS_PILL = {
  present:  'bg-green-100 text-green-800',
  absent:   'bg-red-100 text-red-800',
  late:     'bg-yellow-100 text-yellow-800',
  excused:  'bg-gray-100 text-gray-700',
  unmarked: 'bg-gray-50 text-gray-400',
};

const LABEL = {
  present:  'Present',
  absent:   'Absent',
  late:     'Late',
  excused:  'Excused',
  unmarked: 'Not marked',
};

export default function LmsAttendance() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    api.get('/units/me/attendance')
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleUnit = async (unitId) => {
    if (expanded === unitId) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(unitId);
    setDetail(null);
    setDetailLoading(true);
    try {
      const r = await api.get(`/units/me/attendance/${unitId}`);
      setDetail(r.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const barColor = (pct) => {
    if (pct === null) return 'bg-slate-300';
    if (pct >= 75) return 'bg-green-500';
    if (pct >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;

  if (!data?.units?.length) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-slate-500">No attendance data yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Once lecturers mark attendance, your percentages will show here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-sm text-slate-500">
          Semester <span className="font-medium text-slate-800">{data.semester}</span>
        </p>
      </div>

      {data.units.map((u) => {
        const pct = u.percentage;
        const isOpen = expanded === u.unit._id;
        return (
          <div key={u.unit._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => toggleUnit(u.unit._id)}
              className="w-full text-left p-5 hover:bg-slate-50 transition"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-500">{u.unit.code}</span>
                    <h3 className="font-semibold text-slate-800">{u.unit.name}</h3>
                    <span className="text-xs text-slate-400">{u.unit.credits} credits</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {u.attended} of {u.totalSessions} sessions attended
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${
                    pct === null ? 'text-slate-400'
                    : pct >= 75 ? 'text-green-600'
                    : pct >= 50 ? 'text-yellow-600'
                    : 'text-red-600'
                  }`}>
                    {pct === null ? '—' : `${pct}%`}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase">Attendance</p>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor(pct)} transition-all`}
                  style={{ width: `${pct || 0}%` }}
                />
              </div>
              <p className="text-xs text-amber-600 mt-3">
                {isOpen ? '▲ Hide sessions' : '▼ View sessions'}
              </p>
            </button>

            {isOpen && (
              <div className="border-t border-slate-100">
                {detailLoading ? (
                  <p className="p-6 text-center text-slate-400 text-sm">Loading sessions…</p>
                ) : !detail?.sessions?.length ? (
                  <p className="p-6 text-center text-slate-400 text-sm">No sessions recorded yet.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                      <tr>
                        <th className="px-5 py-2">Date</th>
                        <th className="px-5 py-2">Topic</th>
                        <th className="px-5 py-2 text-right">Your Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.sessions.map((s) => (
                        <tr key={s._id} className="border-t border-slate-100">
                          <td className="px-5 py-2 text-xs text-slate-500">
                            {new Date(s.date).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-2 text-slate-800">{s.topic || '—'}</td>
                          <td className="px-5 py-2 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_PILL[s.status] || 'bg-gray-100'}`}>
                              {LABEL[s.status] || s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}