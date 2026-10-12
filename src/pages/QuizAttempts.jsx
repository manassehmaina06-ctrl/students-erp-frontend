import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StaffLayout from '../components/StaffLayout';
import { useToast } from '../context/ToastContext';
import { LoadingState } from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const STATUS_PILL = {
  'in-progress': 'bg-amber-100 text-amber-800',
  'submitted':   'bg-blue-100 text-blue-800',
  'graded':      'bg-green-100 text-green-800',
  'expired':     'bg-red-100 text-red-800',
};

export default function QuizAttempts() {
  const { unitId, quizId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [attempts, setAttempts]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get('/lecturer/quizzes/' + quizId + '/attempts')
      .then((r) => setAttempts(r.data.attempts || []))
      .catch((err) => toast.error(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [quizId]);

  if (loading) return <StaffLayout><LoadingState /></StaffLayout>;

  const gradedCount    = attempts.filter((a) => a.status === 'graded').length;
  const submittedCount = attempts.filter((a) => a.status === 'submitted').length;
  const inProgress     = attempts.filter((a) => a.status === 'in-progress').length;

  return (
    <StaffLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/erp/lecturer/units/' + unitId + '/quizzes/' + quizId)}
          className="text-gray-500 hover:text-gray-800 text-sm mb-4"
        >
          ← Back to Quiz
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📊 Quiz Attempts</h1>
          <p className="text-sm text-gray-500 mt-1">
            {attempts.length} total · {gradedCount} graded · {submittedCount} awaiting grade · {inProgress} in progress
          </p>
        </div>

        {attempts.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No attempts yet"
            description="Students haven't started this quiz. Share it with them to get submissions."
          />
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => {
                  const score = (a.autoScore || 0) + (a.manualScore || 0);
                  return (
                    <tr key={a._id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800 text-sm">{a.studentName}</div>
                        <div className="text-[10px] text-purple-700 font-mono">{a.studentNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {a.startedAt ? new Date(a.startedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(a.status === 'submitted' || a.status === 'graded') ? (
                          <>
                            <div className="font-medium text-gray-800">
                              {score} / {a.maxScore}
                            </div>
                            <div className="text-xs text-gray-500">{a.percent}%</div>
                          </>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={'px-2 py-0.5 rounded-full text-[10px] font-medium ' + (STATUS_PILL[a.status] || 'bg-gray-100 text-gray-700')}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(a.status === 'submitted' || a.status === 'graded') ? (
                          <button
                            onClick={() => navigate('/erp/lecturer/units/' + unitId + '/quizzes/' + quizId + '/attempts/' + a._id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {a.status === 'submitted' ? 'Grade' : 'View'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
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
    </StaffLayout>
  );
}
