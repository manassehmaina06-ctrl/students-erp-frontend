import React, { useState } from 'react';
import api from '../../api/axios';
const Review = ({ data, next, prev }) => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
   await api.put('/students/application', {
        personalInfo: data.personal,
        programmeInfo: data.programme,
        guardianInfo: data.guardian,
        highSchoolInfo: data.highSchool,
        educationBackground: data.education,
        experience: data.experience,
      });

    const res = await api.post('/applications/submit');
      alert(`✅ Application submitted!\nApplication No: ${res.data.applicationNumber}\n\nPlease proceed to pay the application fee.`);
      next();
    } catch (err) {
      alert('Submission failed: ' + (err.response?.data?.message || err.message));
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
        <span className="text-2xl">📋</span>
        <h3 className="text-xl font-semibold text-gray-700">Review Your Application</h3>
        <span className="text-xs text-gray-400 ml-auto">Step 8 of 9</span>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        ℹ️ Please review your information. After submission, you'll get a unique <strong>Application Number</strong> for payment.
      </div>

      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto text-sm">
        <pre className="whitespace-pre-wrap font-mono text-xs">{JSON.stringify(data, null, 2)}</pre>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <button type="button" onClick={prev} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-8 py-2.5 rounded-lg transition">← Back</button>
        <button type="button" onClick={handleSubmit} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-2.5 rounded-lg transition disabled:opacity-50">
          {submitting ? 'Submitting...' : '✅ Submit Application'}
        </button>
      </div>
    </div>
  );
};

export default Review;
