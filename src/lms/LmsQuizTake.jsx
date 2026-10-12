import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const STORAGE_KEY = 'quiz-attempt-';

export default function LmsQuizTake() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [attempt, setAttempt]     = useState(location.state?.attempt || null);
  const [quiz, setQuiz]           = useState(location.state?.quiz || null);
  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [answers, setAnswers]     = useState({});
  const [current, setCurrent]     = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const submittedRef = useRef(false);

  // If page loaded directly (no state), we need to re-start to get the attempt
  useEffect(() => {
    if (attempt && questions.length > 0) return;
    api.post('/lms/me/quizzes/' + quizId + '/start')
      .then((r) => {
        setAttempt(r.data.attempt);
        setQuiz(r.data.quiz);
        setQuestions(r.data.questions || []);
      })
      .catch((err) => setError(err.response?.data?.message || err.message));
  }, [quizId]);

  // Hydrate saved answers from localStorage
  useEffect(() => {
    if (!attempt) return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + attempt._id) || '{}');
      setAnswers(saved);
    } catch { /* ignore */ }
  }, [attempt]);

  // Persist answers
  useEffect(() => {
    if (!attempt) return;
    try {
      localStorage.setItem(STORAGE_KEY + attempt._id, JSON.stringify(answers));
    } catch { /* ignore */ }
  }, [answers, attempt]);

  // Countdown timer
  useEffect(() => {
    if (!attempt || !attempt.expiresAt) return;
    const tick = () => {
      const ms = new Date(attempt.expiresAt).getTime() - Date.now();
      const s = Math.max(0, Math.floor(ms / 1000));
      setSecondsLeft(s);
      if (s <= 0 && !submittedRef.current) {
        submittedRef.current = true;
        autoSubmit();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [attempt]);

  const setAnswer = (questionId, patch) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...(prev[questionId] || {}), ...patch } }));
  };

  const autoSubmit = async () => {
    try {
      const payload = questions.map((q) => ({
        questionId: q._id,
        selectedIndex: answers[q._id]?.selectedIndex ?? null,
        text: answers[q._id]?.text || '',
      }));
      const r = await api.post('/lms/me/quizzes/attempts/' + attempt._id + '/submit', { answers: payload });
      localStorage.removeItem(STORAGE_KEY + attempt._id);
      toast.info('Time is up — your quiz was auto-submitted');
      navigate('/lms/quizzes/result/' + r.data.attempt._id, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      const payload = questions.map((q) => ({
        questionId: q._id,
        selectedIndex: answers[q._id]?.selectedIndex ?? null,
        text: answers[q._id]?.text || '',
      }));
      const r = await api.post('/lms/me/quizzes/attempts/' + attempt._id + '/submit', { answers: payload });
      localStorage.removeItem(STORAGE_KEY + attempt._id);
      submittedRef.current = true;
      toast.success('Quiz submitted');
      navigate('/lms/quizzes/result/' + r.data.attempt._id, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !attempt) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-3">⛔</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Cannot start quiz</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/lms/quizzes')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            ← Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (!attempt || !quiz || questions.length === 0) {
    return <div className="p-8 text-center text-gray-500">Preparing quiz…</div>;
  }

  const q = questions[current];
  const answered = Object.keys(answers).filter((k) => {
    const a = answers[k];
    return a && (a.selectedIndex != null || (a.text && a.text.trim()));
  }).length;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  const lowTime = secondsLeft <= 60;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-gray-800 truncate">{quiz.title}</h1>
            <p className="text-xs text-gray-500">
              Question {current + 1} of {questions.length} · Answered {answered}
            </p>
          </div>

          <div className={'px-3 py-1.5 rounded-lg font-mono font-bold text-lg ' + (lowTime ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-800')}>
            ⏱ {timeStr}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>
        )}

        {/* Question card */}
        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-gray-500">Q{current + 1}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
              {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'truefalse' ? 'True/False' : 'Short Answer'}
            </span>
            <span className="text-[10px] text-gray-500">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
          </div>

          <p className="text-base text-gray-800 font-medium whitespace-pre-wrap mb-4">{q.question}</p>

          {q.type === 'mcq' || q.type === 'truefalse' ? (
            <div className="space-y-2">
              {q.options.map((opt, idx) => (
                <label
                  key={idx}
                  className={
                    'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ' +
                    (answers[q._id]?.selectedIndex === idx
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300')
                  }
                >
                  <input
                    type="radio"
                    name={'q_' + q._id}
                    checked={answers[q._id]?.selectedIndex === idx}
                    onChange={() => setAnswer(q._id, { selectedIndex: idx })}
                    className="shrink-0"
                  />
                  <span className="text-sm text-gray-800">{opt.label}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              rows="6"
              value={answers[q._id]?.text || ''}
              onChange={(e) => setAnswer(q._id, { text: e.target.value })}
              placeholder="Type your answer…"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm disabled:opacity-40"
          >
            ← Previous
          </button>

          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent((c) => c + 1)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium"
            >
              Submit Quiz
            </button>
          )}
        </div>

        {/* Question navigator */}
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-xs text-gray-500 mb-2">Jump to question</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((qq, idx) => {
              const isCurrent = idx === current;
              const isAnswered = answers[qq._id] && (answers[qq._id].selectedIndex != null || (answers[qq._id].text || '').trim());
              return (
                <button
                  key={qq._id}
                  onClick={() => setCurrent(idx)}
                  className={
                    'w-9 h-9 rounded-lg text-sm font-medium transition ' +
                    (isCurrent
                      ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                      : isAnswered
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                  }
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 mt-6">
          Your answers are saved automatically. If you refresh, you'll resume the same attempt.
        </div>
      </div>

      {/* Submit confirmation modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Submit quiz?</h3>
            <p className="text-sm text-gray-600 mb-4">
              You've answered <strong>{answered}</strong> of <strong>{questions.length}</strong> questions.
              {answered < questions.length && (
                <span className="block mt-2 text-amber-700">
                  ⚠ You still have {questions.length - answered} unanswered question{questions.length - answered !== 1 ? 's' : ''}.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
              >
                Keep working
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Yes, submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
