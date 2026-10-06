import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Where to send the user depending on their role
  const homePath = (() => {
    if (!user) return '/';
    if (user.role === 'student') return '/portal';
    if (user.role === 'lecturer') return '/erp/lecturer';
    if (user.role === 'academic') return '/erp/academic';
    if (user.role === 'finance') return '/erp/finance';
    if (user.role === 'admissions') return '/erp/admissions';
    return '/';
  })();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="text-7xl mb-4" role="img" aria-label="Page not found">
          🔍
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
        <p className="text-lg text-gray-700 mb-2">Page not found</p>
        <p className="text-sm text-gray-500 mb-6">
          The page you're looking for doesn't exist or you don't have access to it.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"
          >
            ← Go back
          </button>
          <button
            onClick={() => navigate(homePath)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white"
          >
            Go to my dashboard
          </button>
        </div>

        <p className="text-[10px] text-gray-400 mt-6">
          If you think this is a bug, contact your administrator.
        </p>
      </div>
    </div>
  );
}
