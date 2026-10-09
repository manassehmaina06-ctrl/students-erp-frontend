import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import StaffLayout from '../components/StaffLayout';
import { LoadingState } from '../components/LoadingState';

export default function StaffProfile() {
  const toast = useToast();
  const [me, setMe]             = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then((r) => setMe(r.data))
      .catch((err) => toast.error(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <StaffLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👤 My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Your account information</p>
        </div>

        {loading ? (
          <LoadingState />
        ) : (
          <>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shrink-0">
                  {(me?.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-800 truncate">
                    {me?.username || me?.email}
                  </h2>
                  <p className="text-sm text-gray-500 truncate">{me?.email}</p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium uppercase">
                    {me?.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              💡 Need to update your password or personal details? Contact your administrator.
            </div>
          </>
        )}
      </div>
    </StaffLayout>
  );
}
