import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import AiAssistant from '../components/AiAssistant';
import { LMS_FAQ } from '../data/lmsFaq';

const NAV_ITEMS = [
  { path: '/lms',              label: 'Dashboard',     icon: '🏠' },
  { path: '/lms/courses',      label: 'My Courses',    icon: '📚' },
  { path: '/lms/timetable',    label: 'Timetable',     icon: '📅' },
  { path: '/lms/assignments',  label: 'Assignments',   icon: '📝' },
  { path: '/lms/quizzes',      label: 'Quizzes',       icon: '🧪' },
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <header className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-white shadow-lg">
        {/* Top bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">🎓</span>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-display font-bold leading-tight truncate">
                Strathmore LMS
              </div>
              <div className="hidden sm:block text-[11px] text-slate-400 leading-tight">
                Learning Management System
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <NotificationBell />
            <span className="hidden md:inline text-sm text-slate-300 truncate max-w-[180px]">
              {user?.username || user?.email}
            </span>
            <button
              onClick={() => go('/lms/profile')}
              className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-sm transition"
              title="My Profile"
            >
              👤
            </button>
            <button
              onClick={() => { logout(); navigate('/lms-login'); }}
              className="hidden sm:inline-block bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg text-sm transition"
            >
              Logout
            </button>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition"
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Desktop nav — pill tabs */}
        <nav className="hidden md:block pb-3">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className={
                    'px-3.5 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-all ' +
                    (active
                      ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5')
                  }
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile drawer */}
        {menuOpen && (
          <nav className="md:hidden bg-slate-900 border-t border-slate-800">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className={
                    'w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition flex items-center gap-3 ' +
                    (active
                      ? 'bg-slate-800 border-brand-500 text-white'
                      : 'border-transparent text-slate-300 hover:bg-slate-800/50 hover:text-white')
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={() => { logout(); navigate('/lms-login'); }}
              className="w-full text-left px-4 py-3 text-sm font-medium text-rose-300 hover:bg-slate-800/50 border-t border-slate-800 flex items-center gap-3"
            >
              <span className="text-lg">🚪</span>
              Logout
            </button>
          </nav>
        )}
      </header>

      <main className="px-3 sm:px-6 py-6 sm:py-8">{children}</main>

      <AiAssistant theme="lms" faqs={LMS_FAQ} />
    </div>
  );
}
