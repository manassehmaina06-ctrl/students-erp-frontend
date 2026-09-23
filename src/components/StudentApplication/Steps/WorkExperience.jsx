import React, { useState } from 'react';

const WorkExperience = ({ data, setData, next, prev }) => {
  const [list, setList] = useState(data || []);
  const [form, setForm] = useState({ company: '', jobTitle: '', years: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const add = () => {
    if (!form.company) return;
    setList([...list, form]);
    setForm({ company: '', jobTitle: '', years: '' });
  };
  const remove = (i) => setList(list.filter((_, idx) => idx !== i));

  const handleSubmit = (e) => { e.preventDefault(); setData(list); next(); };

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
        <span className="text-2xl">💼</span>
        <h3 className="text-xl font-semibold text-gray-700">Work Experience</h3>
        <span className="text-xs text-gray-400 ml-auto">Step 6 of 9</span>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        ℹ️ Optional – Add your work experience if any
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input name="company" value={form.company} onChange={handleChange} placeholder="Company" className={inputClass} />
        <input name="jobTitle" value={form.jobTitle} onChange={handleChange} placeholder="Job Title" className={inputClass} />
        <input name="years" value={form.years} onChange={handleChange} placeholder="Years" className={inputClass} />
      </div>
      <button type="button" onClick={add} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg">+ Add Experience</button>

      <div className="space-y-2">
        {list.map((e, i) => (
          <div key={i} className="bg-gray-50 p-3 rounded-lg">
            <p className="font-medium">{e.jobTitle} at {e.company}</p>
            <p className="text-sm text-gray-500">{e.years} years</p>
            <button type="button" onClick={() => remove(i)} className="text-red-500 text-sm mt-1">Remove</button>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <button type="button" onClick={prev} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-8 py-2.5 rounded-lg transition">← Back</button>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2.5 rounded-lg transition">Next Step →</button>
      </div>
    </form>
  );
};

export default WorkExperience;
