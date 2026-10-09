import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { LoadingState } from '../components/LoadingState';

export default function LmsProfile() {
  const toast = useToast();
  const [me, setMe]             = useState(null);
  const [student, setStudent]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then((r) => {
        setMe(r.data);
        if (r.data.studentId) {
          return api.get('/lms/me/dashboard')
            .then((d) => setStudent(d.data))
            .catch(() => {});
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const initial = (me?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">👤 My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Your account information</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-purple-600 text-white flex items-center justify-center text-2xl font-bold shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-800 truncate">
              {student?.student?.name || me?.username || 'Student'}
            </h2>
            <p className="text-sm text-gray-500 truncate">{me?.email}</p>
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium uppercase">
              {me?.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
          {me?.studentId && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Student Number</p>
              <p className="text-sm font-mono text-gray-800 mt-1">
                {student?.student?.studentNumber || '—'}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
            <p className="text-sm text-gray-800 mt-1">{me?.email}</p>
          </div>
          {student?.semester && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Current Semester</p>
              <p className="text-sm text-gray-800 mt-1">{student.semester}</p>
            </div>
          )}
          {student?.programme && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Programme</p>
              <p className="text-sm text-gray-800 mt-1">{student.programme}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        💡 Need to update your password or personal details? Contact your administrator.
      </div>
    </div>
  );
}
