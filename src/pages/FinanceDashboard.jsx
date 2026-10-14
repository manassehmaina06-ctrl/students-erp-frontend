import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import StaffLayout from '../components/StaffLayout';
import { PageHeader, StatCard } from '../components/ui';

const STATUS_PILL = {
  approved:          'bg-indigo-100 text-indigo-800',
  finance_review:    'bg-orange-100 text-orange-800',
  payment_validated: 'bg-teal-100 text-teal-800',
  admitted:          'bg-green-100 text-green-800',
  enrolled:          'bg-purple-100 text-purple-800',
};

const label = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const FinanceDashboard = () => {
  const [apps, setApps] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
          try {
       const res = await api.get('/applications/all');
        // Finance sees: approved → finance_review → payment_validated → admitted → enrolled
        setApps(
          res.data.filter((a) =>
            ['approved', 'finance_review', 'payment_validated', 'admitted', 'enrolled'].includes(a.status)
          )
        );
                api.get('/fees/pending')
          .then((r) => setPendingCount(r.data.length))
          .catch(() => setPendingCount(0));
      } catch (err) {
        console.error('Failed to load finance queue:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counts = apps.reduce(
    (acc, a) => {
      acc.total++;
      if (a.status === 'approved')          acc.toValidate++;
      if (a.status === 'finance_review')    acc.inReview++;
      if (a.status === 'payment_validated') acc.awaitingAdmit++;
      if (a.status === 'admitted')          acc.admitted++;
      if (a.status === 'enrolled')          acc.enrolled++;
      return acc;
    },
    { total: 0, toValidate: 0, inReview: 0, awaitingAdmit: 0, admitted: 0, enrolled: 0 }
  );

   return (
    <StaffLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
 <PageHeader
  icon="💰"
  title="Finance — Applications"
  subtitle={counts.total + ' in queue · ' + pendingCount + ' pending payments'}
/>

<div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
  <StatCard icon="📋" label="In Queue"        value={counts.total}         accent="brand" />
  <StatCard icon="🔍" label="To Validate"     value={counts.toValidate}    accent="amber" />
  <StatCard icon="💳" label="Pending Payments" value={pendingCount}        accent="rose" />
  <StatCard icon="⏸️" label="In Review"        value={counts.inReview}      accent="violet" />
  <StatCard icon="🚀" label="Awaiting Admit"  value={counts.awaitingAdmit} accent="sky" />
  <StatCard icon="🎓" label="Enrolled"         value={counts.enrolled}      accent="emerald" />
</div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">App #</th>
              <th className="px-4 py-3">Student #</th>
              <th className="px-4 py-3">Programme</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="6" className="p-6 text-center text-gray-400">Loading…</td></tr>
            )}
            {!loading && apps.length === 0 && (
              <tr><td colSpan="6" className="p-6 text-center text-gray-400">No applications in finance queue</td></tr>
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
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{a.applicationNumber || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-purple-700">{a.studentNumber || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{prog?.name || prog?.code || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_PILL[a.status] || 'bg-gray-100 text-gray-700'}`}>
                      {label(a.status)}
                    </span>
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

export default FinanceDashboard;
