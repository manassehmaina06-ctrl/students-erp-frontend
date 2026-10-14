import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import AiAssistant from '../components/AiAssistant';
import { LMS_FAQ } from '../data/lmsFaq';

const NAV_ITEMS = [
  { path: '/portal',              label: 'Home',         icon: '🏠' },
  { path: '/portal/registration', label: 'Registration', icon: '📝' },
  { path: '/portal/fees',         label: 'Fees',         icon: '💰' },
  { path: '/portal/clearance',    label: 'Clearance',    icon: '✅' },
];

export default function PortalLayout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/portal') return location.pathname === '/portal';
    return location.pathname.startsWith(path);
  };

  const go = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <header className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">🎓</span>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-display font-bold leading-tight truncate">
                Student Portal
              </div>
              <div className="hidden sm:block text-[11px] text-blue-200 leading-tight">
                Fees · Registration · Clearance
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <NotificationBell />
            <span className="hidden md:inline text-sm text-blue-100 truncate max-w-[180px]">
              {user?.username || user?.studentNumber || user?.email}
            </span>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="hidden sm:inline-block bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg text-sm transition"
            >
              Logout
            </button>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

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
                      ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20'
                      : 'text-blue-100 hover:text-white hover:bg-white/5')
                  }
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {menuOpen && (
          <nav className="md:hidden bg-blue-900 border-t border-blue-800">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className={
                    'w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition flex items-center gap-3 ' +
                    (active
                      ? 'bg-blue-950 border-amber-400 text-white'
                      : 'border-transparent text-blue-100 hover:bg-blue-800/50')
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="w-full text-left px-4 py-3 text-sm font-medium text-rose-200 hover:bg-blue-800/50 border-t border-blue-800 flex items-center gap-3"
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
