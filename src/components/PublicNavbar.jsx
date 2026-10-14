import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function PublicNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="relative z-40 bg-slate-950/80 backdrop-blur border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 text-white shrink-0">
          <span className="text-2xl">🎓</span>
          <span className="font-semibold text-sm sm:text-base">
            Strathmore University Portal
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className="px-3 py-1.5 text-sm text-slate-300 hover:text-white rounded-lg transition">
              Home
            </Link>
            <Link to="/tracking" className="px-3 py-1.5 text-sm text-slate-300 hover:text-white rounded-lg transition">
              Track Application
            </Link>
            <Link to="/register" className="px-3 py-1.5 text-sm text-slate-300 hover:text-white rounded-lg transition">
              Apply
            </Link>
          </nav>

          <ThemeToggle />

          {user ? (
            <button
              onClick={handleLogout}
              className="ml-1 px-3 py-1.5 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/student-login"
              className="ml-1 px-4 py-1.5 text-sm bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold rounded-lg transition"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
