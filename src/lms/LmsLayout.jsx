import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';

const NAV_ITEMS = [
  { path: '/lms',              label: 'Dashboard',     icon: '🏠' },
  { path: '/lms/courses',      label: 'My Courses',    icon: '📚' },
  { path: '/lms/timetable',    label: 'Timetable',     icon: '📅' },
  { path: '/lms/assignments',  label: 'Assignments',   icon: '📝' },
  { path: '/lms/materials',    label: 'Materials',     icon: '📖' },
  { path: '/lms/results',      label: 'Results',       icon: '📊' },
  { path: '/lms/attendance',   label: 'Attendance',    icon: '✅' },
  { path: '/lms/announcements',label: 'Announcements', icon: '🔔' },
  { path: '/lms/messages',     label: 'Messages',      icon: '💬' },
];

export default function LmsLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/lms') return location.pathname === '/lms';
    return location.pathname.startsWith(path);
  };

  const go = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">🎓</span>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-bold leading-tight truncate">
                Strathmore LMS
              </div>
              <div className="hidden sm:block text-[11px] text-slate-400 leading-tight">
                Learning Management System
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell />
            <span className="hidden md:inline text-sm text-slate-300 truncate max-w-[180px]">
              {user?.username || user?.email}
            </span>
            <button
              onClick={() => go('/lms/profile')}
              className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-sm"
              title="My Profile"
            >
              👤
            </button>
            <button
              onClick={() => { logout(); navigate('/lms-login'); }}
              className="hidden sm:inline-block bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-sm"
            >
              Logout
            </button>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        <nav className="hidden md:block bg-slate-800 border-t border-slate-700">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  isActive(item.path)
                    ? 'border-amber-400 text-white'
                    : 'border-transparent text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {menuOpen && (
          <nav className="md:hidden bg-slate-800 border-t border-slate-700">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition flex items-center gap-3 ${
                  isActive(item.path)
                    ? 'bg-slate-900 border-amber-400 text-white'
                    : 'border-transparent text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { logout(); navigate('/lms-login'); }}
              className="w-full text-left px-4 py-3 text-sm font-medium text-red-300 hover:bg-slate-700/50 border-t border-slate-700 flex items-center gap-3"
            >
              <span className="text-lg">🚪</span>
              Logout
            </button>
          </nav>
        )}
      </header>

      <main className="px-3 sm:px-6 py-4 sm:py-6">{children}</main>
    </div>
  );
}
