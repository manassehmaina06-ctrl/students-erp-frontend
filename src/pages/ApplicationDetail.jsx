import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import BillingModal from '../components/BillingModal';

const MODE_OPTIONS = [
  { value: 'FT',  label: 'Full-Time' },
  { value: 'PT',  label: 'Part-Time' },
  { value: 'ODL', label: 'Open Distance Learning' },
  { value: 'EB',  label: 'Evening' },
];

const STATUS_ACTIONS = {
  submitted: {
    admissions: [
      { label: 'Open Review', next: 'pending_approval', color: 'blue' },
      { label: 'Reject',      next: 'rejected',         color: 'red', askNote: true },
    ],
    academic: [
      { label: 'Open Review', next: 'pending_approval', color: 'blue' },
    ],
  },
  pending_approval: {
    admissions: [
      { label: 'Process → Finance', next: 'approved', color: 'green' },
      { label: 'Reject',            next: 'rejected', color: 'red', askNote: true },
    ],
    academic: [
      { label: 'Process → Finance', next: 'approved', color: 'green' },
    ],
  },
  approved: {
    finance: [
      { label: 'Validate Payment', next: 'finance_review', color: 'blue' },
    ],
  },
  finance_review: {
    finance: [
      { label: 'Payment Confirmed', next: 'payment_validated', color: 'green' },
    ],
  },
  payment_validated: {
    admissions: [
      { label: 'Admit Student', next: 'admitted', color: 'green' },
      { label: 'Reject',        next: 'rejected', color: 'red', askNote: true },
    ],
    academic: [
      { label: 'Admit Student', next: 'admitted', color: 'green' },
    ],
  },
  admitted: {
    finance: [
      { label: 'Create Student Account', next: 'enrolled', color: 'purple' },
    ],
  },
};

const STATUS_PILL = {
  draft:             'bg-gray-100 text-gray-700',
  submitted:         'bg-blue-100 text-blue-800',
  pending_approval:  'bg-yellow-100 text-yellow-800',
  approved:          'bg-indigo-100 text-indigo-800',
  finance_review:    'bg-orange-100 text-orange-800',
  payment_validated: 'bg-teal-100 text-teal-800',
  admitted:          'bg-green-100 text-green-800',
  rejected:          'bg-red-100 text-red-800',
  enrolled:          'bg-purple-100 text-purple-800',
};

const statusLabel = (s) =>
  (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const btnClass = (color) => {
  const map = {
    blue:   'bg-blue-500 hover:bg-blue-600',
    green:  'bg-green-500 hover:bg-green-600',
    red:    'bg-red-500 hover:bg-red-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
  };
  return `${map[color] || map.blue} text-white px-5 py-2.5 rounded-lg transition shadow-sm hover:shadow-md disabled:opacity-50`;
};

// Admissions and academic can edit at any status (per business rule)
const EDITABLE_STATUSES = null;   // null = no filter

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value || '—'}</p>
    </div>
  );
}

function FieldInput({ label, value, onChange, type = 'text', disabled = false, as = 'input', options = [] }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      {as === 'select' ? (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg text-sm ${
            disabled ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none'
          }`}
        >
          <option value="">—</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg text-sm ${
            disabled ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none'
          }`}
        />
      )}
    </div>
  );
}

const ApplicationDetail = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    personalInfo:        {},
    guardianInfo:        {},
    highSchoolInfo:      {},
    educationBackground: [],
    experience:          [],
    programmeInfo:       {},
  });
  const [comments, setComments] = useState('');
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [studentLedger, setStudentLedger] = useState(null);
  const [resettingPwd, setResettingPwd] = useState(false);

  const fetchApplication = async () => {
    try {
      const res = await api.get(`/applications/${id}`);
      setApplication(res.data);
      const sid = res.data.studentId?._id || res.data.studentId;
      if (sid && res.data.status === 'enrolled') {
        try {
          const feeRes = await api.get(`/fees/${sid}/ledger`);
          setStudentLedger(feeRes.data);
        } catch { setStudentLedger(null); }
      } else {
        setStudentLedger(null);
      }
      setComments(res.data.comments || '');
      const s = res.data.studentId || {};
      setEditData({
        personalInfo:        s.personalInfo        || {},
        guardianInfo:        s.guardianInfo        || {},
        highSchoolInfo:      s.highSchoolInfo      || {},
        educationBackground: s.educationBackground || [],
        experience:          s.experience          || [],
        programmeInfo:       s.programmeInfo       || {},
      });
    } catch (err) {
      console.error(err);
      alert('Failed to load application');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplication(); }, [id, token]);

  const handleStatusUpdate = async (next, askNote, extraPayload = {}) => {
    if (next === 'enrolled' && !extraPayload.billings) {
      setShowBillingModal(true);
      return;
    }

    let note = '';
    if (askNote) {
      const input = window.prompt('Reason / note for this action:');
      if (input === null) return;
      note = input;
    }

    const payload = { status: next, note, ...extraPayload };

    if (next === 'payment_validated') {
      const feeStr = window.prompt('Application fee amount (e.g. 2000):');
      if (feeStr !== null && feeStr.trim() !== '') payload.applicationFee = Number(feeStr);
      const paidStr = window.prompt('Amount paid (e.g. 2000):');
      if (paidStr !== null && paidStr.trim() !== '') payload.applicationFeePaid = Number(paidStr);
    }

    if (!window.confirm(`Move application to "${statusLabel(next)}"?`)) return;

    setSaving(true);
    try {
      await api.patch(`/applications/${id}/status`, payload);
      await fetchApplication();
      setShowBillingModal(false);
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.message || err.message));
    }
    setSaving(false);
  };

  const handleAddSemesterBillings = async (payload) => {
    try {
      setSaving(true);
      const sid = application.studentId?._id || application.studentId;
      await api.post(`/fees/${sid}/semesters`, payload);
      setShowSemesterModal(false);
      await fetchApplication();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };


    const downloadReceipt = async (receiptNumber) => {
    try {
      const res = await api.get(`/fees/receipt/${receiptNumber}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download receipt: ' + (err.response?.data?.message || err.message));
    }
  };
  const saveEdits = async () => {
    setSaving(true);
    try {
      const studentId = application.studentId?._id || application.studentId;
      if (!studentId) throw new Error('Missing student link');

      const payload = {
        personalInfo:        editData.personalInfo,
        guardianInfo:        editData.guardianInfo,
        highSchoolInfo:      editData.highSchoolInfo,
        educationBackground: editData.educationBackground,
        experience:          editData.experience,
      };
      // Academic-only: programme + mode of study
      if (user?.role === 'academic') {
        payload.programmeInfo = editData.programmeInfo;
      }

      await api.put(`/students/${studentId}`, payload);
      await api.put(`/applications/${id}`, { comments });

      setIsEditing(false);
      await fetchApplication();
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.message || err.message));
    }
    setSaving(false);
  };

  const resetPassword = async () => {
    const studentId = application.studentId?._id || application.studentId;
    if (!studentId) return alert('Missing student link');
    if (!window.confirm("Reset this student's portal password to their ID number?")) return;
    setResettingPwd(true);
    try {
      const res = await api.post(`/students/${studentId}/reset-password`);
      alert(`Password reset.\n\nUsername: ${res.data.username}\nPassword is now: ${res.data.passwordHint || 'their ID number'}`);
    } catch (err) {
      alert('Reset failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setResettingPwd(false);
    }
  };

  const setP    = (f, v) => setEditData((p) => ({ ...p, personalInfo:   { ...p.personalInfo,   [f]: v } }));
  const setG    = (f, v) => setEditData((p) => ({ ...p, guardianInfo:   { ...p.guardianInfo,   [f]: v } }));
  const setH    = (f, v) => setEditData((p) => ({ ...p, highSchoolInfo: { ...p.highSchoolInfo, [f]: v } }));
  const setProg = (f, v) => setEditData((p) => ({ ...p, programmeInfo:  { ...p.programmeInfo,  [f]: v } }));

  if (loading) return <div className="p-10 text-gray-500">Loading application...</div>;
  if (!application) return <div className="p-10 text-gray-500">Application not found</div>;

  const student    = application.studentId || {};
  const personal   = isEditing ? editData.personalInfo   : (student.personalInfo   || {});
  const guardian   = isEditing ? editData.guardianInfo   : (student.guardianInfo   || {});
  const highSchool = isEditing ? editData.highSchoolInfo : (student.highSchoolInfo || {});
  const education  = isEditing ? editData.educationBackground : (student.educationBackground || []);
  const experience = isEditing ? editData.experience     : (student.experience     || []);
  const progInfo   = isEditing ? editData.programmeInfo  : (student.programmeInfo  || {});

  const role = user?.role;
  const actions = (STATUS_ACTIONS[application.status] || {})[role] || [];
  const canEdit = ['admissions', 'academic'].includes(role);
  const canEditProgramme = ['admissions', 'academic'].includes(role);
  const programme = application.programmeId || student.programmeInfo?.programme || null;

  const feesSource = studentLedger?.fees || {
    total:   application.feeAmount ?? 0,
    paid:    application.feePaid ?? 0,
    balance: (application.feeAmount ?? 0) - (application.feePaid ?? 0),
  };
  const totalFee = feesSource.total;
  const paidFee  = feesSource.paid;
  const balance  = feesSource.balance;

  const credentials = application.credentials;
  const isEnrolled  = application.status === 'enrolled';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-3xl">📄</span>
          <h2 className="text-2xl font-bold text-gray-800">Application Details</h2>
          {application.applicationNumber && (
            <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {application.applicationNumber}
            </span>
          )}
          {application.studentNumber && (
            <span className="text-sm font-mono text-purple-700 bg-purple-100 px-2 py-1 rounded">
              🎓 {application.studentNumber}
            </span>
          )}
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${STATUS_PILL[application.status] || ''}`}>
            {statusLabel(application.status)}
          </span>
        </div>
        <div className="flex gap-2">
          {canEdit && !isEditing && (
            <button onClick={() => setIsEditing(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
              ✏️ Edit
            </button>
          )}
          {canEdit && isEditing && (
            <>
              <button onClick={saveEdits} disabled={saving}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
                {saving ? 'Saving...' : '💾 Save'}
              </button>
              <button onClick={() => { setIsEditing(false); fetchApplication(); }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">
                Cancel
              </button>
            </>
          )}
          <button onClick={() => navigate(-1)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">
            ← Back
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* PORTAL CREDENTIALS */}
        {isEnrolled && credentials && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🔐 Portal Credentials</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Username" value={credentials.username} />
              <Field label="School Email" value={credentials.schoolEmail} />
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Portal Password</p>
                <p className="font-medium text-gray-800">
                  •••••••• <span className="text-xs text-gray-500 ml-2">({credentials.passwordHint})</span>
                </p>
              </div>
            </div>
            {['admissions', 'academic'].includes(user?.role) && (
              <button
                onClick={resetPassword}
                disabled={resettingPwd}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm"
              >
                {resettingPwd ? 'Resetting…' : '🔄 Reset password to ID number'}
              </button>
            )}
          </div>
        )}

        {/* PERSONAL INFO */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">👤 Personal Information</h3>
          {isEditing ? (
            <div className="grid grid-cols-3 gap-4">
              <FieldInput label="Title"             value={personal.title}           onChange={(v) => setP('title', v)} />
              <FieldInput label="Surname (KCSE)"    value={personal.surname}         onChange={(v) => setP('surname', v)} />
              <FieldInput label="Last Name"         value={personal.lastName}        onChange={(v) => setP('lastName', v)} />
              <FieldInput label="Date of Birth"     value={personal.dob?.slice(0, 10)} onChange={(v) => setP('dob', v)} type="date" />
              <FieldInput label="Gender"            value={personal.gender}          onChange={(v) => setP('gender', v)} />
              <FieldInput label="Marital Status"    value={personal.maritalStatus}   onChange={(v) => setP('maritalStatus', v)} />
              <FieldInput label="Nationality"       value={personal.nationality}     onChange={(v) => setP('nationality', v)} />
              <FieldInput label="Country of Origin" value={personal.countryOfOrigin} onChange={(v) => setP('countryOfOrigin', v)} />
              <FieldInput label="Home Town"         value={personal.homeTown}        onChange={(v) => setP('homeTown', v)} />
              <FieldInput label="Mobile"            value={personal.mobile}          onChange={(v) => setP('mobile', v)} />
              <FieldInput label="Email"             value={personal.email}           onChange={(v) => setP('email', v)} />
              <FieldInput label="ID Number"         value={personal.idNumber}        onChange={(v) => setP('idNumber', v)} />
              <FieldInput label="Birth Cert No"     value={personal.birthCertNo}     onChange={(v) => setP('birthCertNo', v)} />
              <FieldInput label="Campus"            value={personal.campus}          onChange={(v) => setP('campus', v)} />
              <div className="col-span-2">
                <FieldInput label="Address" value={personal.address} onChange={(v) => setP('address', v)} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <Field label="Title"             value={personal.title} />
              <Field label="Surname"           value={personal.surname} />
              <Field label="Last Name"         value={personal.lastName} />
              <Field label="Date of Birth"     value={personal.dob ? new Date(personal.dob).toLocaleDateString() : '—'} />
              <Field label="Gender"            value={personal.gender} />
              <Field label="Marital Status"    value={personal.maritalStatus} />
              <Field label="Nationality"       value={personal.nationality} />
              <Field label="Country of Origin" value={personal.countryOfOrigin} />
              <Field label="Home Town"         value={personal.homeTown} />
              <Field label="Mobile"            value={personal.mobile} />
              <Field label="Email"             value={personal.email} />
              <Field label="ID Number"         value={personal.idNumber} />
              <Field label="Birth Cert No"     value={personal.birthCertNo} />
              <Field label="Campus"            value={personal.campus} />
              <div className="col-span-3">
                <Field label="Address" value={personal.address} />
              </div>
            </div>
          )}
        </div>

        {/* GUARDIAN */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">👨‍👩‍👧 Guardian Information</h3>
          {isEditing ? (
            <div className="grid grid-cols-3 gap-4">
              <FieldInput label="Full Name"    value={guardian.name}         onChange={(v) => setG('name', v)} />
              <FieldInput label="Mobile"       value={guardian.mobile}       onChange={(v) => setG('mobile', v)} />
              <FieldInput label="Relationship" value={guardian.relationship} onChange={(v) => setG('relationship', v)} />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <Field label="Full Name"    value={guardian.name} />
              <Field label="Mobile"       value={guardian.mobile} />
              <Field label="Relationship" value={guardian.relationship} />
            </div>
          )}
        </div>

        {/* HIGH SCHOOL */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📚 High School Information</h3>
          {isEditing ? (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <FieldInput label="High School"  value={highSchool.highSchool}  onChange={(v) => setH('highSchool', v)} />
              <FieldInput label="Exam Body"    value={highSchool.examBody}    onChange={(v) => setH('examBody', v)} />
              <FieldInput label="Year of Exam" value={highSchool.yearOfExam}  onChange={(v) => setH('yearOfExam', v)} />
              <FieldInput label="Level"        value={highSchool.level}       onChange={(v) => setH('level', v)} />
              <FieldInput label="Mean Grade"   value={highSchool.meanGrade}   onChange={(v) => setH('meanGrade', v)} />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Field label="High School"  value={highSchool.highSchool} />
              <Field label="Exam Body"    value={highSchool.examBody} />
              <Field label="Year of Exam" value={highSchool.yearOfExam} />
              <Field label="Level"        value={highSchool.level} />
              <Field label="Mean Grade"   value={highSchool.meanGrade} />
            </div>
          )}

          {highSchool.subjects?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Subjects & Grades</p>
              <div className="grid grid-cols-3 gap-2">
                {highSchool.subjects.map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 flex justify-between text-sm">
                    <span className="text-gray-700">{s.subject}</span>
                    <span className="font-medium text-gray-800">{s.grade}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* EDUCATION BACKGROUND */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🎓 Education Background</h3>
          {education.length === 0 ? (
            <p className="text-sm text-gray-400">No prior education recorded</p>
          ) : (
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2">Course</th>
                    <th className="px-3 py-2">Institution</th>
                    <th className="px-3 py-2">Qualification</th>
                    <th className="px-3 py-2">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {education.map((e, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-800">{e.course || '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{e.institution || '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{e.qualification || '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{e.year || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* WORK EXPERIENCE */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">💼 Work Experience</h3>
          {experience.length === 0 ? (
            <p className="text-sm text-gray-400">No work experience recorded</p>
          ) : (
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2">Company</th>
                    <th className="px-3 py-2">Job Title</th>
                    <th className="px-3 py-2">Years</th>
                  </tr>
                </thead>
                <tbody>
                  {experience.map((e, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-800">{e.company || '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{e.jobTitle || '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{e.years || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PROGRAMME */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Programme & Study</h3>
          {isEditing && canEditProgramme ? (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Programme</p>
                <p className="font-medium text-gray-800">
                  {programme?.name || '—'} ({programme?.code || '—'})
                </p>
                <p className="text-xs text-gray-400 mt-1">To change the programme degree itself, use the Programmes module.</p>
              </div>
              <FieldInput
                label="Mode of Study"
                as="select"
                options={MODE_OPTIONS}
                value={progInfo.modeOfStudy}
                onChange={(v) => setProg('modeOfStudy', v)}
              />
              <FieldInput
                label="Campus"
                value={personal.campus}
                onChange={(v) => setP('campus', v)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <Field label="Programme"    value={programme ? `${programme.name} (${programme.code || '—'})` : '—'} />
              <Field label="Department"   value={programme?.department} />
              <Field label="Mode of Study" value={
                MODE_OPTIONS.find((m) => m.value === progInfo.modeOfStudy)?.label || progInfo.modeOfStudy
              } />
              <Field label="Campus"       value={personal.campus} />
              <Field label="Duration"     value={programme?.duration ? `${programme.duration} semesters` : '—'} />
            </div>
          )}
        </div>

        {/* APPLICATION FEE */}
        {!['enrolled', 'rejected'].includes(application.status) && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🧾 Application Fee</h3>
            {application.applicationFeeCode ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg p-4 border border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-500">Code</p>
                  <p className="font-mono text-sm text-gray-800">{application.applicationFeeCode}</p>
                </div>
                <div className="rounded-lg p-4 border border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-lg font-semibold text-gray-800">KES {application.applicationFee ?? 0}</p>
                </div>
                <div className="rounded-lg p-4 border border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-500">Paid</p>
                  <p className="text-lg font-semibold text-gray-800">KES {application.applicationFeePaid ?? 0}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Finance will assign the application fee code when validating payment.
              </p>
            )}
          </div>
        )}

        {/* FEES */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Fees & Billings</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg p-4 border border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-lg font-semibold text-gray-800">KES {(totalFee || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-lg p-4 border border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">Paid</p>
              <p className="text-lg font-semibold text-green-700">KES {(paidFee || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-lg p-4 border border-red-200 bg-red-50">
              <p className="text-xs text-gray-500">Balance</p>
              <p className="text-lg font-semibold text-red-700">KES {(balance || 0).toLocaleString()}</p>
            </div>
          </div>

          {user?.role === 'finance' && application.status === 'enrolled' && (
            <button
              onClick={() => setShowSemesterModal(true)}
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              + Add Semester Billings
            </button>
          )}

          {studentLedger?.billings?.length > 0 && (
            <div className="mt-4 overflow-hidden border border-gray-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Semester</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {studentLedger.billings.map((b) => (
                    <tr key={b._id} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-800">{b.label}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{b.semester || '—'}</td>
                      <td className="px-3 py-2 text-right font-medium">
                        KES {(b.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {studentLedger?.payments?.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Payment History</p>
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Method</th>
                      <th className="px-3 py-2">Receipt</th>
                      <th className="px-3 py-2 text-right">Status</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentLedger.payments.map((p) => (
                      <tr key={p._id} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-3 py-2 text-xs capitalize">{p.method}</td>
                    <td className="px-3 py-2 text-xs font-mono text-gray-700">
  {p.receiptNumber ? (
    <button
      onClick={() => downloadReceipt(p.receiptNumber)}
      className="text-blue-600 hover:text-blue-800 underline"
    >
      {p.receiptNumber}
    </button>
  ) : (
    '—'
  )}
</td>
                        <td className="px-3 py-2 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            p.status === 'confirmed' ? 'bg-green-100 text-green-800'
                            : p.status === 'rejected' ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}>{p.status}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          KES {(p.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* DOCUMENTS */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📎 Documents ({student.documents?.length || 0})
          </h3>
          {student.documents?.length ? (
            <div className="space-y-1">
              {student.documents.map((doc) => (
                <div key={doc._id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">{doc.name || doc.filename}</span>
                  <a
                    href={`http://localhost:5000/${(doc.filePath || '').replace(/\\/g, '/')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No documents uploaded</p>
          )}
        </div>

        {/* COMMENTS */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📝 Comments & Notes</h3>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows="3"
            disabled={!isEditing}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </div>

        {/* STATUS HISTORY */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🕒 Status History</h3>
          {application.statusHistory?.length ? (
            <ol className="space-y-3">
              {application.statusHistory.map((h, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{statusLabel(h.status)}</p>
                    <p className="text-xs text-gray-500">
                      by {h.role || 'system'} · {new Date(h.at).toLocaleString()}
                    </p>
                    {h.note && <p className="text-xs text-gray-500 italic mt-0.5">— {h.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-gray-400">No history yet</p>
          )}
        </div>

        {/* ACTIONS */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">⚙️ Actions</h3>
          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {actions.map((a) => (
                <button
                  key={a.next}
                  onClick={() => handleStatusUpdate(a.next, a.askNote)}
                  disabled={saving}
                  className={btnClass(a.color)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          ) : ['enrolled', 'rejected'].includes(application.status) ? (
            <p className="text-gray-500 text-sm">
              This application is {statusLabel(application.status).toLowerCase()} — workflow complete.
            </p>
          ) : (
            <p className="text-gray-500 text-sm">
              No actions available for you at this stage ({statusLabel(application.status)}).
            </p>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showBillingModal && (
        <BillingModal
          studentName={
            [student.personalInfo?.title, student.personalInfo?.surname, student.personalInfo?.lastName]
              .filter(Boolean).join(' ') || 'Unnamed'
          }
          saving={saving}
          onCancel={() => setShowBillingModal(false)}
          onSubmit={(billings) => handleStatusUpdate('enrolled', false, { billings })}
        />
      )}
      {showSemesterModal && (
        <BillingModal
          mode="addSemester"
          studentName={
            [student.personalInfo?.title, student.personalInfo?.surname, student.personalInfo?.lastName]
              .filter(Boolean).join(' ') || 'Unnamed'
          }
          saving={saving}
          onCancel={() => setShowSemesterModal(false)}
          onSubmit={handleAddSemesterBillings}
        />
      )}
    </div>
  );
};

export default ApplicationDetail;