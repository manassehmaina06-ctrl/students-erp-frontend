import { useEffect, useState } from 'react';
import api from '../api/axios';

const DAYS = [
  { value: 'mon', label: 'Monday',    short: 'Mon' },
  { value: 'tue', label: 'Tuesday',   short: 'Tue' },
  { value: 'wed', label: 'Wednesday', short: 'Wed' },
  { value: 'thu', label: 'Thursday',  short: 'Thu' },
  { value: 'fri', label: 'Friday',    short: 'Fri' },
  { value: 'sat', label: 'Saturday',  short: 'Sat' },
];

// Palette by unit code — stable colors so the same course always renders the same
const PALETTE = [
  'bg-blue-100 text-blue-900 border-blue-300',
  'bg-emerald-100 text-emerald-900 border-emerald-300',
  'bg-amber-100 text-amber-900 border-amber-300',
  'bg-purple-100 text-purple-900 border-purple-300',
  'bg-pink-100 text-pink-900 border-pink-300',
  'bg-teal-100 text-teal-900 border-teal-300',
  'bg-indigo-100 text-indigo-900 border-indigo-300',
  'bg-rose-100 text-rose-900 border-rose-300',
];

function colorForUnit(code, unitMap) {
  if (!unitMap[code]) unitMap[code] = Object.keys(unitMap).length % PALETTE.length;
  return PALETTE[unitMap[code]];
}

// "08:00" → "8:00 AM"
function fmt12(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Build a sorted set of unique hour slots across all classes (e.g. [480, 540, 600])
function buildTimeRows(slots) {
  const set = new Set();
  for (const s of slots) {
    const start = parseInt(s.startTime.split(':')[0], 10) * 60 + parseInt(s.startTime.split(':')[1], 10);
    set.add(start);
  }
  return [...set].sort((a, b) => a - b);
}

export default function LmsTimetable() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [view, setView]       = useState('grid'); // 'grid' | 'list'

  useEffect(() => {
    api.get('/lms/me/timetable')
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (error)   return <div className="p-8 text-red-600">{error}</div>;

  const slots = data?.slots || [];

  if (slots.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">No Timetable Yet</h1>
          <p className="text-sm text-slate-500">
            Your weekly schedule will appear here once Academic assigns classes for your units.
          </p>
        </div>
      </div>
    );
  }

  const unitMap = {};
  const timeRows = buildTimeRows(slots);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">📅 Timetable</h1>
          <p className="text-sm text-slate-500 mt-1">
            Semester {data.semester} · {slots.length} class{slots.length === 1 ? '' : 'es'} per week
          </p>
        </div>
        <div className="flex gap-1 bg-white rounded-lg shadow-sm p-1">
          <button
            onClick={() => setView('grid')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              view === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >Grid</button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              view === 'list' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >List</button>
        </div>
      </div>

      {/* ============ GRID VIEW ============ */}
      {view === 'grid' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="px-3 py-3 text-left w-24">Time</th>
                  {DAYS.map((d) => (
                    <th key={d.value} className="px-3 py-3 text-left">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeRows.map((time) => {
                  const hour = String(Math.floor(time / 60)).padStart(2, '0');
                  const min  = String(time % 60).padStart(2, '0');
                  const hhmm = `${hour}:${min}`;
                  return (
                    <tr key={time} className="border-t border-slate-100">
                      <td className="px-3 py-3 align-top text-xs text-slate-500 font-mono">
                        {fmt12(hhmm)}
                      </td>
                      {DAYS.map((d) => {
                        const cellSlots = slots.filter(
                          (s) => s.day === d.value && s.startTime.startsWith(hour)
                        );
                        return (
                          <td key={d.value} className="px-1.5 py-1.5 align-top border-l border-slate-100">
                            <div className="space-y-1">
                              {cellSlots.map((s) => (
                                <div
                                  key={s._id}
                                  className={`rounded-lg border px-2 py-1.5 text-[11px] leading-tight ${colorForUnit(s.unit?.code || '?', unitMap)}`}
                                >
                                  <div className="font-bold">{s.unit?.code}</div>
                                  <div className="truncate">{s.unit?.name}</div>
                                  <div className="text-[10px] opacity-80">
                                    {s.startTime}–{s.endTime}
                                    {s.room && <> · {s.room}</>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ LIST VIEW ============ */}
      {view === 'list' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Lecturer</th>
              </tr>
            </thead>
            <tbody>
              {[...slots]
                .sort((a, b) => {
                  const order = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };
                  return (order[a.day] - order[b.day]) || a.startTime.localeCompare(b.startTime);
                })
                .map((s) => (
                  <tr key={s._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800 capitalize">{s.day}</td>
                    <td className="px-4 py-3 text-slate-700">{s.startTime} – {s.endTime}</td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-slate-500">{s.unit?.code}</div>
                      <div className="text-slate-800">{s.unit?.name}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.room || '—'}
                      {s.building && <div className="text-xs text-slate-400">{s.building}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{s.lecturer?.email || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}