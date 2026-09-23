import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function LmsCourses() {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/lms/me/courses')
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (error)   return <div className="p-8 text-red-600">{error}</div>;

  const courses = data?.courses || [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">📚 My Courses</h1>
          <p className="text-sm text-slate-500 mt-1">
            Semester {data.semester || '—'} {data.academicYear ? `· ${data.academicYear}` : ''}
          </p>
        </div>
        <div className="text-sm text-slate-500">
          {courses.length} course{courses.length === 1 ? '' : 's'}
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-slate-500">No courses registered for this semester.</p>
          <p className="text-xs text-slate-400 mt-2">
            Register for units from the Student Portal → Registration.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <button
              key={c.unit._id}
              onClick={() => navigate(`/lms/courses/${c.unit._id}`)}
              className="text-left bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition border-l-4 border-slate-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-xs text-slate-500">{c.unit.code}</p>
                  <h3 className="font-semibold text-slate-800 mt-0.5">{c.unit.name}</h3>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {c.unit.type}
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-3">
                {c.unit.credits} credits · Semester {c.unit.semester}
              </p>

              <div className="border-t border-slate-100 pt-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Lecturer</p>
                <p className="text-xs text-slate-700 mt-0.5">
                  {c.lecturer
                    ? (c.lecturer.schoolEmail || c.lecturer.email || c.lecturer.username || '—')
                    : <span className="text-slate-400 italic">Not assigned</span>}
                </p>
              </div>

              <p className="text-xs text-amber-600 font-medium mt-3">
                Open course →
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}