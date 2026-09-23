import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PersonalDetails from '../components/StudentApplication/Steps/PersonalDetails';
import ProgrammeInfo from '../components/StudentApplication/Steps/ProgrammeInfo';
import GuardianInfo from '../components/StudentApplication/Steps/GuardianInfo';
import HighSchoolInfo from '../components/StudentApplication/Steps/HighSchoolInfo';
import EducationBackground from '../components/StudentApplication/Steps/EducationBackground';
import WorkExperience from '../components/StudentApplication/Steps/WorkExperience';
import DocumentUpload from '../components/StudentApplication/DocumentUpload';
import Review from '../components/StudentApplication/Review';
import Payment from '../components/StudentApplication/Payment';

const Apply = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [appNumber, setAppNumber] = useState('');
  const navigate = useNavigate();

  const next = () => setStep(s => s + 1);
  const prev = () => setStep(s => s - 1);
  const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const steps = [
    { component: <PersonalDetails data={formData.personal} setData={(d) => update('personal', d)} next={next} />, label: 'Personal' },
    { component: <ProgrammeInfo data={formData.programme} setData={(d) => update('programme', d)} next={next} prev={prev} />, label: 'Programme' },
    { component: <GuardianInfo data={formData.guardian} setData={(d) => update('guardian', d)} next={next} prev={prev} />, label: 'Guardian' },
    { component: <HighSchoolInfo data={formData.highSchool} setData={(d) => update('highSchool', d)} next={next} prev={prev} />, label: 'High School' },
    { component: <EducationBackground data={formData.education} setData={(d) => update('education', d)} next={next} prev={prev} />, label: 'Education' },
    { component: <WorkExperience data={formData.experience} setData={(d) => update('experience', d)} next={next} prev={prev} />, label: 'Experience' },
    { component: <DocumentUpload data={formData.documents} setData={(d) => update('documents', d)} next={next} prev={prev} />, label: 'Documents' },
    { component: <Review data={formData} next={next} prev={prev} />, label: 'Review' },
    { component: <Payment data={formData.payment} setData={(d) => update('payment', d)} prev={prev} next={next} />, label: 'Payment' },
  ];

  if (step > steps.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-green-600 mb-2">Application Submitted!</h1>
        <p className="text-gray-600 mb-6">Your application is now being processed.</p>

        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-8">
          <p className="text-sm text-blue-600 mb-1">Your Application Number</p>
          <p className="text-3xl font-bold text-blue-800 tracking-wider">{appNumber || 'APP-2026-XXXXX'}</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-yellow-800 mb-3">⏳ What Happens Next?</h2>
          <ul className="space-y-2 text-sm text-yellow-700">
            <li>💰 The <strong>Finance Office</strong> will process your application fee.</li>
            <li>📋 Once payment is confirmed, your application moves to <strong>Admissions</strong>.</li>
            <li>📧 You'll receive updates via email.</li>
            <li>📊 Track everything from your dashboard.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/tracking')} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition">📊 Track Application</button>
          <button onClick={() => navigate('/portal')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-6 py-3 rounded-lg transition">🏠 Go to portal</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">📝 Student Application</h1>
        <p className="text-gray-500">Complete all 9 steps to submit your application</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                step > i + 1 ? 'bg-blue-600 text-white' :
                step === i + 1 ? 'bg-blue-600 text-white ring-4 ring-blue-200' :
                'bg-gray-200 text-gray-500'
              }`}>{i + 1}</div>
              {i < steps.length - 1 && (<div className={`w-8 h-1 ${step > i + 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />)}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        {steps[step - 1].component}
      </div>
    </div>
  );
};

export default Apply;
