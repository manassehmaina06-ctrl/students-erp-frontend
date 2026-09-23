import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PublicNavbar from '../components/PublicNavbar';

export default function StudentLogin() {
  const navigate = useNavigate();
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
      // Portal home — the JWT is now set
      window.location.href = '/portal';
    } catch (err) {
      setError(err.response?.data?.message || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <form
          onSubmit={handleSubmit}
          className="bg-white text-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🎓</div>
            <h1 className="text-2xl font-bold">Student Portal Login</h1>
            <p className="text-sm text-gray-500 mt-1">
              Sign in with your Student Number and ID Number
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
              {error}
            </div>
          )}

          <label className="block mb-3">
            <span className="text-sm text-gray-600">Student Number</span>
            <input
              type="text"
              required
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value.toUpperCase())}
              placeholder="STU-2026-00002"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="block mb-5">
            <span className="text-sm text-gray-600">ID Number</span>
            <input
              type="password"
              required
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="Your national ID / birth certificate number"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg"
          >
            {busy ? 'Signing in…' : 'Sign in to Portal'}
          </button>

          <p className="text-center text-xs text-gray-500 mt-5">
            Not enrolled yet?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Track your application
            </Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-2">
            Applying for the first time?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}