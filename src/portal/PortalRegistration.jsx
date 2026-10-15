import { useEffect, useState } from 'react';
import api from '../api/axios';
import PortalLayout from './PortalLayout';
import { PageHeader } from '../components/ui';
import { useConfirm } from '../components/ConfirmDialog';

export default function PortalRegistration() {
  const confirm = useConfirm();

  const [data, setData]           = useState(null);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [toast, setToast]         = useState('');
  const [busy, setBusy]           = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        api.get('/registrations/me'),
        api.get('/registrations/available-units'),
      ]);

      let payload = r1.data;
      let units   = r2.data.units || [];

      // Auto-start if there is no draft yet
      if (
        payload?.semester?.registrationOpen &&
        (!payload.registration || (payload.registration.unitIds || []).length === 0)
      ) {
        try {
          await api.post('/registrations/me/start');
          const [r1b, r2b] = await Promise.all([
            api.get('/registrations/me'),
            api.get('/registrations/available-units'),
          ]);
          payload = r1b.data;
          units   = r2b.data.units || [];
        } catch (e) {
          // ignore — registration may be locked
        }
      }

      setData(payload);
      setAvailable(units);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const start = async () => {
    setBusy(true); setError('');
    try {
      await api.post('/registrations/me/start');
      setToast('Registration started');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setBusy(false); }
  };

  const addUnit = async (unitId) => {
    setBusy(true); setError('');
    try {
      await api.post('/registrations/me/units', { unitId });
      setToast('Unit added');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setBusy(false); }
  };

  const dropUnit = async (unitId) => {
    setBusy(true); setError('');
    try {
      await api.delete('/registrations/me/units/' + unitId);
      setToast('Unit dropped');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setBusy(false); }
  };

  const submit = async () => {
    setBusy(true); setError('');
    try {
      await api.post('/registrations/me/submit');
      setToast('Registration submitted — approved ✅');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setBusy(false); }
  };

  const reset = async () => {
    const ok = await confirm({
      message: 'Delete your whole registration and start over?',
      title: 'Reset registration',
      confirmLabel: 'Reset',
      danger: true,
    });
    if (!ok) return;
    setBusy(true); setError('');
    try {
      await api.delete('/registrations/me');
      setToast('Registration cleared');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setBusy(false); }
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <PageHeader icon="📝" title="Registration" subtitle="Loading your basket…" />
          <div className="text-slate-500 dark:text-slate-400 text-center py-8">Loading…</div>
        </div>
      </PortalLayout>
    );
  }

  if (!data?.semester) {
    return (
      <PortalLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <PageHeader
            icon="📝"
            title="Registration"
            subtitle="Register for units and view your current semester"
          />
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400">No current semester is open.</p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  const reg         = data.registration;
  const limits      = data.limits || { min: 6, max: 7 };
  const count       = reg?.unitIds?.length || 0;
  const enrolledIds = new Set((reg?.unitIds || []).map((u) => u._id));
  const pct         = Math.min(100, Math.round((count / limits.max) * 100));
  const status      = reg?.status;

  const overMax  = count > limits.max;
  const underMin = count < limits.min;

  const statusColors = {
    draft:    'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300',
    pending:  'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300',
    approved: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
    rejected: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300',
  };

  const barColor = underMin ? 'bg-amber-400'
                 : overMax  ? 'bg-rose-500'
                 :           'bg-emerald-500';

  return (
    <PortalLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          icon="📝"
          title="Registration"
          subtitle={data.semester.code + ' · ' + data.semester.academicYear}
          actions={status && (
            <span className={'px-3 py-1 rounded-full text-xs font-medium capitalize ' + (statusColors[status] || 'bg-slate-100 text-slate-700')}>
              {status}
            </span>
          )}
        />

        {toast && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-lg p-3 text-sm">
            {toast}
          </div>
        )}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {data.semester.code} — {data.semester.academicYear}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {data.semester.registrationOpen ? '✅ Registration is open' : '🔒 Registration is closed'}
              </p>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className={overMax ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}>
                {count} units selected
              </span>
              <span>min {limits.min} · max {limits.max}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={'h-full transition-all ' + barColor}
                style={{ width: pct + '%' }}
              />
            </div>
          </div>

          {underMin && status === 'draft' && (
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 rounded-lg p-2 text-xs">
              You need at least {limits.min} units to submit. You have {count}.
            </div>
          )}
          {overMax && status === 'draft' && (
            <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-lg p-2 text-xs">
              You have {count} units, but the maximum is {limits.max}. Drop {count - limits.max} to submit.
            </div>
          )}

          {!reg && data.semester.registrationOpen && (
            <button
              onClick={start} disabled={busy}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg mt-4 transition"
            >
              {busy ? 'Starting…' : 'Start Registration'}
            </button>
          )}

          {reg && status === 'draft' && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={submit}
                disabled={busy || underMin || overMax}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm transition"
              >
                Submit registration
              </button>
              <button
                onClick={reset} disabled={busy}
                className="bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-300 disabled:opacity-50 px-5 py-2 rounded-lg text-sm transition"
              >
                Reset (delete all)
              </button>
            </div>
          )}
        </div>

        {reg && reg.unitIds.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-display font-semibold text-slate-800 dark:text-slate-100">
                Your Units ({reg.unitIds.length})
              </h3>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase">
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
                  <tr key={u._id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-6 py-3 font-mono text-sm text-purple-700 dark:text-purple-400">{u.code}</td>
                    <td className="px-6 py-3 text-sm text-slate-800 dark:text-slate-200">{u.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{u.semester}</td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{u.credits}</td>
                    <td className="px-6 py-3 text-right">
                      {status === 'draft' && (
                        <button
                          onClick={() => dropUnit(u._id)} disabled={busy}
                          className="text-xs text-rose-600 hover:text-rose-800 disabled:opacity-50"
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
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-display font-semibold text-slate-800 dark:text-slate-100">
                Full Basket ({available.length} units)
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Add or drop units until you have {limits.min}–{limits.max}
              </span>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase">
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
                  const disabled   = isEnrolled || count >= limits.max;
                  return (
                    <tr key={u._id} className={'border-t border-slate-100 dark:border-slate-800 ' + (isEnrolled ? 'opacity-60' : '')}>
                      <td className="px-6 py-3 font-mono text-sm text-purple-700 dark:text-purple-400">{u.code}</td>
                      <td className="px-6 py-3 text-sm text-slate-800 dark:text-slate-200">{u.name}</td>
                      <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{u.semester}</td>
                      <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{u.credits}</td>
                      <td className="px-6 py-3 text-right">
                        {isEnrolled ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">✓ Added</span>
                        ) : u.exempted ? (
                          <span className="text-xs text-purple-600 dark:text-purple-400">Exempted</span>
                        ) : (
                          <button
                            onClick={() => addUnit(u._id)} disabled={disabled || busy}
                            className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 disabled:opacity-50 font-medium"
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
