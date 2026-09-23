import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StaffLayout from '../components/StaffLayout';

const AcademicDashboard = () => {
  const [students, setStudents] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, programmesRes] = await Promise.all([
          api.get('/academic/students'),
          api.get('/academic/programmes'),
        ]);
        setStudents(studentsRes.data);
        setProgrammes(programmesRes.data);
      } catch (err) {
        console.error('Error fetching academic data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading…</div>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl">📚</span>
          <h2 className="text-3xl font-bold text-gray-800">Academic Dashboard</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Students card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
              <h3 className="text-white font-semibold text-lg">
                👨‍🎓 Students ({students.length})
              </h3>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {students.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No students registered</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {students.map((s) => (
                    <li key={s._id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500">
                          {s.studentNumber} · {s.email}
                        </p>
                        <p className="text-xs text-gray-400">
                          {s.programme} · {s.modeOfStudy} · {s.campus}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        s.feeStatus === 'paid' ? 'bg-green-100 text-green-800'
                        : s.feeStatus === 'partial' ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                        {s.feeStatus}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Programmes card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
              <h3 className="text-white font-semibold text-lg">
                📖 Programmes ({programmes.length})
              </h3>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {programmes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No programmes available</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {programmes.map((p) => (
                    <li key={p._id} className="py-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-500">
                            {p.code} · {p.duration} semesters · {p.enrolledCount} enrolled
                          </p>
                        </div>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                          {p.department}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
};

export default AcademicDashboard;