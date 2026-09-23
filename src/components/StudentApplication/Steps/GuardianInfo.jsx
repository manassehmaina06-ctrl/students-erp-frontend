import React, { useState } from 'react';

const GuardianInfo = ({ data, setData, next, prev }) => {
  const [form, setForm] = useState(data || {});
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile || !form.relationship) {
      setError('Please fill in all required fields'); return;
    }
    setData(form); next();
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
        <span className="text-2xl">👨‍👩‍👧</span>
        <h3 className="text-xl font-semibold text-gray-700">Parent / Guardian Details</h3>
        <span className="text-xs text-gray-400 ml-auto">Step 3 of 9</span>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
        <input name="name" value={form.name || ''} onChange={handleChange} className={inputClass} required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
          <input name="mobile" value={form.mobile || ''} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Relationship <span className="text-red-500">*</span></label>
          <select name="relationship" value={form.relationship || ''} onChange={handleChange} className={inputClass} required>
            <option value="">Select</option>
            <option>Father</option><option>Mother</option><option>Guardian</option>
            <option>Spouse</option><option>Sibling</option><option>Other</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <button type="button" onClick={prev} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-8 py-2.5 rounded-lg transition">← Back</button>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2.5 rounded-lg transition">Next Step →</button>
      </div>
    </form>
  );
};

export default GuardianInfo;
