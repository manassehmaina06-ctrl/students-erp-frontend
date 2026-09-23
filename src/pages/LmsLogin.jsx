import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function LmsLogin() {
  const [studentNumber, setStudentNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/student-login', {
        studentNumber: studentNumber.trim(),
        idNumber: idNumber.trim(),
      });
      localStorage.setItem('token', data.token);
      // Land in the LMS
      window.location.href = '/lms';
    } catch (err) {
      setError(err.response?.data?.message || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold">Strathmore LMS</h1>
          <p className="text-sm text-slate-400 mt-1">Learning Management System</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-lg font-semibold mb-1">Sign in to continue</h2>
          <p className="text-xs text-slate-400 mb-5">
            Use your Student Number or School Email and ID Number
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-3 text-sm mb-4">
              {error}
            </div>
          )}

          <label className="block mb-3">
            <span className="text-sm text-slate-300">Student Number or School Email</span>
            <input
              type="text"
              required
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="STU-2026-00002 or stu-2026-00002@strathmore.edu"
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>

          <label className="block mb-5">
            <span className="text-sm text-slate-300">ID Number</span>
            <input
              type="password"
              required
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="Your national ID / birth certificate number"
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-900 font-semibold py-2.5 rounded-lg transition"
          >
            {busy ? 'Signing in…' : 'Sign in to LMS'}
          </button>

          <div className="text-center text-xs text-slate-400 mt-6 space-y-2">
            <p>
              Looking for the Student Portal (fees, clearance, registration)?{' '}
              <Link to="/student-login" className="text-amber-400 hover:text-amber-300 font-medium">
                Go to Student Portal →
              </Link>
            </p>
            <p>
              Not enrolled yet?{' '}
              <Link to="/login" className="text-slate-300 hover:text-white underline">
                Track your application
              </Link>
            </p>
          </div>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Same credentials as the Student Portal · Powered by Strathmore
        </p>
      </div>
    </div>
  );
}