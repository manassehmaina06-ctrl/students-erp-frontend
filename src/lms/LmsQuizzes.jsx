import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import EmptyState from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui';

const STATUS_PILL = {
  published: 'bg-green-100 text-green-800',
  closed:    'bg-blue-100 text-blue-800',
};

export default function LmsQuizzes() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    return api.get('/lms/me/quizzes')
      .then((r) => setItems(r.data.quizzes || []))
      .catch((err) => toast.error(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const start = async (quiz) => {
    try {
      const r = await api.post('/lms/me/quizzes/' + quiz._id + '/start');
      navigate('/lms/quizzes/' + quiz._id + '/take', {
        state: { attempt: r.data.attempt, quiz: r.data.quiz, questions: r.data.questions, resumed: !!r.data.resumed },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const resume = (quiz) => {
    // Re-start returns the same in-progress attempt
    start(quiz);
  };

const viewResult = (quiz) => {
  if (quiz.best && quiz.best.attemptId) {
    navigate('/lms/quizzes/result/' + quiz.best.attemptId);
  }
};

  if (loading) return <LoadingState />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">🧪 Quizzes & Exams</h1>
        <p className="text-sm text-gray-500 mt-1">Test your knowledge — one question at a time</p>
      </div>

      {items.length === 0 ? (
    <PageHeader
  icon="🧪"
  title="Quizzes & Exams"
  subtitle="Test your knowledge — one question at a time"
/>
      ) : (
        <div className="space-y-3">
          {items.map((q) => {
            const canStart = q.status === 'published'
              && !q.inProgressId
              && q.attemptsUsed < q.maxAttempts;
            const hasInProgress = !!q.inProgressId;
            const attemptsLeft = Math.max(0, q.maxAttempts - q.attemptsUsed);

            return (
              <div key={q._id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    {q.unit && (
                      <p className="text-xs font-mono text-purple-700 mb-1">
                        {q.unit.code} · {q.unit.name}
                      </p>
                    )}
                    <h3 className="font-semibold text-gray-800">{q.title}</h3>
                    {q.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{q.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 items-center mt-2 text-xs text-gray-600">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                        {q.durationMinutes} min
                      </span>
                      <span>{q.questionCount} questions</span>
                      <span>Attempts: {q.attemptsUsed} / {q.maxAttempts}</span>
                      <span className={'px-2 py-0.5 rounded-full font-medium ' + (STATUS_PILL[q.status] || 'bg-gray-100 text-gray-700')}>
                        {q.status}
                      </span>
                    </div>

                    {q.best && (
                      <div className="mt-2 text-sm">
                        Best: <strong className={q.best.percent >= q.passScore ? 'text-green-700' : 'text-orange-700'}>
                          {q.best.percent}%
                        </strong>
                        <span className="text-gray-500"> ({q.best.score}/{q.best.maxScore})</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 items-stretch shrink-0">
                    {hasInProgress && (
                      <button
                        onClick={() => resume(q)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        ▶ Resume
                      </button>
                    )}
                    {canStart && !hasInProgress && (
                      <button
                        onClick={() => start(q)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        {attemptsLeft === q.maxAttempts ? '▶ Start Quiz' : 'Retake'}
                      </button>
                    )}
                    {!hasInProgress && !canStart && attemptsLeft === 0 && (
                      <button
                        disabled
                        className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-sm cursor-not-allowed"
                      >
                        Attempts used
                      </button>
                    )}
                    {q.best && (
                      <button
                        onClick={() => viewResult(q)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        View result →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
