import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
    const [searchParams] = useSearchParams();
  const roleHint = searchParams.get('role');   // 'staff' | 'student' | null
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
      else                                  navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
               <Link to="/" className="text-xs text-gray-400 hover:text-gray-700 mb-4 inline-block">
          ← Back to home
        </Link> 
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎓</div>
              <h1 className="text-2xl font-bold text-gray-800">
  {roleHint === 'staff' ? 'Staff Sign In' : 'Applicant Sign In'}
</h1>
<p className="text-sm text-gray-500">
  {roleHint === 'staff'
    ? 'Staff & admin access'
    : 'Track your application'}
</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
            {error}
          </div>
        )}

        <label className="block mb-3">
          <span className="text-sm text-gray-600">Email</span>
          <input
            type="email" required value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="block mb-5">
          <span className="text-sm text-gray-600">Password</span>
          <input
            type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <button
          type="submit" disabled={busy}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
                      <p className="text-center text-sm text-gray-500 mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
            Create one
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
          Already enrolled?{' '}
          <Link to="/student-login" className="text-blue-600 hover:text-blue-800 font-medium">
            Sign in to Student Portal →
          </Link>
        </p>
      </form>
    </div>
  );
}
