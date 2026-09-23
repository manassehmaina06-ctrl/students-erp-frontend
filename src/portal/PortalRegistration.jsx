import { useEffect, useState } from 'react';
import api from '../api/axios';
import PortalLayout from './PortalLayout';

export default function PortalRegistration() {
  const [data, setData]         = useState(null);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState('');
  const [busy, setBusy]         = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/registrations/me'),
      api.get('/registrations/available-units'),
    ])
      .then(([r1, r2]) => {
        setData(r1.data);
        setAvailable(r2.data);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const start = async () => {
    setBusy(true); setError('');
    try {
      await api.post('/registrations/me/start');
      setToast('Registration started');
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setBusy(false); }
  };

  const addUnit = async (unitId) => {
    setBusy(true); setError('');
    try {
      await api.post('/registrations/me/units', { unitId });
      setToast('Unit added');
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setBusy(false); }
  };

  const dropUnit = async (unitId) => {
    setBusy(true); setError('');
    try {
      await api.delete(`/registrations/me/units/${unitId}`);
      setToast('Unit dropped');
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setBusy(false); }
  };

  const submit = async () => {
    setBusy(true); setError('');
    try {
      await api.post('/registrations/me/submit');
      setToast('Registration submitted — approved ✅');
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setBusy(false); }
  };

  const reset = async () => {
    if (!window.confirm('Delete your whole registration and start over?')) return;
    setBusy(true); setError('');
    try {
      await api.delete('/registrations/me');
      setToast('Registration cleared');
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setBusy(false); }
  };

  if (loading) return <PortalLayout title="Registration"><div className="p-8 text-gray-500">Loading…</div></PortalLayout>;

  if (!data?.semester) {
    return (
      <PortalLayout title="Registration">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">No current semester is open.</p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  const reg     = data.registration;
  const limits  = data.limits || { min: 6, max: 8 };
  const count   = reg?.unitIds?.length || 0;
  const enrolledIds = new Set((reg?.unitIds || []).map((u) => u._id));
  const pct = Math.min(100, Math.round((count / limits.max) * 100));
  const status = reg?.status;

  const statusColors = {
    draft:    'bg-yellow-100 text-yellow-800',
    pending:  'bg-orange-100 text-orange-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <PortalLayout title="Registration">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {toast && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm">{toast}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {data.semester.code} — {data.semester.academicYear}
              </h2>
              <p className="text-sm text-gray-500">
                {data.semester.registrationOpen ? '✅ Registration is open' : '🔒 Registration is closed'}
              </p>
            </div>
            {status && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                {status}
              </span>
            )}
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{count} units selected</span>
              <span>min {limits.min} · max {limits.max}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${count < limits.min ? 'bg-yellow-400' : 'bg-green-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {count < limits.min && status === 'draft' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-2 text-xs">
              You need at least {limits.min} units to submit. You have {count}.
            </div>
          )}

          {!reg && data.semester.registrationOpen && (
            <button
              onClick={start} disabled={busy}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg mt-4"
            >
              {busy ? 'Starting…' : 'Start Registration'}
            </button>
          )}

          {reg && status === 'draft' && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={submit} disabled={busy || count < limits.min}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm"
              >
                Submit registration
              </button>
              <button
                onClick={reset} disabled={busy}
                className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-700 px-5 py-2 rounded-lg text-sm"
              >
                Reset (delete all)
              </button>
            </div>
          )}
        </div>

        {reg && reg.unitIds.length > 0 && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Your Units ({reg.unitIds.length})</h3>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Sem</th>
                  <th className="px-6 py-3">Credits</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {reg.unitIds.map((u) => (
                  <tr key={u._id} className="border-t border-gray-100">
                    <td className="px-6 py-3 font-mono text-sm">{u.code}</td>
                    <td className="px-6 py-3 text-sm">{u.name}</td>
                    <td className="px-6 py-3 text-sm">{u.semester}</td>
                    <td className="px-6 py-3 text-sm">{u.credits}</td>
                    <td className="px-6 py-3 text-right">
                      {status === 'draft' && (
                        <button
                          onClick={() => dropUnit(u._id)} disabled={busy}
                          className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          Drop
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reg && status === 'draft' && available.length > 0 && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Available Units</h3>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Sem</th>
                  <th className="px-6 py-3">Credits</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {available.map((u) => {
                  const isEnrolled = enrolledIds.has(u._id);
                  const disabled = isEnrolled || count >= limits.max;
                  return (
                    <tr key={u._id} className={`border-t border-gray-100 ${isEnrolled ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-3 font-mono text-sm">{u.code}</td>
                      <td className="px-6 py-3 text-sm">{u.name}</td>
                      <td className="px-6 py-3 text-sm">{u.semester}</td>
                      <td className="px-6 py-3 text-sm">{u.credits}</td>
                      <td className="px-6 py-3 text-right">
                        {isEnrolled ? (
                          <span className="text-xs text-gray-400">Added</span>
                        ) : u.exempted ? (
                          <span className="text-xs text-purple-600">Exempted</span>
                        ) : (
                          <button
                            onClick={() => addUnit(u._id)} disabled={disabled || busy}
                            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          >
                            + Add
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
