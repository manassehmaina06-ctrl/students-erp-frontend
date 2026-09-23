import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PortalLayout from './PortalLayout';

const STATUS_COLORS = {
  submitted:         'bg-blue-100 text-blue-800',
  approved:          'bg-indigo-100 text-indigo-800',
  finance_review:    'bg-orange-100 text-orange-800',
  payment_validated: 'bg-teal-100 text-teal-800',
  admitted:          'bg-green-100 text-green-800',
  enrolled:          'bg-purple-100 text-purple-800',
  rejected:          'bg-red-100 text-red-800',
};

const label = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function PortalHome() {
  const { user } = useAuth();
  const enrolled = !!user?.enrolled;
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/applications/me')
      .then((r) => setSummary(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;

   return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {!summary?.hasApplication && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Welcome!</h2>
            <p className="text-gray-600 mb-4">You haven't submitted an application yet.</p>
          </div>
        )}
        {summary?.hasApplication && !enrolled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Application Received</h2>
            <p className="text-yellow-700 text-sm">
              Your application is being processed. Fee access and portal features unlock once Finance enrolls you.
            </p>
            <div className="mt-3 text-xs text-yellow-700">
              <div>App # {summary.applicationNumber || '—'}</div>
              <div>Status: <span className="font-semibold capitalize">{summary.status}</span></div>
            </div>
          </div>
        )}

        
        {summary?.hasApplication && (
          <>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {summary.programme?.name || 'Application'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    App # {summary.applicationNumber || '—'}
                    {summary.studentNumber && <> · Student # {summary.studentNumber}</>}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[summary.status] || 'bg-gray-100'}`}>
                  {label(summary.status)}
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-sm">
                <strong>Next action:</strong> {summary.nextAction}
              </div>
            </div>

{(summary.fees?.total > 0) && (
  <div className="bg-white rounded-xl shadow p-6">
    <h3 className="font-semibold text-gray-800 mb-3">Fee Statement</h3>
    <div className="grid grid-cols-3 gap-4">
      <div>
        <p className="text-xs text-gray-500">Total</p>
        <p className="text-lg font-bold text-gray-800">KES {summary.fees.total.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Paid</p>
        <p className="text-lg font-bold text-green-600">KES {summary.fees.paid.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Balance</p>
        <p className="text-lg font-bold text-red-600">KES {summary.fees.balance.toLocaleString()}</p>
      </div>
    </div>
    <button
      onClick={() => navigate('/portal/fees')}
      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
    >
      View full statement →
    </button>
  </div>
)}

{/* Clearance card — OUTSIDE the fee conditional, always visible when enrolled */}
{enrolled && (
  <div className="bg-white rounded-xl shadow p-6">
    <h3 className="font-semibold text-gray-800 mb-3">🎓 Clearance</h3>
    <p className="text-sm text-gray-600 mb-3">
      Request clearance for graduation, end of semester, or leave.
    </p>
    <button
      onClick={() => navigate('/portal/clearance')}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
    >
      Open clearance →
    </button>
  </div>
)}
          

            {summary.timeline?.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Application Timeline</h3>
                <ol className="space-y-3">
                  {summary.timeline.map((ev, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{label(ev.status)}</p>
                        {ev.note && <p className="text-xs text-gray-500">{ev.note}</p>}
                        {ev.at && <p className="text-xs text-gray-400">{new Date(ev.at).toLocaleString()}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
             </>
        )}
      </div>
    </PortalLayout>
  );
}
