import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { LoadingState } from '../components/LoadingState';

export default function LmsQuizResult() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/lms/me/quizzes/attempts/' + attemptId)
      .then((r) => setData(r.data))
      .catch((err) => toast.error(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return <LoadingState />;
  if (!data || !data.attempt) return <div className="p-8 text-center text-gray-500">Result not found.</div>;

  const { attempt, quiz, questions } = data;
  const score = (attempt.autoScore || 0) + (attempt.manualScore || 0);
  const passed = attempt.percent >= 50;
  const hasShortUngraded = questions.some((q) => q.type === 'short')
    && attempt.status === 'submitted';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/lms/quizzes')}
        className="text-gray-500 hover:text-gray-800 text-sm"
      >
        ← Back to Quizzes
      </button>

      <div className="bg-white rounded-2xl shadow p-6 text-center">
        <div className="text-5xl mb-3">{passed ? '🎉' : attempt.status === 'graded' ? '📝' : '⏳'}</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{quiz.title}</h1>

        {attempt.status === 'in-progress' ? (
          <p className="text-gray-500">Attempt still in progress.</p>
        ) : hasShortUngraded ? (
          <p className="text-sm text-gray-500 mt-2">
            Your score will be available after your lecturer grades the short-answer questions.
          </p>
        ) : (
          <>
            <p className="text-5xl font-bold text-gray-800 mt-4">{attempt.percent}%</p>
            <p className="text-sm text-gray-500 mt-1">
              {score} / {attempt.maxScore} points
            </p>
            <p className={'inline-block mt-3 px-3 py-1 rounded-full text-sm font-medium ' + (passed ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800')}>
              {passed ? '✓ Passed' : 'Needs improvement'}
            </p>
          </>
        )}
      </div>

      {quiz.showScoreImmediately === false && attempt.status !== 'graded' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm">
          ℹ Your lecturer has hidden the score until results are published.
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Question Breakdown</h2>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const myAnswer = attempt.answers.find((a) => String(a.questionId) === String(q._id));
            const isAutoGraded = q.type === 'mcq' || q.type === 'truefalse';
            const correct = isAutoGraded && myAnswer && Number(myAnswer.selectedIndex) === Number(q.correctIndex);
            const pointsEarned = isAutoGraded
              ? (correct ? q.points : 0)
              : (myAnswer?.manualScore != null ? myAnswer.manualScore : null);

            return (
              <div key={q._id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs font-semibold text-gray-500">Q{i + 1}</span>
                  <span className={
                    'text-[10px] px-2 py-0.5 rounded-full font-medium ' +
                    (isAutoGraded
                      ? (correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                      : (pointsEarned != null ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'))
                  }>
                    {isAutoGraded
                      ? (correct ? '✓ Correct' : '✗ Incorrect')
                      : (pointsEarned != null ? '✓ Graded' : '⏳ Pending grade')}
                  </span>
                </div>
                <p className="text-sm text-gray-800 font-medium mb-2">{q.question}</p>

                {q.type !== 'short' && q.options && (
                  <ul className="space-y-1 text-sm">
                    {q.options.map((opt, idx) => {
                      const isMine = myAnswer && Number(myAnswer.selectedIndex) === idx;
                      const isCorrect = q.correctIndex != null && Number(q.correctIndex) === idx;
                      return (
                        <li
                          key={idx}
                          className={
                            'flex items-center gap-2 px-2 py-1 rounded ' +
                            (isCorrect ? 'bg-green-50 text-green-800 font-medium'
                              : isMine ? 'bg-red-50 text-red-700'
                                : 'text-gray-600')
                          }
                        >
                          {isCorrect ? '✓' : isMine ? '✗' : '○'} {opt.label}
                          {isMine && <span className="text-[10px] text-gray-400 ml-1">(your answer)</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {q.type === 'short' && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Your answer:</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                      {myAnswer?.text || <em className="text-gray-400">No answer</em>}
                    </p>
                    {pointsEarned != null && (
                      <p className="text-xs text-green-700 mt-2">
                        Score: {pointsEarned} / {q.points}
                        {myAnswer?.feedback && <span className="block text-gray-600 mt-1">Feedback: {myAnswer.feedback}</span>}
                      </p>
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  {pointsEarned != null ? pointsEarned : '—'} / {q.points} points
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
