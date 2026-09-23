import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const Payment = ({ data, setData, prev, next }) => {
  const [amount, setAmount] = useState('2000');
  const [currency, setCurrency] = useState('KES');
  const [processing, setProcessing] = useState(false);
  const [appNumber, setAppNumber] = useState('');

  useEffect(() => {
api.get('/students/profile')
      .then(res => setAppNumber(res.data.applicationNumber || ''))
      .catch(console.error);
  }, []);

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) { alert('Enter a valid amount'); return; }
    setProcessing(true);
    try {
    const res = await api.post('/payments', { amount, currency });
     await api.put(`/payments/confirm/${res.data._id}`);
      setData(res.data);
      if (next) next();
    } catch (err) {
      alert('Payment failed: ' + (err.response?.data?.message || err.message));
    }
    setProcessing(false);
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 transition";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
        <span className="text-2xl">💳</span>
        <h3 className="text-xl font-semibold text-gray-700">Application Fee Payment</h3>
        <span className="text-xs text-gray-400 ml-auto">Step 9 of 9</span>
      </div>

      {appNumber && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
          <p className="text-xs text-blue-600 uppercase font-semibold">Your Application Number</p>
          <p className="text-2xl font-bold text-blue-800 tracking-wider mt-1">{appNumber}</p>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
        ⏳ Payment is required to proceed. Finance will confirm your payment and pass your application to Admissions.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount *</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
            <option value="KES">KES (KSh)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <button type="button" onClick={prev} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-8 py-2.5 rounded-lg transition">← Back</button>
        <button type="button" onClick={handlePayment} disabled={processing} className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-2.5 rounded-lg transition disabled:opacity-50">
          {processing ? 'Processing...' : '💳 Pay & Submit'}
        </button>
      </div>
    </div>
  );
};

export default Payment;
