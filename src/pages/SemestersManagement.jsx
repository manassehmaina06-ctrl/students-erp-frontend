import { useEffect, useState } from 'react';
import api from '../api/axios';
import StaffLayout from '../components/StaffLayout';

const emptyForm = {
  code: '', academicYear: '', startDate: '', endDate: '',
  registrationOpen: false, isCurrent: false,
};

export default function SemestersManagement() {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [toast, setToast]         = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/academic/semesters')
      .then((r) => setSemesters(r.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (s) => {
    setEditing(s._id);
    setForm({
      code: s.code,
      academicYear: s.academicYear,
      startDate: s.startDate ? s.startDate.slice(0, 10) : '',
      endDate:   s.endDate   ? s.endDate.slice(0, 10)   : '',
      registrationOpen: !!s.registrationOpen,
      isCurrent: !!s.isCurrent,
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      if (editing) {
        await api.put(`/academic/semesters/${editing}`, form);
        setToast('Semester updated');
      } else {
        await api.post('/academic/semesters', form);
        setToast('Semester created');
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const setCurrent = async (id) => {
    try {
      await api.post(`/academic/semesters/${id}/set-current`);
      setToast('Current semester updated');
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <StaffLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📅 Semesters</h1>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
            + New Semester
          </button>
        </div>

        {toast && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm mb-4">{toast}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <p className="p-6 text-center text-gray-400">Loading…</p>
          ) : semesters.length === 0 ? (
            <p className="p-6 text-center text-gray-400">No semesters yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Academic Year</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                  <th className="px-4 py-3">Registration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {semesters.map((s) => (
                  <tr key={s._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm text-gray-800">{s.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.academicYear}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${s.registrationOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {s.registrationOpen ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">Current</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!s.isCurrent && (
                        <button onClick={() => setCurrent(s._id)} className="text-xs text-blue-600 hover:text-blue-800 mr-3">Set current</button>
                      )}
                      <button onClick={() => openEdit(s)} className="text-xs text-gray-600 hover:text-gray-800">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{editing ? 'Edit Semester' : 'New Semester'}</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="block">
                <span className="text-sm text-gray-600">Code</span>
                <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="2026-S1"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Academic Year</span>
                <input required value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                  placeholder="2026/2027"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Start Date</span>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">End Date</span>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.registrationOpen}
                  onChange={(e) => setForm({ ...form, registrationOpen: e.target.checked })} />
                Registration open
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isCurrent}
                  onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })} />
                Current semester
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50">
                {saving ? 'Saving…' : (editing ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      )}
    </StaffLayout>
  );
}
