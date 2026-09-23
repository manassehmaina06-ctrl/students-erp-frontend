import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import StaffLayout from '../components/StaffLayout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StudentsManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Exemption modal state
  const [exemptStudent, setExemptStudent] = useState(null);
  const [programmeUnits, setProgrammeUnits] = useState([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [toast, setToast] = useState('');

  const canManageExemptions = user?.role === 'academic';

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/students?enrolledOnly=true');
        setStudents(res.data);
      } catch (err) {
        console.error(err);
        alert('Failed to load students: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = students.filter((s) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const p = s.personalInfo || {};
    return [
      s.studentNumber, s.applicationNumber,
      p.surname, p.lastName, p.email,
      s.programmeInfo?.programme?.name,
    ].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
  });

  const openExemptions = async (student) => {
    setExemptStudent(student);
    setModalError('');
    setModalLoading(true);
    setSelectedUnitIds((student.exemptedUnitIds || []).map((id) => String(id)));

    const programmeId = student.programmeInfo?.programme?._id || student.programmeInfo?.programme;
    if (!programmeId) {
      setProgrammeUnits([]);
      setModalLoading(false);
      setModalError('This student has no programme assigned — no units to exempt.');
      return;
    }

    try {
      const res = await api.get(`/academic/units?programmeId=${programmeId}`);
      setProgrammeUnits(res.data);
    } catch (err) {
      setModalError(err.response?.data?.message || err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const closeExemptions = () => {
    setExemptStudent(null);
    setProgrammeUnits([]);
    setSelectedUnitIds([]);
    setModalError('');
  };

  const toggleUnit = (unitId) => {
    setSelectedUnitIds((prev) =>
      prev.includes(String(unitId))
        ? prev.filter((id) => id !== String(unitId))
        : [...prev, String(unitId)]
    );
  };

  const saveExemptions = async () => {
    if (!exemptStudent) return;
    setModalSaving(true);
    setModalError('');
    try {
      await api.post(`/academic/students/${exemptStudent._id}/exemptions`, {
        unitIds: selectedUnitIds,
      });
      setToast(`Exemptions updated for ${exemptStudent.studentNumber}`);
      setStudents((prev) =>
        prev.map((s) =>
          s._id === exemptStudent._id ? { ...s, exemptedUnitIds: selectedUnitIds } : s
        )
      );
      closeExemptions();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message);
    } finally {
      setModalSaving(false);
    }
  };

  return (
    <StaffLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {toast && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm mb-4">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🎓 Students Management</h1>
          <input
            type="text"
            placeholder="Search by name, email, ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg w-72"
          />
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-3 py-3">Student #</th>
                <th className="px-3 py-3">App #</th>
                <th className="px-3 py-3">Applicant</th>
                <th className="px-3 py-3">Programme</th>
                <th className="px-3 py-3">Mode</th>
                <th className="px-3 py-3">Campus</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Fees</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="9" className="p-6 text-center text-gray-400">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan="9" className="p-6 text-center text-gray-400">No students found</td></tr>
              )}
              {filtered.map((s) => {
                const p = s.personalInfo || {};
                const prog = s.programmeInfo?.programme;
                const feePillClass = {
                  pending: 'bg-yellow-100 text-yellow-800',
                  partial: 'bg-orange-100 text-orange-800',
                  paid:    'bg-green-100 text-green-800',
                  waived:  'bg-gray-100 text-gray-700',
                }[s.feeStatus] || 'bg-gray-100 text-gray-700';
                const exemptCount = (s.exemptedUnitIds || []).length;

                return (
                  <tr key={s._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-3 font-mono text-xs text-purple-700">{s.studentNumber || '—'}</td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-600">{s.applicationNumber || '—'}</td>
                    <td className="px-3 py-3 text-sm">
                      {[p.title, p.surname, p.lastName].filter(Boolean).join(' ') || 'Unnamed'}
                    </td>
                    <td className="px-3 py-3 text-sm">{prog?.name || prog?.code || '—'}</td>
                    <td className="px-3 py-3 text-sm">{s.programmeInfo?.modeOfStudy || '—'}</td>
                    <td className="px-3 py-3 text-sm">{p.campus || '—'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{p.email || '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${feePillClass}`}>
                        {s.feeStatus || 'pending'}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">KES {s.fees?.balance ?? 0} due</div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {exemptCount > 0 && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded mr-2">
                          {exemptCount} exempt
                        </span>
                      )}
                      {canManageExemptions && (
                        <button
                          onClick={() => openExemptions(s)}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1.5 rounded-lg text-sm mr-2"
                        >
                          Exemptions
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/students/${s._id}`)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"
                      >
                        Open →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exemption modal */}
      {exemptStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                Exemptions — {exemptStudent.studentNumber}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {[
                  exemptStudent.personalInfo?.title,
                  exemptStudent.personalInfo?.surname,
                  exemptStudent.personalInfo?.lastName,
                ].filter(Boolean).join(' ') || 'Unnamed'}
                {' · '}
                {exemptStudent.programmeInfo?.programme?.name || 'No programme'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Check the units this student is exempted from. Exempted units will not appear in
                their available units list and can be skipped even if it takes them below the minimum.
              </p>
            </div>

            <div className="p-6">
              {modalLoading ? (
                <p className="text-center text-gray-400 py-8">Loading units…</p>
              ) : modalError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {modalError}
                </div>
              ) : programmeUnits.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  No units found for this student's programme.
                </p>
              ) : (
                <div className="space-y-2">
                  {programmeUnits.map((u) => {
                    const checked = selectedUnitIds.includes(String(u._id));
                    return (
                      <label
                        key={u._id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                          checked
                            ? 'bg-purple-50 border-purple-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleUnit(u._id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-500">{u.code}</span>
                            <span className="font-medium text-sm text-gray-800">{u.name}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {u.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Semester {u.semester} · {u.credits} credits
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {selectedUnitIds.length} unit{selectedUnitIds.length === 1 ? '' : 's'} exempted
              </p>
              <div className="flex gap-2">
                <button
                  onClick={closeExemptions}
                  disabled={modalSaving}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveExemptions}
                  disabled={modalSaving || modalLoading}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm disabled:opacity-50"
                >
                  {modalSaving ? 'Saving…' : 'Save Exemptions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
};

export default StudentsManagement;