import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StaffLayout from '../components/StaffLayout';

export default function AssignmentGrading() {
  const { unitId, assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [rows, setRows]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [toast, setToast]           = useState('');
  const [edit, setEdit]             = useState({}); // { submissionId: { score, feedback, saving } }

  const load = () => {
    setLoading(true);
    return api.get(`/lecturer/assignments/${assignmentId}/submissions`)
      .then((r) => {
        setAssignment(r.data.assignment);
        const list = r.data.rows || [];
        setRows(list);
        const initial = {};
        list.forEach((row) => {
          if (row.submission) {
            initial[row.submission._id] = {
              score:    row.submission.score ?? '',
              feedback: row.submission.feedback ?? '',
              saving:   false,
            };
          }
        });
        setEdit(initial);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [assignmentId]);

  const setRow = (id, patch) =>
    setEdit((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  const saveRow = async (submission) => {
    const row = edit[submission._id] || {};
    if (row.score === '' || row.score === null || row.score === undefined) {
      return setError('Score is required before saving.');
    }
    if (Number(row.score) < 0 || Number(row.score) > assignment.maxScore) {
      return setError(`Score must be between 0 and ${assignment.maxScore}.`);
    }

    setError('');
    setRow(submission._id, { saving: true });
    try {
      await api.put(`/lecturer/submissions/${submission._id}`, {
        score:    Number(row.score),
        feedback: row.feedback || '',
      });
      setToast(`Saved grade for ${row.name || 'student'}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setRow(submission._id, { saving: false });
    }
  };

  if (loading) {
    return <StaffLayout><div className="p-8 text-gray-500">Loading…</div></StaffLayout>;
  }
  if (!assignment) {
    return <StaffLayout><div className="p-8 text-red-600">{error || 'Assignment not found'}</div></StaffLayout>;
  }

  const totalStudents  = rows.length;
  const submittedCount = rows.filter((r) => r.submission).length;
  const gradedCount    = rows.filter((r) => r.submission?.status === 'graded').length;

  return (
    <StaffLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(`/erp/lecturer/units/${unitId}`)}
          className="text-gray-500 hover:text-gray-800 text-sm mb-4"
        >
          ← Back to Unit
        </button>

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
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Grading</p>
              <h1 className="text-2xl font-bold text-gray-800 mt-1">{assignment.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Due {new Date(assignment.dueDate).toLocaleDateString()} · Max {assignment.maxScore}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Progress</p>
              <p className="text-lg font-bold text-gray-800 mt-1">
                {gradedCount} / {totalStudents} graded
              </p>
              <p className="text-xs text-gray-500">{submittedCount} submitted</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {rows.length === 0 ? (
            <p className="p-6 text-center text-gray-400">No enrolled students.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Submission</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3 w-28">Score</th>
                    <th className="px-4 py-3">Feedback</th>
                    <th className="px-4 py-3 text-right w-24">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const s = r.student;
                    const sub = r.submission;
                    const state = sub ? edit[sub._id] || {} : {};
                    return (
                      <tr key={s._id} className="border-t border-gray-100 align-top">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{s.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{s.studentNumber}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {sub ? (
                            <>
                              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">
                                {sub.status}
                              </span>
                              {sub.fileUrl && (
                                <a
                                  href={sub.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-xs text-blue-600 hover:text-blue-800 mt-1"
                                >
                                  📎 {sub.fileName || 'View file'}
                                </a>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Not submitted</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {sub?.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}
                          {sub?.isLate && (
                            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 font-medium">
                              LATE
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max={assignment.maxScore}
                            value={sub ? state.score ?? '' : ''}
                            disabled={!sub}
                            onChange={(e) => sub && setRow(sub._id, { score: e.target.value })}
                            className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <textarea
                            rows="2"
                            value={sub ? state.feedback ?? '' : ''}
                            disabled={!sub}
                            onChange={(e) => sub && setRow(sub._id, { feedback: e.target.value })}
                            placeholder={sub ? 'Optional feedback…' : 'No submission'}
                            className="w-full min-w-[240px] border border-gray-300 rounded-lg px-2 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => saveRow(sub)}
                            disabled={!sub || state.saving}
                            className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {state.saving ? 'Saving…' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Tip: graded students' marks automatically appear in the unit's Marks table.
        </p>
      </div>
    </StaffLayout>
  );
}