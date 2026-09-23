import React, { useState } from 'react';

const GRADES = ['A','A-','B+','B','B-','C+','C','C-','D+','D','D-','E'];
const COMMON_SUBJECTS = [
  'Mathematics','English','Kiswahili','Biology','Chemistry','Physics',
  'Geography','History','CRE','IRE','Business Studies','Agriculture',
  'Computer Studies','Home Science','Art & Design','Music','French','German'
];

const HighSchoolInfo = ({ data, setData, next, prev }) => {
  const [form, setForm] = useState(data || { subjects: [] });
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addSubject = () => {
    if (!subject || !grade) { setError('Please select both subject and grade'); return; }
    if (form.subjects?.some(s => s.subject === subject)) { setError('Subject already added'); return; }
    setForm({ ...form, subjects: [...(form.subjects || []), { subject, grade }] });
    setSubject(''); setGrade(''); setError('');
  };

  const removeSubject = (idx) => setForm({ ...form, subjects: form.subjects.filter((_, i) => i !== idx) });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.highSchool || !form.examBody || !form.yearOfExam || !form.level || !form.meanGrade) {
      setError('Please fill in all required fields'); return;
    }
    if (!form.subjects || form.subjects.length < 2) { setError('Please add at least 2 subjects'); return; }
    setData(form); next();
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
        <span className="text-2xl">🏫</span>
        <h3 className="text-xl font-semibold text-gray-700">High School Information</h3>
        <span className="text-xs text-gray-400 ml-auto">Step 4 of 9</span>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">High School <span className="text-red-500">*</span></label>
          <input name="highSchool" value={form.highSchool || ''} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Examination Body <span className="text-red-500">*</span></label>
          <select name="examBody" value={form.examBody || ''} onChange={handleChange} className={inputClass} required>
            <option value="">Select exam body</option>
            <option>KNEC</option><option>IGCSE</option><option>IB</option><option>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Year of Examination <span className="text-red-500">*</span></label>
          <input type="number" name="yearOfExam" value={form.yearOfExam || ''} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Level <span className="text-red-500">*</span></label>
          <select name="level" value={form.level || ''} onChange={handleChange} className={inputClass} required>
            <option value="">Select level</option>
            <option>O-Level</option><option>A-Level</option><option>IGCSE</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mean Grade <span className="text-red-500">*</span></label>
          <select name="meanGrade" value={form.meanGrade || ''} onChange={handleChange} className={inputClass} required>
            <option value="">Select mean grade</option>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h4 className="font-semibold text-gray-700 mb-3">
          Subjects & Grades <span className="text-red-500">*</span>
          <span className="text-xs text-gray-400 font-normal ml-2">(minimum 2 subjects)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-2 mb-3">
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass}>
            <option value="">Select subject</option>
            {COMMON_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className={inputClass}>
            <option value="">Grade</option>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <button type="button" onClick={addSubject} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition whitespace-nowrap">+ Add</button>
        </div>

        {form.subjects?.length > 0 && (
          <div className="space-y-2">
            {form.subjects.map((s, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-800">{s.subject}</span>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">{s.grade}</span>
                </div>
                <button type="button" onClick={() => removeSubject(i)} className="text-red-500 hover:text-red-700 text-sm font-medium">✕ Remove</button>
              </div>
            ))}
            <p className="text-xs text-gray-400 mt-2">{form.subjects.length} subject(s) added</p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <button type="button" onClick={prev} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-8 py-2.5 rounded-lg transition">← Back</button>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2.5 rounded-lg transition">Next Step →</button>
      </div>
    </form>
  );
};

export default HighSchoolInfo;
