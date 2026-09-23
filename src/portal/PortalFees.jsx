import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PortalLayout from './PortalLayout';

const ksh = (n) => 'KES ' + (Number(n) || 0).toLocaleString();

export default function PortalFees() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [ledger, setLedger]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [amount, setAmount]         = useState('');
  const [method, setMethod]         = useState('mpesa');
  const [reference, setReference]   = useState('');
  const [note, setNote]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState('');

    const downloadReceipt = async (receiptNumber) => {
    try {
      const res = await api.get(`/fees/me/receipt/${receiptNumber}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download receipt: ' + (err.response?.data?.message || err.message));
    }
  };
  const load = () => {
    setLoading(true);
    api.get('/fees/me/ledger')
      .then((r) => setLedger(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setToast('');
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount');
    setSubmitting(true);
    try {
      await api.post('/fees/me/payments', {
        amount: Number(amount),
        method,
        reference: reference || undefined,
        note:      note || undefined,
      });
      setToast(`Payment of ${ksh(amount)} submitted`);
      setAmount(''); setReference(''); setNote('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (!ledger) return <div className="p-8 text-red-600">{error || 'Unable to load ledger'}</div>;

  const { fees, billings = [], payments = [], feeStatus } = ledger;
  const pct = fees.total > 0 ? Math.min(100, Math.round((fees.paid / fees.total) * 100)) : 0;

   return (
    <PortalLayout title="Fee Statement">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {toast && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm">
            {toast}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {ledger.studentNumber || 'Student'}
              </h2>
              <p className="text-xs text-gray-500">
                {feeStatus === 'paid' ? 'Fully paid'
                 : feeStatus === 'partial' ? 'Partially paid'
                 : 'Payment pending'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              feeStatus === 'paid' ? 'bg-green-100 text-green-800'
              : feeStatus === 'partial' ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
            }`}>
              {feeStatus}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Total billed</p>
              <p className="text-lg font-bold text-gray-800">{ksh(fees.total)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Paid</p>
              <p className="text-lg font-bold text-green-600">{ksh(fees.paid)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Balance</p>
              <p className="text-lg font-bold text-red-600">{ksh(fees.balance)}</p>
            </div>
          </div>

          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{pct}% paid</p>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Billings</h3>
          </div>
          {billings.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No billings on record.</p>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                          <tr>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3">Semester</th>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {billings.map((b) => (
                  <tr key={b._id} className="border-t border-gray-100">
                    <td className="px-6 py-3 text-sm text-gray-800">{b.label || '—'}</td>
                    <td className="px-6 py-3 text-xs text-gray-500">{b.semester || '—'}</td>
                    <td className="px-6 py-3 text-xs text-gray-500">{b.reference || '—'}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-800 text-right">{ksh(b.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Payment History</h3>
          </div>
          {payments.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No payments recorded yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                              <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Receipt</th>
                  <th className="px-6 py-3 text-right">Status</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-t border-gray-100">
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {p.paidAt ? new Date(p.paidAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-800 capitalize">{p.method}</td>
                                       <td className="px-6 py-3 text-xs text-gray-500">{p.reference || '—'}</td>
                    <td className="px-6 py-3 text-xs font-mono text-gray-700">
  {p.receiptNumber ? (
    <button
      onClick={() => downloadReceipt(p.receiptNumber)}
      className="text-blue-600 hover:text-blue-800 underline"
    >
      {p.receiptNumber}
    </button>
  ) : (
    '—'
  )}
</td>
                    <td className="px-6 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'confirmed' ? 'bg-green-100 text-green-800'
                        : p.status === 'rejected' ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {p.status || 'confirmed'}
                      </span>
                      {p.status === 'rejected' && p.rejectionReason && (
                        <div className="text-[10px] text-red-600 mt-1">{p.rejectionReason}</div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-green-700 text-right">{ksh(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {fees.balance > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Record a Payment</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm text-gray-600">Amount (KES)</span>
                <input
                  type="number" min="1" step="1" required value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">Method</span>
                <select
                  value={method} onChange={(e) => setMethod(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="bank">Bank transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">Reference (optional)</span>
                <input
                  type="text" value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. M-Pesa code"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">Note (optional)</span>
                <input
                  type="text" value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <div className="md:col-span-2">
                <button
                  type="submit" disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg"
                >
                  {submitting ? 'Submitting…' : 'Submit payment'}
                </button>
              </div>
            </form>
          </div>
        )}
          </div>
    </PortalLayout>
  );
}
