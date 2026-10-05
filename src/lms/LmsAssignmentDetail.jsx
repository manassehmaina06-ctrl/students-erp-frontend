import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function LmsAssignmentDetail() {
  const { assignmentId } = useParams();
  const [a, setA]                   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [toast, setToast]           = useState('');
  const [file, setFile]             = useState(null);
  const [note, setNote]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    return api.get(`/lms/me/assignments/${assignmentId}`)
      .then((r) => {
        setA(r.data);
        setNote(r.data.mySubmission?.note || '');
        if (fileRef.current) fileRef.current.value = '';
        setFile(null);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [assignmentId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please choose a file to upload.');
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (note.trim()) fd.append('note', note.trim());
      await api.post(`/lms/me/assignments/${assignmentId}/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setToast('Submission uploaded');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const withdraw = async () => {
    if (!window.confirm('Withdraw your submission? You can submit again before the deadline.')) return;
    try {
      await api.delete(`/lms/me/assignments/${assignmentId}/submit`);
      setToast('Submission withdrawn');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-500">Loading…</div>;
  if (!a) return <div className="text-center py-8 text-red-600">{error || 'Assignment not found'}</div>;

  const sub = a.mySubmission;
  const due = new Date(a.dueDate);
  const past = new Date() > due;
  const canSubmit = a.status === 'published' && (!sub || sub.status === 'submitted');

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/lms/assignments" className="text-gray-500 hover:text-gray-800 text-sm mb-4 inline-block">
        ← Back to Assignments
      </Link>

      {toast && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm mb-4">
          {toast}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <p className="text-xs font-mono text-purple-700">
          {a.unit?.code} · {a.unit?.name}
        </p>
        <h1 className="text-2xl font-bold text-gray-800 mt-1">{a.title}</h1>
        <div className="flex flex-wrap gap-3 items-center mt-3 text-sm">
          <span className="text-gray-600">Due {due.toLocaleDateString()}</span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-600">Max {a.maxScore}</span>
          <span className="text-gray-300">·</span>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              a.status === 'published'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {a.status}
          </span>
          {past && !sub && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Past due
            </span>
          )}
        </div>

        {a.attachmentUrl && (
          <a
            href={a.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-4"
          >
            📎 {a.attachmentName || 'Download attachment'}
          </a>
        )}
      </div>

      {/* Instructions */}
      {a.description && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-2">Instructions</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{a.description}</p>
        </div>
      )}

      {/* My submission */}
      {sub ? (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">My Submission</h2>

          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">File: </span>
              <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                {sub.fileName}
              </a>
            </p>
            <p>
              <span className="text-gray-500">Submitted: </span>
              {new Date(sub.submittedAt).toLocaleString()}
              {sub.isLate && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 font-medium">
                  LATE
                </span>
              )}
            </p>
            {sub.note && (
              <p className="text-gray-700">
                <span className="text-gray-500">Note: </span>
                {sub.note}
              </p>
            )}
          </div>

          {sub.status === 'graded' ? (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-2">Grade</h3>
              <p className="text-2xl font-bold text-green-700">
                {sub.score} / {a.maxScore}
              </p>
              {sub.feedback && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Feedback</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{sub.feedback}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-gray-500">
                You can resubmit before the deadline (or until graded).
              </p>
              <button
                onClick={withdraw}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Withdraw submission
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Submit form */}
      {canSubmit && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-3">
            {sub ? 'Resubmit' : 'Submit Assignment'}
          </h2>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-sm text-gray-600">File *</span>
              <input
                ref={fileRef}
                type="file"
                required
                onChange={(e) => setFile(e.target.files[0])}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <span className="text-xs text-gray-400">
                PDF, DOC, DOCX, ZIP, images · Max 25 MB
              </span>
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Note (optional)</span>
              <textarea
                rows="3"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything you want the lecturer to know…"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Uploading…' : (sub ? 'Resubmit' : 'Submit Assignment')}
            </button>
          </form>
        </div>
      )}

      {!canSubmit && !sub && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 rounded-lg p-4 text-sm text-center">
          Submissions are closed for this assignment.
        </div>
      )}
    </div>
  );
}