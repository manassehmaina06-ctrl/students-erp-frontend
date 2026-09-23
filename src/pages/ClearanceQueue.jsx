import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StaffLayout from '../components/StaffLayout';

const REASON_LABEL = {
  graduation:       'Graduation',
  end_of_semester:  'End of Semester',
  leave_of_absence: 'Leave of Absence',
  transfer:         'Transfer',
};

const OFFICE_LABEL = {
  finance:    'Finance',
  library:    'Library',
  exam:       'Exam Office',
  hostel:     'Hostel',
  department: 'Department',
  registrar:  'Registrar',
};

export default function ClearanceQueue() {
  const navigate = useNavigate();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/clearance/queue')
      .then((r) => setRows(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <StaffLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">🎓 Clearance Queue</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <p className="p-6 text-center text-gray-400">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-center text-gray-400">No pending clearances for your office 🎉</p>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3">Your Offices</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{r.studentName}</div>
                      <div className="text-xs font-mono text-purple-700">{r.studentNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {REASON_LABEL[r.reason] || r.reason}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(r.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.myOffices.map((o) => (
                          <span key={o} className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">
                            {OFFICE_LABEL[o]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/erp/clearance/${r._id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm"
                      >
                        Open →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
