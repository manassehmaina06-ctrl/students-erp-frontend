import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import PortalLayout from './PortalLayout';

const OFFICE_LABEL = {
  finance:    'Finance',
  library:    'Library',
  exam:       'Exam Office',
  hostel:     'Hostel',
  department: 'Department',
  registrar:  'Registrar',
};

const REASON_LABEL = {
  graduation:       'Graduation',
  end_of_semester:  'End of Semester',
  leave_of_absence: 'Leave of Absence',
  transfer:         'Transfer',
};

const GatePill = ({ status }) => {
  const map = {
    approved: 'bg-green-100 text-green-800',
    pending:  'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
  };
  const icon = status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100'}`}>
      {icon} {status}
    </span>
  );
};

export default function PortalClearance() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [reason, setReason] = useState('end_of_semester');
  const [note, setNote] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/clearance/me')
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const createRequest = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await api.post('/clearance/me/request', { reason, note: note || undefined });
      setNote('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const cancelRequest = async () => {
    if (!window.confirm('Cancel your clearance request?')) return;
    setBusy(true);
    try {
      await api.post('/clearance/me/cancel');
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;

  const current = data?.current;
  const history = data?.history || [];

   return (
    <PortalLayout title="Fee Statement">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
        )}

        {/* No active request — show form */}
        {!current && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🎓 Request Clearance</h2>
            <p className="text-sm text-gray-600 mb-4">
              Six offices need to approve before you are cleared. Finance will be auto-verified based on your fee status.
            </p>
            <form onSubmit={createRequest} className="space-y-4">
              <label className="block">
                <span className="text-sm text-gray-600">Reason</span>
                <select
                  value={reason} onChange={(e) => setReason(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {Object.entries(REASON_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Note (optional)</span>
                <textarea
                  value={note} onChange={(e) => setNote(e.target.value)}
                  rows="2"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </label>
              <button
                type="submit" disabled={busy}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg"
              >
                {busy ? 'Submitting…' : 'Submit Clearance Request'}
              </button>
            </form>
          </div>
        )}

        {/* Active request — show gates */}
        {current && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {current.status === 'cleared' ? '✅ Cleared' : 'Clearance in Progress'}
                </h2>
                <p className="text-sm text-gray-500">
                  Reason: {REASON_LABEL[current.reason]} · Requested {new Date(current.requestedAt).toLocaleDateString()}
                </p>
              </div>
              {current.status === 'cleared' && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Cleared
                </span>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2">Office</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Note</th>
                    <th className="px-4 py-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {current.offices.map((o) => (
                    <tr key={o.office} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-medium text-gray-800">
                        {OFFICE_LABEL[o.office]}
                        {o.autoFilled && (
                          <span className="ml-2 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">auto</span>
                        )}
                      </td>
                      <td className="px-4 py-2"><GatePill status={o.status} /></td>
                      <td className="px-4 py-2 text-xs text-gray-500">{o.note || '—'}</td>
                      <td className="px-4 py-2 text-xs text-gray-400 text-right">
                        {o.actedAt ? new Date(o.actedAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {current.status === 'cleared' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  <strong>Certificate: {current.certificateNumber}</strong><br />
                  Issued {new Date(current.certificateIssuedAt).toLocaleString()}
                </p>
                <button
                  onClick={() => navigate('/portal/clearance/certificate')}
                  className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  View Certificate →
                </button>
              </div>
            )}

            {current.status === 'pending' && (
              <button
                onClick={cancelRequest} disabled={busy}
                className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                Cancel request
              </button>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Previous Requests</h3>
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h._id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                  <div>
                    <p className="text-sm text-gray-800">
                      {REASON_LABEL[h.reason]} — <span className="capitalize">{h.status}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(h.requestedAt).toLocaleDateString()}
                      {h.certificateNumber && ` · ${h.certificateNumber}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
         </div>
    </PortalLayout>
  );
}