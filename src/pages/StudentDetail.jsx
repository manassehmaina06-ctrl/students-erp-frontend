import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Billing form
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [billLabel, setBillLabel]   = useState('');
  const [billAmount, setBillAmount] = useState('');

  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount]     = useState('');
  const [payMethod, setPayMethod]     = useState('mpesa');
  const [payRef, setPayRef]           = useState('');
  const [payNote, setPayNote]         = useState('');

  const isFinance = user?.role === 'finance';

  const load = async () => {
    try {
      const res = await axios.get(`/api/students/id/${id}`);
      setStudent(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load student');
      navigate('/students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const addBilling = async () => {
    if (!billLabel.trim() || !billAmount) return alert('Label and amount required');
    setSaving(true);
    try {
      await axios.post(`/api/fees/${id}/billings`, {
        label: billLabel.trim(),
        amount: Number(billAmount),
      });
      setBillLabel(''); setBillAmount(''); setShowBillingForm(false);
      await load();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
    setSaving(false);
  };

  const removeBilling = async (billId) => {
    if (!window.confirm('Remove this billing?')) return;
    setSaving(true);
    try {
      await axios.delete(`/api/fees/${id}/billings/${billId}`);
      await load();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
    setSaving(false);
  };

  const recordPayment = async () => {
    if (!payAmount || !payMethod) return alert('Amount and method required');
    setSaving(true);
    try {
      await axios.post(`/api/fees/${id}/payments`, {
        amount: Number(payAmount),
        method: payMethod,
        reference: payRef.trim(),
        note: payNote.trim(),
      });
      setPayAmount(''); setPayRef(''); setPayNote(''); setShowPaymentForm(false);
      await load();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-gray-500">Loading student…</div>;
  if (!student) return <div className="p-10 text-gray-500">Student not found</div>;

  const p = student.personalInfo || {};
  const prog = student.programmeInfo?.programme;
  const hs = student.highSchoolInfo || {};
  const fees = student.fees || { total: 0, paid: 0, balance: 0, currency: 'KES' };
  const billings = student.billings || [];
  const payments = student.payments || [];

  const methodLabel = { bank: 'Bank Transfer', mpesa: 'M-Pesa', cheque: 'Cheque' };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="text-3xl">🎓</span>
        <h2 className="text-2xl font-bold text-gray-800">Student Record</h2>
        {student.studentNumber && (
          <span className="font-mono text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
            {student.studentNumber}
          </span>
        )}
        {student.applicationNumber && (
          <span className="font-mono text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {student.applicationNumber}
          </span>
        )}
        <button
          onClick={() => navigate('/students')}
          className="ml-auto bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        {/* Personal */}
        <section>
          <h3 className="text-lg font-semibold mb-3">👤 Personal Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full name" value={[p.title, p.surname, p.lastName].filter(Boolean).join(' ')} />
            <Field label="Email" value={p.email} />
            <Field label="Phone" value={p.mobile} />
            <Field label="Nationality" value={p.nationality} />
            <Field label="ID Number" value={p.idNumber} />
            <Field label="Address" value={p.address} />
          </div>
        </section>

        {/* Programme */}
        <section>
          <h3 className="text-lg font-semibold mb-3">🎯 Programme</h3>
          {prog ? (
            <>
              <p className="font-medium">{prog.name}</p>
              <p className="text-sm text-gray-500">{prog.code} · {prog.department}</p>
            </>
          ) : <p className="text-sm text-gray-400">No programme on record</p>}
        </section>

        {/* High School */}
        <section>
          <h3 className="text-lg font-semibold mb-3">📚 High School</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="School" value={hs.highSchool} />
            <Field label="Exam Body" value={hs.examBody} />
            <Field label="Mean Grade" value={hs.meanGrade} />
            <Field label="Year" value={hs.yearOfExam} />
          </div>
        </section>

        {/* ==================== FEES & BILLING ==================== */}
        <section className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">💰 Fees & Billing</h3>
            {isFinance && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBillingForm((v) => !v)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"
                >
                  {showBillingForm ? 'Close' : '+ Add Billing'}
                </button>
                <button
                  onClick={() => setShowPaymentForm((v) => !v)}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm"
                >
                  {showPaymentForm ? 'Close' : '+ Record Payment'}
                </button>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="rounded-lg p-4 border border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">Total Billed</p>
              <p className="text-lg font-semibold text-gray-800">KES {fees.total}</p>
            </div>
            <div className="rounded-lg p-4 border border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">Paid</p>
              <p className="text-lg font-semibold text-green-700">KES {fees.paid}</p>
            </div>
            <div className="rounded-lg p-4 border border-red-200 bg-red-50">
              <p className="text-xs text-gray-500">Balance</p>
              <p className="text-lg font-semibold text-red-700">KES {fees.balance}</p>
            </div>
          </div>

          {/* Add billing form */}
          {isFinance && showBillingForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <input
                  className="col-span-2 px-3 py-2 border rounded-lg"
                  placeholder="Label (e.g. Library Fee, Graduation Fee)"
                  value={billLabel}
                  onChange={(e) => setBillLabel(e.target.value)}
                />
                <input
                  type="number"
                  className="px-3 py-2 border rounded-lg"
                  placeholder="Amount"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                />
              </div>
              <button
                onClick={addBilling}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Billing'}
              </button>
            </div>
          )}

          {/* Record payment form */}
          {isFinance && showPaymentForm && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  className="px-3 py-2 border rounded-lg"
                  placeholder="Amount"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
                <select
                  className="px-3 py-2 border rounded-lg"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
                <input
                  className="px-3 py-2 border rounded-lg"
                  placeholder="Reference (e.g. QK12XYZ)"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                />
              </div>
              <input
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Note (optional)"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
              />
              <button
                onClick={recordPayment}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Record Payment'}
              </button>
            </div>
          )}

          {/* Billings table */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Billings</p>
            {billings.length === 0 ? (
              <p className="text-sm text-gray-400">No billings yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-3 py-2">Label</th>
                    <th className="text-right px-3 py-2">Amount (KES)</th>
                    <th className="text-left px-3 py-2">Added</th>
                    {isFinance && <th className="text-right px-3 py-2"></th>}
                  </tr>
                </thead>
                <tbody>
                  {billings.map((b) => (
                    <tr key={b._id} className="border-t">
                      <td className="px-3 py-2">{b.label}</td>
                      <td className="px-3 py-2 text-right">{b.amount}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </td>
                      {isFinance && (
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => removeBilling(b._id)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Payments ledger */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Payment Ledger</p>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-400">No payments recorded</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Method</th>
                    <th className="text-left px-3 py-2">Reference</th>
                    <th className="text-right px-3 py-2">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id} className="border-t">
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {new Date(p.paidAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">{methodLabel[p.method] || p.method}</td>
                      <td className="px-3 py-2 font-mono text-xs">{p.reference || '—'}</td>
                      <td className="px-3 py-2 text-right font-medium">{p.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Documents */}
        <section>
          <h3 className="text-lg font-semibold mb-3">📎 Documents ({student.documents?.length || 0})</h3>
          {student.documents?.length ? (
            student.documents.map((d) => (
              <div key={d._id} className="text-sm py-1">{d.name || d.filename}</div>
            ))
          ) : <p className="text-sm text-gray-400">No documents on file</p>}
        </section>

        {student.enrolledAt && (
          <p className="text-xs text-gray-400">
            Enrolled at: {new Date(student.enrolledAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium">{value || '—'}</p>
  </div>
);

export default StudentDetail;
