import React, { useState } from 'react';

const AcademicInfo = ({ data, setData, next, prev }) => {
  const [form, setForm] = useState(data);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubjects = (e) => {
    const subjects = e.target.value.split(',').map(s => s.trim()).filter(s => s);
    setForm({ ...form, subjects });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setData(form);
    next();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
        <span className="text-2xl">📚</span>
        <h3 className="text-xl font-semibold text-gray-700">Academic Information</h3>
        <span className="text-xs text-gray-400 ml-auto">Step 2 of 6</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          High School
        </label>
        <input
          name="highSchool"
          placeholder="Enter high school name"
          value={form.highSchool || ''}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50 hover:bg-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Graduation Year
          </label>
          <input
            name="graduationYear"
            type="number"
            placeholder="e.g., 2026"
            value={form.graduationYear || ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50 hover:bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            GPA
          </label>
          <input
            name="gpa"
            type="number"
            step="0.01"
            placeholder="e.g., 3.5"
            value={form.gpa || ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50 hover:bg-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Subjects (comma separated)
        </label>
        <input
          name="subjects"
          placeholder="e.g., Mathematics, English, Physics"
          value={form.subjects ? form.subjects.join(', ') : ''}
          onChange={handleSubjects}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50 hover:bg-white"
        />
        <p className="text-xs text-gray-400 mt-1">Separate each subject with a comma</p>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={prev}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-8 py-2.5 rounded-lg transition"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2.5 rounded-lg transition shadow-sm hover:shadow-md"
        >
          Next Step →
        </button>
      </div>
    </form>
  );
};

export default AcademicInfo;