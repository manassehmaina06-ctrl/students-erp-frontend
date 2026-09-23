import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StaffLayout from '../components/StaffLayout';

export default function LecturerPanel() {
  const navigate = useNavigate();
  const [units, setUnits]     = useState([]);
  const [semester, setSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/lecturer/me/units'),
      api.get('/lecturer/me/current-semester'),
    ])
      .then(([u, s]) => {
        setUnits(u.data);
        setSemester(s.data);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <StaffLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📚 Lecturer Panel</h1>
            {semester && (
              <p className="text-sm text-gray-500 mt-1">
                Current semester: <span className="font-medium">{semester.code}</span> ({semester.academicYear})
              </p>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : units.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">You have no units assigned yet.</p>
            <p className="text-xs text-gray-400 mt-1">Contact the academic office to be assigned to units.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {units.map((u) => (
                          <button
                key={u._id}
                onClick={() => navigate(`/erp/lecturer/units/${u._id}`)}
                className="text-left bg-white rounded-xl shadow p-5 hover:shadow-md transition w-full"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono text-xs text-gray-500">{u.code}</p>
                    <h3 className="font-semibold text-gray-800">{u.name}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    u.type === 'core' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>{u.type}</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Semester {u.semester} · {u.credits} credits · {u.enrolledCount} student{u.enrolledCount === 1 ? '' : 's'}
                </p>
                {(u.programmeIds || []).length > 0 && (
                  <p className="text-xs text-gray-400 mb-3">
                    {u.programmeIds.map((p) => p.code).join(', ')}
                  </p>
                )}
               <div className="text-xs text-blue-600 font-medium mt-3 pt-3 border-t border-gray-100">
  Click to enter marks →
</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
