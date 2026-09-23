import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StaffLayout from '../components/StaffLayout';

const DAYS = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
];

const DAY_SHORT = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

const emptySlot = { day: 'mon', startTime: '08:00', endTime: '09:00', room: '', building: '', note: '' };

export default function UnitDetail() {
  const { unitId } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState('overview');

  const [unit, setUnit]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState('');

  // Timetable
  const [slots, setSlots]           = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm]     = useState(emptySlot);
  const [saving, setSaving]         = useState(false);

  // Enrolled students
  const [students, setStudents]     = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const fetchUnit = () => {
    setLoading(true);
    return api.get(`/academic/units/${unitId}`)
      .then((r) => setUnit(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  const fetchSlots = () => {
    setSlotsLoading(true);
    return api.get(`/academic/units/${unitId}/timetable`)
      .then((r) => setSlots(r.data.slots || []))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setSlotsLoading(false));
  };

  const fetchStudents = () => {
    setStudentsLoading(true);
    return api.get(`/academic/units/${unitId}/students`)
      .then((r) => setStudents(r.data.students || r.data || []))
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false));
  };

  useEffect(() => {
    fetchUnit();
    fetchSlots();
    fetchStudents();
  }, [unitId]);

  const openCreate = () => {
    setEditingSlot(null);
    setSlotForm(emptySlot);
    setShowModal(true);
  };

  const openEdit = (slot) => {
    setEditingSlot(slot);
    setSlotForm({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room || '',
      building: slot.building || '',
      note: slot.note || '',
    });
    setShowModal(true);
  };

  const saveSlot = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editingSlot) {
        await api.put(`/academic/timetable/${editingSlot._id}`, slotForm);
        setToast('Slot updated');
      } else {
        await api.post(`/academic/units/${unitId}/timetable`, slotForm);
        setToast('Slot created');
      }
      setShowModal(false);
      await fetchSlots();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSlot = async (slotId) => {
    if (!window.confirm('Delete this timetable slot?')) return;
    try {
      await api.delete(`/academic/timetable/${slotId}`);
      setToast('Slot deleted');
      await fetchSlots();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  if (loading) return <StaffLayout><div className="p-8 text-gray-500">Loading…</div></StaffLayout>;
  if (!unit)   return <StaffLayout><div className="p-8 text-red-600">{error || 'Unit not found'}</div></StaffLayout>;

  const programmes = (unit.programmeIds || []).map((p) => p.code || p.name).join(', ');
  const lecturer   = unit.lecturerId?.schoolEmail || unit.lecturerId?.email || '—';

  return (
    <StaffLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/erp/units')} className="text-gray-500 hover:text-gray-800 text-sm mb-4">
          ← Back to Units
        </button>

        {toast && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm mb-4">{toast}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

        {/* Header */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs text-gray-500">{unit.code}</p>
              <h1 className="text-2xl font-bold text-gray-800 mt-1">{unit.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {unit.credits} credits · Semester {unit.semester} · <span className="capitalize">{unit.type}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Lecturer</p>
              <p className="text-sm text-gray-700 font-medium mt-0.5">{lecturer}</p>
            </div>
          </div>
        </div>

        {/* Tabs — 3 tabs only */}
        <div className="border-b border-gray-200 flex gap-1 mb-6">
          <button
            onClick={() => setTab('overview')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
              tab === 'overview' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >📋 Overview</button>
          <button
            onClick={() => setTab('timetable')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
              tab === 'timetable' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >📅 Timetable</button>
          <button
            onClick={() => setTab('students')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
              tab === 'students' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >👥 Enrolled Students</button>
        </div>

        {/* ===== OVERVIEW ===== */}
        {tab === 'overview' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Unit Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Code</p>
                <p className="font-mono text-gray-800">{unit.code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-gray-800">{unit.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Credits</p>
                <p className="text-gray-800">{unit.credits}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-gray-800 capitalize">{unit.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Semester offered</p>
                <p className="text-gray-800">{unit.semester}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Programmes</p>
                <p className="text-gray-800">{programmes || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Description</p>
                <p className="text-gray-800">{unit.description || '—'}</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== TIMETABLE ===== */}
        {tab === 'timetable' && (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                + Add Slot
              </button>
            </div>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              {slotsLoading ? (
                <p className="p-6 text-center text-gray-400">Loading…</p>
              ) : slots.length === 0 ? (
                <p className="p-6 text-center text-gray-400">
                  No slots yet. Add the first one — e.g. Mon 08:00–09:00 in Lab 6.
                </p>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Day</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Room</th>
                      <th className="px-4 py-3">Building</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((s) => (
                      <tr key={s._id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{DAY_SHORT[s.day] || s.day}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{s.startTime} – {s.endTime}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{s.room || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{s.building || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openEdit(s)} className="text-xs text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                          <button onClick={() => deleteSlot(s._id)} className="text-xs text-red-600 hover:text-red-800">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ===== ENROLLED STUDENTS ===== */}
        {tab === 'students' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {studentsLoading ? (
              <p className="p-6 text-center text-gray-400">Loading…</p>
            ) : students.length === 0 ? (
              <p className="p-6 text-center text-gray-400">
                No students found via this endpoint.
              </p>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Student #</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s._id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-mono text-xs text-purple-700">{s.studentNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{s.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Slot modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={saveSlot} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingSlot ? 'Edit Slot' : 'New Timetable Slot'}
            </h2>

            <label className="block mb-3">
              <span className="text-sm text-gray-600">Day</span>
              <select value={slotForm.day} onChange={(e) => setSlotForm({ ...slotForm, day: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2">
                {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <label className="block">
                <span className="text-sm text-gray-600">Start (HH:MM)</span>
                <input type="text" required value={slotForm.startTime}
                  onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                  placeholder="08:00"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">End (HH:MM)</span>
                <input type="text" required value={slotForm.endTime}
                  onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                  placeholder="09:00"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
            </div>

            <label className="block mb-3">
              <span className="text-sm text-gray-600">Room</span>
              <input type="text" value={slotForm.room}
                onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
                placeholder="Lab 6"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>

            <label className="block mb-3">
              <span className="text-sm text-gray-600">Building (optional)</span>
              <input type="text" value={slotForm.building}
                onChange={(e) => setSlotForm({ ...slotForm, building: e.target.value })}
                placeholder="Engineering"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>

            <label className="block mb-5">
              <span className="text-sm text-gray-600">Note (optional)</span>
              <input type="text" value={slotForm.note}
                onChange={(e) => setSlotForm({ ...slotForm, note: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50">
                {saving ? 'Saving…' : (editingSlot ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      )}
    </StaffLayout>
  );
}