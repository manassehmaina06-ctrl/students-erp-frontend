import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const OFFICE_LABEL = {
  finance:    'Finance',
  library:    'Library',
  exam:       'Exam Office',
  hostel:     'Hostel',
  department: 'Department',
  registrar:  'Registrar',
};

export default function ClearanceCertificate() {
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/clearance/me/certificate')
      .then((r) => setCert(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (error)   return <div className="p-8 text-red-600">{error}</div>;
  if (!cert)   return <div className="p-8 text-red-600">No certificate on record</div>;

  const p = cert.payload;

  return (
    <div className="min-h-screen bg-gray-100 p-6 print:p-0 print:bg-white">
      <div className="max-w-3xl mx-auto mb-4 flex justify-between print:hidden">
        <button onClick={() => navigate('/portal/clearance')} className="text-gray-600 hover:text-gray-900">← Back</button>
        <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Print</button>
      </div>

      <div className="max-w-3xl mx-auto bg-white shadow-lg print:shadow-none p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎓</div>
          <h1 className="text-2xl font-bold text-gray-800">STUDENT CLEARANCE CERTIFICATE</h1>
          <p className="text-sm text-gray-500 mt-1">Official document — keep for your records</p>
        </div>

        {/* Certificate number */}
        <div className="flex justify-between items-center border-y-2 border-gray-800 py-3 mb-6">
          <div>
            <p className="text-xs text-gray-500 uppercase">Certificate Number</p>
            <p className="font-mono text-lg font-bold text-gray-800">{cert.certificateNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase">Issued</p>
            <p className="text-sm text-gray-800">{new Date(cert.certificateIssuedAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Student details */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-2">Student</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Student Number</p>
              <p className="font-medium">{p.studentNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Reason</p>
              <p className="font-medium capitalize">{p.reason.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Semester</p>
              <p className="font-medium">{p.semester || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Academic Year</p>
              <p className="font-medium">{p.academicYear || '—'}</p>
            </div>
          </div>
        </div>

        {/* Office approvals */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-2">Office Approvals</h2>
          <table className="w-full text-sm border border-gray-300">
            <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
              <tr>
                <th className="px-3 py-2 text-left border-b border-gray-300">Office</th>
                <th className="px-3 py-2 text-left border-b border-gray-300">Status</th>
                <th className="px-3 py-2 text-left border-b border-gray-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {p.offices.map((o) => (
                <tr key={o.office}>
                  <td className="px-3 py-2 border-b border-gray-200">{OFFICE_LABEL[o.office]}</td>
                  <td className="px-3 py-2 border-b border-gray-200 text-green-700 font-medium">Approved</td>
                  <td className="px-3 py-2 border-b border-gray-200 text-xs text-gray-500">
                    {o.actedAt ? new Date(o.actedAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature */}
        <div className="mt-12 flex justify-between text-sm">
          <div>
            <div className="border-t border-gray-400 w-56 pt-1">
              <p className="text-xs text-gray-500">Authorized Signature</p>
            </div>
          </div>
          <div>
            <div className="border-t border-gray-400 w-56 pt-1">
              <p className="text-xs text-gray-500">Registrar's Stamp</p>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-10">
          Verify this certificate at /verify/clearance/{cert.certificateNumber}
        </p>
      </div>
    </div>
  );
}
