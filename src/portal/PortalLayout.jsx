import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';

const NAV_ITEMS = [
  { path: '/portal',              label: 'Home'         },
  { path: '/portal/registration', label: 'Registration' },
  { path: '/portal/fees',         label: 'Fees'         },
  { path: '/portal/clearance',    label: 'Clearance'    },
];
export default function PortalLayout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <span className="text-xl font-bold">Student Portal</span>
          </div>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              // For Home, require exact match. For others, prefix match.
              const active = item.path === '/portal'
                ? location.pathname === '/portal'
                : location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    active ? 'bg-blue-800 text-white' : 'text-white/80 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />
          <span className="text-sm opacity-90">{user?.username || user?.email}</span>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {title && (
        <div className="bg-blue-600 text-white px-6 py-3">
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
      )}

      <main>{children}</main>
    </div>
  );
}
