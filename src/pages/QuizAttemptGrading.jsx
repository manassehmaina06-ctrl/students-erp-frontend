import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StaffLayout from '../components/StaffLayout';
import { useToast } from '../context/ToastContext';
import { LoadingState } from '../components/LoadingState';

export default function QuizAttemptGrading() {
  const { unitId, quizId, attemptId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [attempt, setAttempt]     = useState(null);
  const [quiz, setQuiz]           = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [manual, setManual]       = useState({}); // { questionId: { manualScore, feedback } }
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const load = () => {
    setLoading(true);
    return api.get('/lecturer/quizzes/attempts/' + attemptId)
      .then((r) => {
        setAttempt(r.data.attempt);
        setQuiz(r.data.quiz);
        setQuestions(r.data.questions || []);
        const initial = {};
        (r.data.attempt.answers || []).forEach((a) => {
          initial[String(a.questionId)] = {
            manualScore: a.manualScore != null ? a.manualScore : '',
            feedback:    a.feedback || '',
          };
        });
        setManual(initial);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [attemptId]);

  const setGrade = (qid, patch) => {
    setManual((prev) => ({ ...prev, [qid]: { ...(prev[qid] || {}), ...patch } }));
  };

  const saveGrade = async () => {
    if (!attempt) return;
    setSaving(true); setError('');

    // Build payload
    const manualScores = {};
    questions.forEach((q) => {
      if (q.type === 'short') {
        const row = manual[String(q._id)] || {};
        manualScores[String(q._id)] = {
          manualScore: row.manualScore === '' ? 0 : Number(row.manualScore),
          feedback:    row.feedback || '',
        };
      }
    });

    try {
      await api.put('/lecturer/quizzes/attempts/' + attemptId + '/grade', { manualScores });
      toast.success('Grade saved');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <StaffLayout><LoadingState /></StaffLayout>;
  if (!attempt || !quiz) return <StaffLayout><div className="p-8 text-red-600">{error || 'Attempt not found'}</div></StaffLayout>;

  const studentName = (() => {
    const s = attempt.studentId;
    if (typeof s === 'object' && s) {
      const p = s.personalInfo || {};
      return [p.title, p.surname, p.lastName].filter(Boolean).join(' ') || s.studentNumber || 'Unnamed';
    }
    return 'Student';
  })();

  const studentNumber = (typeof attempt.studentId === 'object' && attempt.studentId) ? attempt.studentId.studentNumber : '';

  const totalScore = (attempt.autoScore || 0) + (attempt.manualScore || 0);
  const hasShort = questions.some((q) => q.type === 'short');

  return (
    <StaffLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/erp/lecturer/units/' + unitId + '/quizzes/' + quizId)}
          className="text-gray-500 hover:text-gray-800 text-sm mb-4"
        >
          ← Back to Quiz
        </button>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Grading Attempt</p>
              <h1 className="text-2xl font-bold text-gray-800 mt-1">{quiz.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                <strong>{studentName}</strong>
                {studentNumber && <span className="ml-2 font-mono text-xs text-purple-700">{studentNumber}</span>}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Submitted {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '—'}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Current Score</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {totalScore} / {attempt.maxScore}
              </p>
              <p className="text-xs text-gray-500">{attempt.percent}%</p>
              <span className={
                'inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ' +
                (attempt.status === 'graded' ? 'bg-green-100 text-green-800' :
                 attempt.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                 'bg-gray-100 text-gray-700')
              }>
                {attempt.status}
              </span>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

        <div className="space-y-3">
          {questions.map((q, i) => {
            const myAnswer = (attempt.answers || []).find((a) => String(a.questionId) === String(q._id));
            const isAuto = q.type === 'mcq' || q.type === 'truefalse';
            const isCorrect = isAuto && myAnswer && Number(myAnswer.selectedIndex) === Number(q.correctIndex);
            const autoPoints = isAuto ? (isCorrect ? q.points : 0) : null;

            return (
              <div key={q._id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-500">Q{i + 1}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
                    {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'truefalse' ? 'True/False' : 'Short Answer'}
                  </span>
                  <span className="text-[10px] text-gray-500">{q.points} pt{q.points !== 1 ? 's' : ''}</span>

                  {isAuto && (
                    <span className={
                      'ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ' +
                      (isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                    }>
                      {isCorrect ? '✓ Correct (+' + autoPoints + ')' : '✗ Incorrect (0)'}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-800 font-medium mb-2 whitespace-pre-wrap">{q.question}</p>

                {isAuto && q.options && (
                  <ul className="space-y-1 text-sm">
                    {q.options.map((opt, idx) => {
                      const isMine = myAnswer && Number(myAnswer.selectedIndex) === idx;
                      const isCorrectOpt = q.correctIndex != null && Number(q.correctIndex) === idx;
                      return (
                        <li
                          key={idx}
                          className={
                            'flex items-center gap-2 px-2 py-1 rounded ' +
                            (isCorrectOpt ? 'bg-green-50 text-green-800 font-medium'
                              : isMine ? 'bg-red-50 text-red-700'
                                : 'text-gray-600')
                          }
                        >
                          {isCorrectOpt ? '✓' : isMine ? '✗' : '○'} {opt.label}
                          {isMine && <span className="text-[10px] text-gray-400 ml-1">(student's answer)</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {q.type === 'short' && (
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Student's answer:</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {myAnswer?.text || <em className="text-gray-400">No answer</em>}
                      </p>
                    </div>

                    {q.expectedAnswer && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-700 mb-1">Model answer (your reference):</p>
                        <p className="text-sm text-blue-900 whitespace-pre-wrap">{q.expectedAnswer}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="block sm:col-span-1">
                        <span className="text-sm text-gray-600">Score (max {q.points})</span>
                        <input
                          type="number"
                          min="0"
                          max={q.points}
                          step="0.5"
                          value={manual[String(q._id)]?.manualScore ?? ''}
                          onChange={(e) => setGrade(String(q._id), { manualScore: e.target.value })}
                          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="text-sm text-gray-600">Feedback (optional)</span>
                        <textarea
                          rows="2"
                          value={manual[String(q._id)]?.feedback ?? ''}
                          onChange={(e) => setGrade(String(q._id), { feedback: e.target.value })}
                          placeholder="Feedback for the student…"
                          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {hasShort && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={saveGrade}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Grade'}
            </button>
          </div>
        )}

        {!hasShort && (
          <div className="mt-6 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 text-sm">
            ✓ This quiz has no short-answer questions — it was auto-graded on submission.
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
