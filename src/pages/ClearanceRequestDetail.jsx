import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StaffLayout from '../components/StaffLayout';

const OFFICE_LABEL = {
  finance:    'Finance',
  library:    'Library',
  exam:       'Exam Office',
  hostel:     'Hostel',
  department: 'Department',
  registrar:  'Registrar',
};

// Which offices each role can action.
// Keep in sync with backend OFFICE_ROLES in clearanceController.js
const OFFICE_ROLES = {
  finance:    ['finance'],
  library:    ['academic'],
  exam:       ['academic'],
  hostel:     ['academic'],
  department: ['academic'],
  registrar:  ['academic'],
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

export default function ClearanceRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [req, setReq]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [busy, setBusy]       = useState(false);
  const [rejectFor, setRejectFor] = useState(null);
  const [reason, setReason]   = useState('');

  const load = () => {
    setLoading(true);
    api.get(`/clearance/${id}`)
      .then((r) => setReq(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const canAction = (office) => (OFFICE_ROLES[office] || []).includes(user?.role);

  const approve = async (office) => {
    setBusy(true); setError('');
    try {
      await api.post(`/clearance/${id}/office/${office}/approve`, {});
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const reject = async (office) => {
    if (!reason.trim()) return setError('Rejection reason required');
    setBusy(true); setError('');
    try {
      await api.post(`/clearance/${id}/office/${office}/reject`, { reason: reason.trim() });
      setRejectFor(null); setReason('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const recheckFinance = async () => {
    setBusy(true); setError('');
    try {
      await api.post(`/clearance/${id}/recheck-finance`, {});
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <StaffLayout><div className="p-8 text-gray-500">Loading…</div></StaffLayout>;
  if (!req)    return <StaffLayout><div className="p-8 text-red-600">{error || 'Not found'}</div></StaffLayout>;

  const s = req.studentId || {};
  const p = s.personalInfo || {};

  return (
    <StaffLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/erp/clearance')} className="text-gray-500 hover:text-gray-800 text-sm mb-4">
          ← Back to queue
        </button>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{req.studentNumber}</h1>
              <p className="text-sm text-gray-500">
                {[p.title, p.surname, p.lastName].filter(Boolean).join(' ') || 'Unnamed'}
                {' · '}
                {s.programmeInfo?.programme?.name || '—'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Reason: <span className="capitalize">{(req.reason || '').replace(/_/g, ' ')}</span>
                {' · '}
                Requested {new Date(req.requestedAt).toLocaleString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              req.status === 'cleared' ? 'bg-green-100 text-green-800'
              : req.status === 'rejected' ? 'bg-red-100 text-red-800'
              : req.status === 'cancelled' ? 'bg-gray-100 text-gray-600'
              : 'bg-yellow-100 text-yellow-800'
            }`}>
              {req.status}
            </span>
          </div>

          {req.certificateNumber && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-800">
              <strong>Certificate: {req.certificateNumber}</strong>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Office Gates</h2>
          <div className="space-y-3">
            {req.offices.map((o) => {
              const actionable = canAction(o.office) && o.status === 'pending' && req.status === 'pending';

              return (
                <div key={o.office} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-gray-800">{OFFICE_LABEL[o.office]}</span>
                        <GatePill status={o.status} />
                        {o.autoFilled && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">auto-verified</span>
                        )}
                      </div>
                      {o.note && <p className="text-xs text-gray-600">{o.note}</p>}
                      {o.actedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(o.actedAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {actionable && (
                      <div className="flex gap-2 shrink-0">
                        {rejectFor === o.office ? (
                          <div className="flex flex-col items-end gap-2">
                            <input
                              type="text" value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="Reason for rejection"
                              className="w-64 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setRejectFor(null); setReason(''); }}
                                className="text-xs px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                              >Cancel</button>
                              <button
                                onClick={() => reject(o.office)}
                                disabled={busy}
                                className="text-xs px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                              >Confirm reject</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => { setRejectFor(o.office); setReason(''); }}
                              className="text-xs px-3 py-1.5 rounded bg-red-100 hover:bg-red-200 text-red-800"
                            >Reject</button>
                            <button
                              onClick={() => approve(o.office)}
                              disabled={busy}
                              className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                            >Approve</button>
                          </>
                        )}
                      </div>
                    )}

                    {o.office === 'finance' && req.status === 'pending' && user?.role === 'academic' && (
                      <button
                        onClick={recheckFinance}
                        disabled={busy}
                        className="text-xs px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 shrink-0"
                      >Re-check</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
