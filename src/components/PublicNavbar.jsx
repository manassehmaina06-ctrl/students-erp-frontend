import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BRAND = 'Strathmore';

export default function PublicNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-slate-950/80 backdrop-blur border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white">
          <span className="text-2xl">🎓</span>
          <span className="font-semibold">{BRAND} University Portal</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className="px-3 py-1.5 text-sm text-slate-300 hover:text-white rounded-lg transition"
          >
            Home
          </Link>
          <Link
            to="/tracking"
            className="px-3 py-1.5 text-sm text-slate-300 hover:text-white transition rounded-lg"
          >
            Track Application
          </Link>
          <Link
            to="/register"
            className="px-3 py-1.5 text-sm text-slate-300 hover:text-white transition rounded-lg"
          >
            Apply
          </Link>
         <Link
  to="/student-login"
  className="px-3 py-1.5 text-sm text-slate-300 hover:text-white transition rounded-lg"
>
  Student Portal
</Link>
          <Link
            to="/lms-login"
            className="px-3 py-1.5 text-sm text-slate-300 hover:text-white transition rounded-lg"
          >
            LMS
          </Link>
          {user ? (
            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login?role=student"
              className="ml-2 px-3 py-1.5 text-sm bg-amber-400 hover:bg-amber-300 text-slate-900 font-medium rounded-lg"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}