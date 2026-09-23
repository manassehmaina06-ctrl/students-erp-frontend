import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const TABS = [
  { key: 'overview',     label: 'Overview',      icon: '📋' },
  { key: 'assignments',  label: 'Assignments',   icon: '📝' },
  { key: 'materials',    label: 'Materials',     icon: '📖' },
  { key: 'quizzes',      label: 'Quizzes',       icon: '🧪' },
  { key: 'attendance',   label: 'Attendance',    icon: '✅' },
  { key: 'marks',        label: 'Marks',         icon: '📊' },
];

export default function LmsCourseDetail() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/lms/me/courses')
      .then((r) => {
        const found = (r.data.courses || []).find((c) => c.unit._id === unitId);
        setCourse(found || null);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [unitId]);

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (error)   return <div className="p-8 text-red-600">{error}</div>;
  if (!course) return <div className="p-8 text-slate-500">Course not found.</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <button
        onClick={() => navigate('/lms/courses')}
        className="text-slate-500 hover:text-slate-800 text-sm"
      >
        ← Back to My Courses
      </button>

      {/* Course header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="font-mono text-xs text-slate-500">{course.unit.code}</p>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">{course.unit.name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {course.unit.credits} credits · Semester {course.unit.semester} ·{' '}
              <span className="capitalize">{course.unit.type}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Lecturer</p>
            <p className="text-sm text-slate-700 font-medium mt-0.5">
              {course.lecturer
                ? (course.lecturer.schoolEmail || course.lecturer.email || '—')
                : <span className="text-slate-400 italic">Not assigned</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              tab === t.key
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="mr-1.5">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-3">Course Overview</h2>
          <p className="text-sm text-slate-600">
            This course covers {course.unit.name}. Materials, assignments, quizzes, and other resources
            will appear in the tabs above as your lecturer adds them.
          </p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Code</p>
              <p className="font-mono text-slate-800">{course.unit.code}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Credits</p>
              <p className="text-slate-800">{course.unit.credits}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Type</p>
              <p className="text-slate-800 capitalize">{course.unit.type}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Semester</p>
              <p className="text-slate-800">{course.unit.semester}</p>
            </div>
          </div>
        </div>
      )}

      {tab !== 'overview' && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">{TABS.find((t) => t.key === tab)?.icon}</div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">
            {TABS.find((t) => t.key === tab)?.label}
          </h2>
          <p className="text-sm text-slate-500">
            Coming in a future phase.
          </p>
        </div>
      )}
    </div>
  );
}