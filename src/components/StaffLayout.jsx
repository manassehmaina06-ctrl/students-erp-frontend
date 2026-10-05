import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const NAV_ITEMS = [
  { path: '/erp/admissions', label: 'Admissions', icon: '🎯', roles: ['admissions'] },
  { path: '/erp/academic',   label: 'Academic',   icon: '🎓', roles: ['academic'] },
  { path: '/erp/units',      label: 'Units',      icon: '📚', roles: ['academic'] },
  { path: '/erp/semesters',  label: 'Semesters',  icon: '🗓️', roles: ['academic'] },
  { path: '/erp/finance',    label: 'Finance',    icon: '💰', roles: ['finance'] },
  { path: '/erp/students',   label: 'Students',   icon: '👥', roles: ['admissions', 'academic', 'finance'] },
  { path: '/erp/clearance',  label: 'Clearance',  icon: '✅', roles: ['academic', 'finance'] },
  { path: '/erp/lecturer',   label: 'My Units',   icon: '📖', roles: ['lecturer'] },
];

export default function StaffLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const visible = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  const go = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <span className="text-2xl">🎓</span>
              <span className="text-base sm:text-xl font-bold whitespace-nowrap">Student ERP</span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {visible.map((item) => {
                const active = location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                      active ? 'bg-blue-800 text-white' : 'text-white/80 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell />
            <span className="hidden lg:inline text-sm opacity-90 truncate max-w-[180px]">
              {user?.email}
            </span>
            <span className="hidden sm:inline-block text-xs px-2 py-1 rounded-full bg-blue-800 capitalize">
              {user?.role}
            </span>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="hidden sm:inline-block bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-sm"
            >
              Logout
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden w-9 h-9 rounded-lg bg-blue-800 hover:bg-blue-900 flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <nav className="md:hidden bg-blue-800 border-t border-blue-900">
            {visible.map((item) => {
              const active = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition flex items-center gap-3 ${
                    active
                      ? 'bg-blue-900 border-amber-400 text-white'
                      : 'border-transparent text-white/90 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
            <div className="px-4 py-3 border-t border-blue-900 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs opacity-80 truncate">{user?.email}</div>
                <div className="text-[10px] uppercase tracking-wide text-amber-300 font-semibold">
                  {user?.role}
                </div>
              </div>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-sm flex-shrink-0"
              >
                Logout
              </button>
            </div>
          </nav>
        )}
      </header>

      <main className="px-3 sm:px-6 py-4 sm:py-6">{children}</main>
    </div>
  );
}