import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PublicNavbar from '../components/PublicNavbar';

const STATUS_COLORS = {
  submitted:         'bg-blue-100 text-blue-800',
  pending_approval:  'bg-yellow-100 text-yellow-800',
  approved:          'bg-indigo-100 text-indigo-800',
  finance_review:    'bg-orange-100 text-orange-800',
  payment_validated: 'bg-teal-100 text-teal-800',
  admitted:          'bg-green-100 text-green-800',
  enrolled:          'bg-purple-100 text-purple-800',
  rejected:          'bg-red-100 text-red-800',
};

const TIMELINE_ORDER = [
  'submitted',
  'pending_approval',
  'approved',
  'finance_review',
  'payment_validated',
  'admitted',
  'enrolled',
];

const label = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function TrackingDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/applications/me/all')
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  const activeApp = data?.applications?.find((a) => a.isActive);
  const pastApps  = (data?.applications || []).filter((a) => !a.isActive);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col">
        <PublicNavbar />
        <div className="flex-1 flex items-center justify-center text-slate-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 Track Your Application</h1>
          {data?.studentNumber && (
            <p className="text-sm text-gray-500 mt-1">
              Signed in as <span className="font-medium">{user?.email}</span>
              {data.studentNumber && <> · Student # <span className="font-mono text-purple-700">{data.studentNumber}</span></>}
            </p>
          )}
        </div>

        {/* Directive banner — for enrolled students */}
        {data?.enrolled && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl">🎓</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">
                You are now enrolled as a student
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Enrolled students must access the Student Portal using their{' '}
                <strong>Student Number</strong> and <strong>ID Number</strong>.
              </p>
              <Link
                to="/student-login"
                className="inline-block mt-3 bg-blue-700 hover:bg-blue-800 text-white text-sm px-4 py-2 rounded-lg"
              >
                Go to Student Portal Login →
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
        )}

        {/* No application yet */}
        {data?.applications?.length === 0 && (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="text-5xl mb-3">📝</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">You haven't submitted an application yet</h2>
            <p className="text-sm text-gray-500 mb-6">
              Start your Strathmore application — it takes just a few minutes.
            </p>
            <button
              onClick={() => navigate('/apply')}
              className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold px-6 py-3 rounded-lg"
            >
              Start Application
            </button>
          </div>
        )}

        {/* Active application */}
        {activeApp && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {activeApp.programme?.name || 'Application'}
                  </h2>
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {activeApp.applicationNumber}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Submitted {activeApp.submittedAt ? new Date(activeApp.submittedAt).toLocaleDateString() : '—'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[activeApp.status] || 'bg-gray-100'}`}>
                {label(activeApp.status)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="px-6 pt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{activeApp.progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                  style={{ width: `${activeApp.progress}%` }}
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="px-6 py-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h3>
              <ol className="space-y-2">
                {TIMELINE_ORDER.map((step) => {
                  const done = activeApp.statusHistory?.find((h) => h.status === step);
                  return (
                    <li key={step} className="flex items-start gap-3 text-sm">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {done ? '✓' : '·'}
                      </span>
                      <div className="flex-1">
                        <p className={done ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                          {label(step)}
                        </p>
                        {done?.at && (
                          <p className="text-xs text-gray-400">
                            {new Date(done.at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {!activeApp && (
              <button
                onClick={() => navigate('/apply')}
                className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Start Application
              </button>
            )}
            {data?.enrolled && (
              <Link
                to="/student-login"
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm"
              >
                🎓 Student Portal
              </Link>
            )}
            <a
              href="mailto:admissions@strathmore.edu"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm"
            >
              ✉️ Contact Support
            </a>
          </div>
        </div>

        {/* Past applications */}
        {pastApps.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Application History</h3>
            <ul className="divide-y divide-gray-100">
              {pastApps.map((a) => (
                <li key={a._id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {a.programme?.name || 'Application'}
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="font-mono">{a.applicationNumber}</span>
                      {' · '}
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[a.status] || 'bg-gray-100'}`}>
                    {label(a.status)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}