import { useEffect, useState } from 'react';
import api from '../api/axios';
import StaffLayout from '../components/StaffLayout';
import { useNavigate } from 'react-router-dom';


const emptyForm = {
  code: '', name: '', programmeIds: [], semester: 1,
  credits: 3, type: 'core', description: '', lecturerId: '',
};

export default function UnitsManagement() {
  const navigate = useNavigate();

  const [units, setUnits]           = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [lecturers, setLecturers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [toast, setToast]           = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null); // unit id or null
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/academic/units'),
      api.get('/academic/programmes'),
      api.get('/academic/lecturers'),
    ])
      .then(([u, p, l]) => {
        setUnits(u.data);
        setProgrammes(p.data);
        setLecturers(l.data);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (unit) => {
    setEditing(unit._id);
    setForm({
      code: unit.code,
      name: unit.name,
      programmeIds: (unit.programmeIds || []).map((p) => p._id),
      semester: unit.semester,
      credits: unit.credits,
      type: unit.type,
      description: unit.description || '',
      lecturerId: unit.lecturerId?._id || '',
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const payload = {
        ...form,
        semester: Number(form.semester),
        credits:  Number(form.credits),
        lecturerId: form.lecturerId || null,
      };
      if (editing) {
        await api.put(`/academic/units/${editing}`, payload);
        setToast('Unit updated');
      } else {
        await api.post('/academic/units', payload);
        setToast('Unit created');
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this unit?')) return;
    try {
      await api.delete(`/academic/units/${id}`);
      setToast('Unit deleted');
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const toggleProgramme = (pid) => {
    setForm((f) => ({
      ...f,
      programmeIds: f.programmeIds.includes(pid)
        ? f.programmeIds.filter((x) => x !== pid)
        : [...f.programmeIds, pid],
    }));
  };

  return (
    <StaffLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📖 Units</h1>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
            + New Unit
          </button>
        </div>

        {toast && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm mb-4">{toast}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <p className="p-6 text-center text-gray-400">Loading…</p>
          ) : units.length === 0 ? (
            <p className="p-6 text-center text-gray-400">No units yet. Create one to get started.</p>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Programmes</th>
                  <th className="px-4 py-3">Sem</th>
                  <th className="px-4 py-3">Credits</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Lecturer</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                          <tr key={u._id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/erp/units/${u._id}`)}>
                    <td className="px-4 py-3 font-mono text-sm text-blue-700 hover:underline">{u.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{u.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {(u.programmeIds || []).map((p) => p.code).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{u.semester}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{u.credits}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        u.type === 'core' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>{u.type}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{u.lecturerId?.email || '—'}</td>
                                      <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(u); }}
                        className="text-xs text-blue-600 hover:text-blue-800 mr-3"
                      >Edit</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); remove(u._id); }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >Delete</button>
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
          <form onSubmit={save} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editing ? 'Edit Unit' : 'New Unit'}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="block">
                <span className="text-sm text-gray-600">Code</span>
                <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="CS101"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Name</span>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Introduction to Programming"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Semester offered</span>
                <input required type="number" min="1" value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Credits</span>
                <input required type="number" min="0" value={form.credits}
                  onChange={(e) => setForm({ ...form, credits: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Type</span>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="core">Core</option>
                  <option value="elective">Elective</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Lecturer</span>
                <select value={form.lecturerId} onChange={(e) => setForm({ ...form, lecturerId: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">— Unassigned —</option>
                  {lecturers.map((l) => (
                    <option key={l._id} value={l._id}>{l.email}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block mb-4">
              <span className="text-sm text-gray-600">Description</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows="2"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>

            <div className="mb-4">
              <span className="text-sm text-gray-600 block mb-2">Programmes</span>
              <div className="grid grid-cols-2 gap-2">
                {programmes.map((p) => (
                  <label key={p._id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.programmeIds.includes(p._id)}
                      onChange={() => toggleProgramme(p._id)}
                    />
                    <span>{p.name} ({p.code})</span>
                  </label>
                ))}
              </div>
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
