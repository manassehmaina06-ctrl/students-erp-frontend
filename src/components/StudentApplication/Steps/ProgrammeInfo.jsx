import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';

const ProgrammeInfo = ({ data, setData, next, prev }) => {
  const [form, setForm] = useState(data || {});
  const [programmes, setProgrammes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
api.get('/programmes').then(res => setProgrammes(res.data)).catch(console.error);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.modeOfStudy || !form.programme) {
      setError('Please select mode of study and programme'); return;
    }
    setData(form); next();
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
        <span className="text-2xl">🎓</span>
        <h3 className="text-xl font-semibold text-gray-700">Programme & Study Mode</h3>
        <span className="text-xs text-gray-400 ml-auto">Step 2 of 9</span>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mode of Study <span className="text-red-500">*</span></label>
        <select name="modeOfStudy" value={form.modeOfStudy || ''} onChange={handleChange} className={inputClass} required>
          <option value="">Select mode</option>
          <option value="FT">Full Time (FT)</option>
          <option value="PT">Part Time (PT)</option>
          <option value="DL">Distance Learning (DL)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Course You Want to Pursue <span className="text-red-500">*</span></label>
        <select name="programme" value={form.programme || ''} onChange={handleChange} className={inputClass} required>
          <option value="">Select course</option>
          {programmes.map(p => <option key={p._id} value={p._id}>{p.name} ({p.code})</option>)}
        </select>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <button type="button" onClick={prev} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-8 py-2.5 rounded-lg transition">← Back</button>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2.5 rounded-lg transition">Next Step →</button>
      </div>
    </form>
  );
};

export default ProgrammeInfo;
