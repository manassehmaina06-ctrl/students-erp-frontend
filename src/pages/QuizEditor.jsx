import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StaffLayout from '../components/StaffLayout';
import { useToast } from '../context/ToastContext';
import { LoadingState, Spinner } from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const TYPE_LABEL = { mcq: 'Multiple Choice', truefalse: 'True/False', short: 'Short Answer' };

export default function QuizEditor() {
  const { unitId, quizId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [quiz, setQuiz]             = useState(null);
  const [questions, setQuestions]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showQModal, setShowQModal] = useState(false);
  const [saving, setSaving]         = useState(false);

  const load = () => {
    setLoading(true);
    return api.get('/lecturer/quizzes/' + quizId)
      .then((r) => {
        setQuiz(r.data.quiz);
        setQuestions(r.data.questions || []);
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [quizId]);

  const deleteQuestion = async (qid, idx) => {
    if (!window.confirm('Delete question ' + idx + '?')) return;
    try {
      await api.delete('/lecturer/quizzes/' + quizId + '/questions/' + qid);
      toast.success('Question deleted');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const publish = async () => {
    setSaving(true);
    try {
      await api.post('/lecturer/quizzes/' + quizId + '/publish');
      toast.success('Quiz published');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const close = async () => {
    if (!window.confirm('Close this quiz? Students will no longer be able to start new attempts.')) return;
    setSaving(true);
    try {
      await api.post('/lecturer/quizzes/' + quizId + '/close');
      toast.success('Quiz closed');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <StaffLayout><LoadingState /></StaffLayout>;
  if (!quiz) return <StaffLayout><div className="p-8 text-red-600">Quiz not found</div></StaffLayout>;

  const totalPoints = questions.reduce((s, q) => s + (q.points || 0), 0);
  const statusPill = {
    draft:     'bg-gray-100 text-gray-700',
    published: 'bg-green-100 text-green-800',
    closed:    'bg-blue-100 text-blue-800',
  };

  return (
    <StaffLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/erp/lecturer/units/' + unitId)}
          className="text-gray-500 hover:text-gray-800 text-sm mb-4"
        >
          ← Back to Unit
        </button>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Quiz Editor</p>
              <h1 className="text-2xl font-bold text-gray-800 mt-1">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-sm text-gray-500 mt-1">{quiz.description}</p>
              )}
              <div className="flex flex-wrap gap-3 items-center mt-3 text-xs text-gray-600">
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                  {quiz.durationMinutes} min
                </span>
                <span>Attempts: <strong>{quiz.maxAttempts}</strong></span>
                <span>Pass: <strong>{quiz.passScore}%</strong></span>
                <span>Questions: <strong>{questions.length}</strong></span>
                <span>Total points: <strong>{totalPoints}</strong></span>
                <span className={'px-2 py-0.5 rounded-full font-medium ' + statusPill[quiz.status]}>
                  {quiz.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowQModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                + Add Question
              </button>
              {quiz.status === 'draft' && (
                <button
                  onClick={publish}
                  disabled={saving || questions.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  {saving ? 'Publishing…' : 'Publish'}
                </button>
              )}
              {quiz.status === 'published' && (
                <button
                  onClick={close}
                  disabled={saving}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  Close Quiz
                </button>
              )}
            </div>
          </div>
        </div>

        {questions.length === 0 ? (
          <EmptyState
            icon="❓"
            title="No questions yet"
            description="Add your first question to get started."
            action={
              <button
                onClick={() => setShowQModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                + Add Question
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={q._id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold text-gray-500">Q{i + 1}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
                        {TYPE_LABEL[q.type]}
                      </span>
                      <span className="text-[10px] text-gray-500">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-sm text-gray-800 font-medium whitespace-pre-wrap">{q.question}</p>

                    {q.type !== 'short' && q.options && (
                      <ul className="mt-2 space-y-1">
                        {q.options.map((opt, idx) => (
                          <li key={idx} className={'text-sm flex items-center gap-2 ' + (idx === q.correctIndex ? 'text-green-700 font-medium' : 'text-gray-600')}>
                            {idx === q.correctIndex ? '✓' : '○'} {opt.label}
                          </li>
                        ))}
                      </ul>
                    )}

                    {q.type === 'short' && q.expectedAnswer && (
                      <p className="mt-2 text-xs text-gray-500 italic">
                        Model answer: {q.expectedAnswer}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteQuestion(q._id, i + 1)}
                    className="text-xs text-red-600 hover:text-red-800 shrink-0"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showQModal && (
        <QuestionModal
          quizId={quizId}
          onClose={() => setShowQModal(false)}
          onSaved={() => { setShowQModal(false); toast.success('Question added'); load(); }}
        />
      )}
    </StaffLayout>
  );
}

function QuestionModal({ quizId, onClose, onSaved }) {
  const [type, setType]       = useState('mcq');
  const [question, setQuestion] = useState('');
  const [points, setPoints]   = useState(1);
  const [options, setOptions] = useState([{ label: '' }, { label: '' }]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [expectedAnswer, setExpectedAnswer] = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const changeType = (t) => {
    setType(t);
    if (t === 'truefalse') { setOptions([{ label: 'True' }, { label: 'False' }]); setCorrectIndex(0); }
    if (t === 'mcq')       { setOptions([{ label: '' }, { label: '' }]); setCorrectIndex(0); }
  };

  const updateOption = (i, label) => {
    const next = [...options];
    next[i] = { label };
    setOptions(next);
  };

  const addOption = () => setOptions([...options, { label: '' }]);
  const removeOption = (i) => {
    const next = options.filter((_, idx) => idx !== i);
    setOptions(next);
    if (correctIndex >= next.length) setCorrectIndex(next.length - 1);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return setError('Question text required');
    if (type === 'mcq') {
      if (options.some((o) => !o.label.trim())) return setError('All options must have text');
      if (options.length < 2) return setError('At least 2 options required');
    }

    const payload = {
      type,
      question: question.trim(),
      points: Number(points) || 1,
    };
    if (type !== 'short') {
      payload.options = options;
      payload.correctIndex = correctIndex;
    } else {
      payload.expectedAnswer = expectedAnswer.trim();
    }

    setSaving(true); setError('');
    try {
      await api.post('/lecturer/quizzes/' + quizId + '/questions', payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Add Question</h2>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

        <label className="block mb-3">
          <span className="text-sm text-gray-600">Type</span>
          <select
            value={type} onChange={(e) => changeType(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="mcq">Multiple Choice</option>
            <option value="truefalse">True / False</option>
            <option value="short">Short Answer</option>
          </select>
        </label>

        <label className="block mb-3">
          <span className="text-sm text-gray-600">Question</span>
          <textarea
            required rows="3" value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm text-gray-600">Points</span>
          <input
            type="number" min="1" value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="mt-1 w-24 border border-gray-300 rounded-lg px-3 py-2"
          />
        </label>

        {type !== 'short' && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-2">Options (pick the correct one)</p>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  name="correct"
                  checked={correctIndex === i}
                  onChange={() => setCorrectIndex(i)}
                />
                <input
                  type="text"
                  value={opt.label}
                  disabled={type === 'truefalse'}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={'Option ' + (i + 1)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm disabled:bg-gray-100"
                />
                {type === 'mcq' && options.length > 2 && (
                  <button
                    type="button" onClick={() => removeOption(i)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {type === 'mcq' && (
              <button
                type="button" onClick={addOption}
                className="text-xs text-blue-600 hover:text-blue-800 mt-1"
              >
                + Add option
              </button>
            )}
          </div>
        )}

        {type === 'short' && (
          <label className="block mb-5">
            <span className="text-sm text-gray-600">Model answer (for your reference)</span>
            <textarea
              rows="2" value={expectedAnswer}
              onChange={(e) => setExpectedAnswer(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50">
            {saving ? 'Saving…' : 'Add Question'}
          </button>
        </div>
      </form>
    </div>
  );
}
