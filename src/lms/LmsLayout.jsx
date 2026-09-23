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

  const isActive = (path) => {
    if (path === '/lms') return location.pathname === '/lms';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top header — dark navy */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <div>
              <div className="text-lg font-bold leading-tight">Strathmore LMS</div>
              <div className="text-[11px] text-slate-400 leading-tight">Learning Management System</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-sm text-slate-300">{user?.username || user?.email}</span>
            <button
              onClick={() => navigate('/lms/profile')}
              className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-sm"
              title="My Profile"
            >
              👤
            </button>
            <button
              onClick={() => { logout(); navigate('/lms-login'); }}
              className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Nav bar */}
        <nav className="bg-slate-800 border-t border-slate-700">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
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
      </header>

      <main>{children}</main>
    </div>
  );
}