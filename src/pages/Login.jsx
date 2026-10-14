import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleHint = searchParams.get('role'); // 'staff' | 'student' | null

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const [busy, setBusy]             = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(identifier, password);
      if (user.role === 'student')         navigate('/tracking');
      else if (user.role === 'finance')    navigate('/erp/finance');
      else if (user.role === 'admissions') navigate('/erp/admissions');
      else if (user.role === 'academic')   navigate('/erp/academic');
      else if (user.role === 'lecturer')   navigate('/erp/lecturer');
      else                                 navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-amber-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Top actions row */}
        <div className="w-full max-w-sm flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 px-3 py-1.5 rounded-lg transition"
          >
            ← Home
          </Link>
          <Link
            to="/lms"
            className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 px-3 py-1.5 rounded-lg transition"
          >
            Dashboard →
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl shadow-lg mb-3">
              🔒
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              {roleHint === 'staff' ? 'Staff Sign In' : 'Applicant Sign In'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {roleHint === 'staff' ? 'Staff & admin access' : 'Track your application'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-lg p-3 text-sm mb-4">
              {error}
            </div>
          )}

          <label className="block mb-4">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Email</span>
            <input
              type="email" required value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="mt-1 w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>

          <label className="block mb-6">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Password</span>
            <PasswordInput
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-1"
            />
          </label>

          <button
            type="submit" disabled={busy}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
