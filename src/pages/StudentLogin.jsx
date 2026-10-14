import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PublicNavbar from '../components/PublicNavbar';
import { PasswordInput } from '../components/ui';

export default function StudentLogin() {
  const navigate = useNavigate();
  const [studentNumber, setStudentNumber] = useState('');
  const [idNumber, setIdNumber]           = useState('');
  const [error, setError]                 = useState('');
  const [busy, setBusy]                   = useState(false);
  const [chooserOpen, setChooserOpen]     = useState(false);
  const [student, setStudent]             = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/student-login', {
        studentNumber: studentNumber.trim(),
        idNumber: idNumber.trim(),
      });

      // If the backend says the account is not enrolled, don't create a session.
      if (!data.enrolled) {
        setError(
          'Your account is not yet enrolled. Please wait until your application is approved, ' +
          'or track your application below.'
        );
        setBusy(false);
        return;
      }

      localStorage.setItem('token', data.token);
      setStudent(data);
      setChooserOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  const go = (path) => {
    // Full reload so AuthContext re-reads the token
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-violet-600/20 rounded-full blur-3xl" />
      </div>

      <PublicNavbar />

      <div className="relative flex-1 flex items-center justify-center px-4 py-12">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-2xl shadow-lg mb-3">
              🎓
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              Student Login
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sign in with your Student Number and ID Number
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-lg p-3 text-sm mb-4">
              {error}
              <Link to="/tracking" className="block mt-2 text-xs font-medium hover:underline">
                → Track your application
              </Link>
            </div>
          )}

          <label className="block mb-4">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Student Number</span>
            <input
              type="text"
              required
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value.toUpperCase())}
              placeholder="STU-2026-00002"
              autoComplete="username"
              className="mt-1 w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>

          <label className="block mb-6">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">ID Number</span>
            <PasswordInput
              required
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="Your national ID / birth certificate number"
              autoComplete="current-password"
              className="mt-1"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-5">
            Not enrolled yet?{' '}
            <Link to="/tracking" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
              Track your application
            </Link>
          </p>
          <p className="text-center text-xs text-slate-400 mt-2">
            Applying for the first time?{' '}
            <Link to="/register" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </form>
      </div>

      {/* Destination chooser modal */}
      {chooserOpen && student && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">👋</div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                Welcome back{student.username ? ', ' + student.username : ''}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Where would you like to go?
              </p>
            </div>

            <div className="space-y-3">
              <DestinationCard
                icon="📚"
                title="LMS"
                text="Courses, assignments, quizzes, materials, and announcements."
                accent="from-brand-500 to-violet-600"
                onClick={() => go('/lms')}
              />

              <DestinationCard
                icon="💰"
                title="Student Portal"
                text="Fees, registration, and clearance."
                accent="from-emerald-500 to-emerald-700"
                onClick={() => go('/portal')}
              />

              <DestinationCard
                icon="📄"
                title="Track Application"
                text="See the current status of your application."
                accent="from-amber-400 to-amber-600"
                onClick={() => go('/tracking')}
              />
            </div>

            <button
              onClick={() => setChooserOpen(false)}
              className="w-full mt-4 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DestinationCard({ icon, title, text, accent, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 rounded-xl p-4 transition-all hover:-translate-y-0.5 flex items-start gap-3 group"
    >
      <div className={'w-11 h-11 rounded-lg bg-gradient-to-br flex items-center justify-center text-lg shadow-md shrink-0 ' + accent}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {text}
        </p>
      </div>
      <span className="text-slate-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all self-center">
        →
      </span>
    </button>
  );
}
