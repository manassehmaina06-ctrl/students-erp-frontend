import React, { useState } from 'react';

const PersonalDetails = ({ data, setData, next }) => {
  const [form, setForm] = useState(data || {});
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const required = ['title','surname','lastName','dob','gender','maritalStatus',
                      'nationality','countryOfOrigin','homeTown','mobile','email',
                      'idNumber','birthCertNo','campus'];
    for (const field of required) {
      if (!form[field]) { setError('Please fill in all required fields'); return; }
    }
    setData(form); next();
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
        <span className="text-2xl">👤</span>
        <h3 className="text-xl font-semibold text-gray-700">Personal Details</h3>
        <span className="text-xs text-gray-400 ml-auto">Step 1 of 9</span>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
          <select name="title" value={form.title || ''} onChange={handleChange} className={inputClass} required>
            <option value="">Select</option><option>Mr</option><option>Mrs</option><option>Miss</option><option>Dr</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Surname (KCSE) <span className="text-red-500">*</span></label>
          <input name="surname" value={form.surname || ''} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name <span className="text-red-500">*</span></label>
          <input name="lastName" value={form.lastName || ''} onChange={handleChange} className={inputClass} required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
          <input type="date" name="dob" value={form.dob || ''} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender <span className="text-red-500">*</span></label>
          <select name="gender" value={form.gender || ''} onChange={handleChange} className={inputClass} required>
            <option value="">Select</option><option>Male</option><option>Female</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Marital Status <span className="text-red-500">*</span></label>
          <select name="maritalStatus" value={form.maritalStatus || ''} onChange={handleChange} className={inputClass} required>
            <option value="">Select</option><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">ID / Passport No <span className="text-red-500">*</span></label>
          <input name="idNumber" value={form.idNumber || ''} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Birth Certificate No <span className="text-red-500">*</span></label>
          <input name="birthCertNo" value={form.birthCertNo || ''} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nationality <span className="text-red-500">*</span></label>
          <input name="nationality" value={form.nationality || ''} onChange={handleChange} className={inputClass} required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Country of Origin <span className="text-red-500">*</span></label>
          <input name="countryOfOrigin" value={form.countryOfOrigin || ''} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Home Town <span className="text-red-500">*</span></label>
          <input name="homeTown" value={form.homeTown || ''} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Campus <span className="text-red-500">*</span></label>
          <select name="campus" value={form.campus || ''} onChange={handleChange} className={inputClass} required>
            <option value="">Select campus</option><option>Main Campus</option><option>Town Campus</option><option>Kisumu Campus</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
          <input name="mobile" value={form.mobile || ''} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
          <input type="email" name="email" value={form.email || ''} onChange={handleChange} className={inputClass} required />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Physical Address</label>
        <input name="address" value={form.address || ''} onChange={handleChange} className={inputClass} />
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2.5 rounded-lg transition">Next Step →</button>
      </div>
    </form>
  );
};

export default PersonalDetails;
