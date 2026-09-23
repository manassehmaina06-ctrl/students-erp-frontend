import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function LmsDashboard() {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/lms/me/dashboard')
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (error)   return <div className="p-8 text-red-600">{error}</div>;

  const s = data?.student || {};

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {s.name?.split(' ')[0] || 'Student'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {s.studentNumber} · {s.programme ? `${s.programme.name} (${s.programme.code})` : 'No programme'}
          {s.semester && <> · Semester <span className="font-medium text-slate-700">{s.semester}</span></>}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/lms/courses')}
          className="text-left bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500 hover:shadow-md transition"
        >
          <p className="text-xs text-slate-500 uppercase tracking-wide">My Courses</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{data.coursesCount}</p>
          <p className="text-xs text-blue-600 mt-2">View courses →</p>
        </button>

        <button
          onClick={() => navigate('/lms/timetable')}
          className="text-left bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-500 hover:shadow-md transition"
        >
          <p className="text-xs text-slate-500 uppercase tracking-wide">Today's Classes</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{data.todayClasses?.length || 0}</p>
          <p className="text-xs text-slate-400 mt-2">Coming in Phase H</p>
        </button>

        <button
          onClick={() => navigate('/lms/assignments')}
          className="text-left bg-white rounded-xl shadow-sm p-5 border-l-4 border-amber-500 hover:shadow-md transition"
        >
          <p className="text-xs text-slate-500 uppercase tracking-wide">Upcoming Deadlines</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{data.upcomingDeadlines?.length || 0}</p>
          <p className="text-xs text-slate-400 mt-2">Coming in Phase I</p>
        </button>

        <button
          onClick={() => navigate('/lms/announcements')}
          className="text-left bg-white rounded-xl shadow-sm p-5 border-l-4 border-emerald-500 hover:shadow-md transition"
        >
          <p className="text-xs text-slate-500 uppercase tracking-wide">Announcements</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{data.recentAnnouncements?.length || 0}</p>
          <p className="text-xs text-slate-400 mt-2">Coming in Phase J</p>
        </button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-3">📖 Continue Learning</h3>
          <p className="text-sm text-slate-500 mb-4">
            Open a course to access materials, assignments, and grades.
          </p>
          <button
            onClick={() => navigate('/lms/courses')}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Go to My Courses
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-3">📅 This Week</h3>
          <p className="text-sm text-slate-500 mb-4">
            Your timetable and class venues will appear here once Academic sets them up.
          </p>
          <button
            onClick={() => navigate('/lms/timetable')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm"
          >
            View Timetable
          </button>
        </div>
      </div>
    </div>
  );
}