import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navClass = (path) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive(path) ? 'bg-blue-800 text-white' : 'hover:bg-blue-800 hover:text-white'
    }`;

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-2">
        <Link to="/" className="text-2xl font-bold tracking-tight hover:text-blue-200 transition">
          🎓 Student ERP
        </Link>

        <div className="flex flex-wrap items-center gap-1 md:gap-2">
          {user ? (
            <>
              {user.role === 'student' && (
                <>
                  <Link to="/apply" className={navClass('/apply')}>Apply</Link>
                  <Link to="/dashboard" className={navClass('/dashboard')}>Dashboard</Link>
                  <Link to="/tracking" className={navClass('/tracking')}>Tracking</Link>
                </>
              )}
              {user.role === 'admissions' && (
                <>
                  <Link to="/admissions" className={navClass('/admissions')}>Admissions</Link>
                  <Link to="/students" className={navClass('/students')}>Students</Link>
                </>
              )}
              {user.role === 'academic' && (
                <>
                  <Link to="/academic" className={navClass('/academic')}>Academic</Link>
                  <Link to="/students" className={navClass('/students')}>Students</Link>
                </>
              )}
              {user.role === 'finance' && (
                <>
                  <Link to="/finance" className={navClass('/finance')}>Finance</Link>
                  <Link to="/students" className={navClass('/students')}>Students</Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={navClass('/login')}>Login</Link>
              <Link to="/register" className={navClass('/register')}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
