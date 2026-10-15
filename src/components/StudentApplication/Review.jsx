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
      alert('✅ Application submitted!\n\nApplication No: ' + res.data.applicationNumber + '\n\nPlease proceed to pay the application fee.');
      next();
    } catch (err) {
      alert('Submission failed: ' + (err.response?.data?.message || err.message));
    }
    setSubmitting(false);
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(); } catch { return d; }
  };

  const Row = ({ label, value }) => (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
      <p className="text-sm text-slate-800 dark:text-slate-200 mt-0.5 break-words">{value || '—'}</p>
    </div>
  );

  const Section = ({ icon, title, children }) => (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <span className="text-lg">{icon}</span>
        <h4 className="font-display font-semibold text-slate-800 dark:text-slate-100 text-sm">{title}</h4>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );

  const personal = data.personal || {};
  const programme = data.programme || {};
  const guardian = data.guardian || {};
  const highSchool = data.highSchool || {};
  const education = data.education || [];
  const experience = data.experience || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <span className="text-2xl">📋</span>
        <h3 className="font-display text-xl font-semibold text-slate-800 dark:text-slate-100">Review Your Application</h3>
        <span className="text-xs text-slate-400 ml-auto">Step 8 of 9</span>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300">
        ℹ️ Please review your information carefully. After submission, you'll get a unique <strong>Application Number</strong> for payment.
      </div>

      <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
        {/* Personal */}
        <Section icon="👤" title="Personal Information">
          <Row label="Title"           value={personal.title} />
          <Row label="Surname"         value={personal.surname} />
          <Row label="Last Name"       value={personal.lastName} />
          <Row label="Date of Birth"   value={fmtDate(personal.dob)} />
          <Row label="Gender"          value={personal.gender} />
          <Row label="Marital Status"  value={personal.maritalStatus} />
          <Row label="Nationality"     value={personal.nationality} />
          <Row label="Country of Origin" value={personal.countryOfOrigin} />
          <Row label="Home Town"       value={personal.homeTown} />
          <Row label="Mobile"          value={personal.mobile} />
          <Row label="Email"           value={personal.email} />
          <Row label="ID Number"       value={personal.idNumber} />
          <Row label="Birth Cert No"   value={personal.birthCertNo} />
          <Row label="Campus"          value={personal.campus} />
          <Row label="Address"         value={personal.address} />
        </Section>

        {/* Programme */}
        <Section icon="🎓" title="Programme Choice">
          <Row label="Mode of Study" value={programme.modeOfStudy} />
          <Row label="Programme"     value={programme.programmeName || programme.programme} />
        </Section>

        {/* Guardian */}
        <Section icon="👨‍👩‍👦" title="Guardian Information">
          <Row label="Full Name"     value={guardian.fullName || guardian.name} />
          <Row label="Relationship"  value={guardian.relationship} />
          <Row label="Mobile"        value={guardian.mobile} />
          <Row label="Email"         value={guardian.email} />
        </Section>

        {/* High School */}
        <Section icon="🏫" title="High School Information">
          <Row label="High School"   value={highSchool.school || highSchool.highSchool} />
          <Row label="Exam Body"     value={highSchool.examBody} />
          <Row label="Year of Exam"  value={highSchool.yearOfExam} />
          <Row label="Level"         value={highSchool.level} />
          <Row label="Mean Grade"    value={highSchool.meanGrade} />
        </Section>

        {/* Subjects */}
        {Array.isArray(highSchool.subjects) && highSchool.subjects.length > 0 && (
          <Section icon="📚" title="Subjects & Grades">
            {highSchool.subjects.map((s, i) => (
              <Row key={i} label={s.name || 'Subject ' + (i+1)} value={s.grade} />
            ))}
          </Section>
        )}

        {/* Education Background */}
        {education.length > 0 && (
          <Section icon="🎓" title="Education Background">
            {education.map((e, i) => (
              <Row key={i} label={e.institution || 'Entry ' + (i+1)}
                   value={[e.qualification, e.year].filter(Boolean).join(' · ')} />
            ))}
          </Section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <Section icon="💼" title="Work Experience">
            {experience.map((e, i) => (
              <Row key={i} label={e.company || 'Entry ' + (i+1)}
                   value={[e.role, e.years].filter(Boolean).join(' · ')} />
            ))}
          </Section>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <button type="button" onClick={prev}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium px-8 py-2.5 rounded-lg transition">
          ← Back
        </button>
        <button type="button" onClick={handleSubmit} disabled={submitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 py-2.5 rounded-lg transition disabled:opacity-50 shadow-sm hover:shadow-md">
          {submitting ? 'Submitting…' : '✅ Submit Application'}
        </button>
      </div>
    </div>
  );
};

export default Review;
