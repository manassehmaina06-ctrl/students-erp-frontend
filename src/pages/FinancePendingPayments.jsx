import { useEffect, useState } from 'react';
import api from '../api/axios';
import StaffLayout from '../components/StaffLayout';

const ksh = (n) => 'KES ' + (Number(n) || 0).toLocaleString();

export default function FinancePendingPayments() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState('');
  const [busyId, setBusyId]   = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/fees/pending')
      .then((r) => setRows(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const confirm = async (paymentId) => {
    setError(''); setToast(''); setBusyId(paymentId);
    try {
      await api.post(`/fees/payments/${paymentId}/confirm`);
      setToast('Payment confirmed');
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (paymentId) => {
    if (!rejectReason.trim()) return setError('Rejection reason required');
    setError(''); setToast(''); setBusyId(paymentId);
    try {
      await api.post(`/fees/payments/${paymentId}/reject`, { reason: rejectReason.trim() });
      setToast('Payment rejected');
      setRejectId(null); setRejectReason('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <StaffLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">💰 Finance — Pending Payments</h1>

        {toast && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm mb-4">
            {toast}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <p className="p-6 text-center text-gray-400">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-center text-gray-400">No pending payments 🎉</p>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.paymentId} className="border-t border-gray-100 hover:bg-gray-50 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{r.studentName}</div>
                      <div className="text-xs text-gray-500 font-mono">{r.studentNumber}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{ksh(r.amount)}</td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-700">{r.method}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{r.reference || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {rejectId === r.paymentId ? (
                        <div className="flex flex-col items-end gap-2">
                          <input
                            type="text" value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection"
                            className="w-56 border border-gray-300 rounded-lg px-2 py-1 text-xs"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setRejectId(null); setRejectReason(''); }}
                              className="text-xs px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                            >Cancel</button>
                            <button
                              onClick={() => reject(r.paymentId)}
                              disabled={busyId === r.paymentId}
                              className="text-xs px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                            >Confirm reject</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setRejectId(r.paymentId); setRejectReason(''); }}
                            className="text-xs px-3 py-1.5 rounded bg-red-100 hover:bg-red-200 text-red-800"
                          >Reject</button>
                          <button
                            onClick={() => confirm(r.paymentId)}
                            disabled={busyId === r.paymentId}
                            className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                          >{busyId === r.paymentId ? '…' : 'Confirm'}</button>
                        </div>
                      )}
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
