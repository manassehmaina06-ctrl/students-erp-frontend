import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function LmsMessages() {
  const [box, setBox]         = useState('inbox');
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState('');
  const [composeOpen, setComposeOpen] = useState(false);

  const load = () => {
    setLoading(true);
    return api.get('/messages/inbox?box=' + box)
      .then((r) => setItems(r.data.messages || []))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [box]);

  const openMsg = async (m) => {
    if (box === 'inbox' && !m.readAt) {
      try { await api.post('/messages/' + m._id + '/read'); } catch { }
      setItems((prev) => prev.map((x) => x._id === m._id ? { ...x, readAt: new Date() } : x));
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💬 Messages</h1>
          <p className="text-sm text-gray-500 mt-1">Communicate with your lecturers</p>
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          + New Message
        </button>
      </div>

      {toast && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm mb-4">{toast}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

      <div className="flex gap-2 mb-4">
        {['inbox', 'sent'].map((f) => (
          <button
            key={f}
            onClick={() => setBox(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${
              box === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-8">Loading…</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500">No messages in your {box}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((m) => {
            const other = box === 'inbox' ? m.from : m.to;
            const unread = box === 'inbox' && !m.readAt;
            return (
              <div
                key={m._id}
                onClick={() => openMsg(m)}
                className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition ${unread ? 'border-l-4 border-blue-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium text-sm ${unread ? 'text-gray-900' : 'text-gray-700'}`}>{other.name}</span>
                      {m.unit && <span className="text-[10px] font-mono text-purple-700">{m.unit.code}</span>}
                      {unread && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    {m.subject && <p className="text-sm font-medium text-gray-800 mt-1">{m.subject}</p>}
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{m.body}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {composeOpen && (
        <ComposeModal onClose={() => setComposeOpen(false)} onSent={() => { setComposeOpen(false); setToast('Message sent'); load(); }} />
      )}
    </div>
  );
}

function ComposeModal({ onClose, onSent }) {
  const [contacts, setContacts] = useState([]);
  const [form, setForm]         = useState({ toUserId: '', unitId: '', subject: '', body: '' });
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    api.get('/messages/contacts')
      .then((r) => setContacts(r.data.contacts || []))
      .catch((err) => setError(err.response?.data?.message || err.message));
  }, []);

  const chooseContact = (c) => setForm({ ...form, toUserId: c.userId, unitId: c.unit?._id || '' });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.toUserId) return setError('Choose a recipient');
    if (!form.body.trim()) return setError('Message body required');
    setSending(true); setError('');
    try {
      await api.post('/messages', {
        toUserId: form.toUserId,
        unitId:   form.unitId || undefined,
        subject:  form.subject.trim() || undefined,
        body:     form.body.trim(),
      });
      onSent();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSending(false);
    }
  };

  const chosen = contacts.find((c) => c.userId === form.toUserId);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">New Message</h2>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

        {contacts.length === 0 ? (
          <p className="text-gray-500 text-sm mb-4">No contacts available yet.</p>
        ) : !chosen ? (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Choose a recipient:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {contacts.map((c, i) => (
                <button
                  key={c.userId + '-' + i}
                  type="button"
                  onClick={() => chooseContact(c)}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-3 border border-gray-200"
                >
                  <div className="text-sm font-medium text-gray-800">{c.email}</div>
                  <div className="text-xs text-gray-500">{c.unit?.code} · {c.unit?.name} · <span className="capitalize">{c.role}</span></div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-700">To: <strong>{chosen.email}</strong></p>
              <p className="text-[10px] text-blue-600 mt-0.5">{chosen.unit?.code} · {chosen.unit?.name}</p>
              <button type="button" onClick={() => setForm({ ...form, toUserId: '', unitId: '' })} className="text-[10px] text-blue-600 hover:text-blue-800 mt-1">Change</button>
            </div>

            <label className="block mb-3">
              <span className="text-sm text-gray-600">Subject (optional)</span>
              <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>

            <label className="block mb-5">
              <span className="text-sm text-gray-600">Message</span>
              <textarea required rows="5" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">Cancel</button>
              <button type="submit" disabled={sending} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50">{sending ? 'Sending…' : 'Send'}</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
