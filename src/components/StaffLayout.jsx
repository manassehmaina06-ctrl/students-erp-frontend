import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const NAV_ITEMS = [
  { path: '/erp/admissions', label: 'Admissions', roles: ['admissions'] },
  { path: '/erp/academic',   label: 'Academic',   roles: ['academic'] },
  { path: '/erp/units',      label: 'Units',      roles: ['academic'] },
  { path: '/erp/semesters',  label: 'Semesters',  roles: ['academic'] },
  { path: '/erp/finance',    label: 'Finance',    roles: ['finance'] },
  { path: '/erp/students',   label: 'Students',   roles: ['admissions', 'academic', 'finance'] },
  { path: '/erp/clearance',  label: 'Clearance',  roles: ['academic', 'finance'] },
  { path: '/erp/lecturer',   label: 'My Units',   roles: ['lecturer'] },
];
export default function StaffLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visible = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <span className="text-xl font-bold">Student ERP</span>
          </div>
          <nav className="flex items-center gap-1">
            {visible.map((item) => {
              const active = location.pathname.startsWith(item.path);
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
          <span className="text-sm opacity-90">{user?.email}</span>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-800 capitalize">{user?.role}</span>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
