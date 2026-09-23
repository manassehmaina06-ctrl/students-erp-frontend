import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StaffLayout from '../components/StaffLayout';

const STATUS_PILL = {
  draft:             'bg-gray-100 text-gray-700',
  submitted:         'bg-blue-100 text-blue-800',
  pending_approval:  'bg-yellow-100 text-yellow-800',
  approved:          'bg-indigo-100 text-indigo-800',
  finance_review:    'bg-orange-100 text-orange-800',
  payment_validated: 'bg-teal-100 text-teal-800',
  admitted:          'bg-green-100 text-green-800',
  rejected:          'bg-red-100 text-red-800',
  enrolled:          'bg-purple-100 text-purple-800',
};

const label = (s) =>
  (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const AdmissionsDashboard = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchApps = async () => {
    try {
     const res = await api.get('/applications/all');
      setApps(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  const counts = apps.reduce((acc, a) => {
    acc.total++;
    if (['submitted', 'pending_approval'].includes(a.status)) acc.pending++;
    if (['approved', 'admitted', 'enrolled'].includes(a.status)) acc.accepted++;
    if (a.status === 'rejected') acc.rejected++;
    return acc;
  }, { total: 0, pending: 0, accepted: 0, rejected: 0 });

  const isAdmissions = ['admissions', 'academic'].includes(user?.role);

   return (
    <StaffLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admissions — Applications</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total',    value: counts.total,    color: 'border-blue-400 text-blue-600' },
            { label: 'Pending',  value: counts.pending,  color: 'border-yellow-400 text-yellow-600' },
            { label: 'Accepted', value: counts.accepted, color: 'border-green-400 text-green-600' },
            { label: 'Rejected', value: counts.rejected, color: 'border-red-400 text-red-600' },
          ].map((c) => (
            <div key={c.label} className={`bg-white rounded-xl shadow p-5 border-l-4 ${c.color}`}>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className={`text-3xl font-bold ${c.color.split(' ')[1]}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Applications table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">App #</th>
                <th className="px-4 py-3">Programme</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="6" className="p-6 text-center text-gray-400">Loading…</td></tr>
              )}
              {!loading && apps.length === 0 && (
                <tr><td colSpan="6" className="p-6 text-center text-gray-400">No applications yet</td></tr>
              )}
              {apps.map((a) => {
                const s = a.studentId || {};
                const p = s.personalInfo || {};
                const prog = a.programmeId || s.programmeInfo?.programme;
                return (
                  <tr key={a._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">
                        {[p.title, p.surname, p.lastName].filter(Boolean).join(' ') || 'Unnamed'}
                      </div>
                      <div className="text-xs text-gray-500">{p.email || '—'}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {a.applicationNumber || '—'}
                      {a.studentNumber && <div className="text-purple-600">{a.studentNumber}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {prog?.name || prog?.code || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_PILL[a.status] || ''}`}>
                        {label(a.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/application/${a._id}`)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"
                      >
                        Open →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </StaffLayout>
  );
};

export default AdmissionsDashboard;