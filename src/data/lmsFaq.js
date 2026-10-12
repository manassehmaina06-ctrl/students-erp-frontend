export const LMS_FAQ = [
  {
    id: 'how-submit',
    q: 'How do I submit an assignment?',
    keywords: ['submit', 'assignment', 'upload', 'homework', 'file'],
    answer:
      'Go to Assignments → click the assignment → choose a file → click Submit Assignment.\n\n' +
      'You can resubmit before the deadline (or until the lecturer grades it).',
  },
  {
    id: 'how-quiz',
    q: 'How do I take a quiz?',
    keywords: ['quiz', 'test', 'exam', 'take', 'start'],
    answer:
      'Go to Quizzes → click ▶ Start Quiz.\n\n' +
      'Important:\n' +
      '• The timer starts immediately — it does not pause\n' +
      '• Your answers auto-save\n' +
      '• If time runs out, your quiz is submitted automatically\n' +
      '• One attempt unless your lecturer allows more',
  },
  {
    id: 'how-message',
    q: 'How do I message my lecturer?',
    keywords: ['message', 'contact', 'lecturer', 'teacher', 'talk', 'chat'],
    answer:
      'Go to Messages → click + New Message → pick the lecturer → write your message → Send.\n\n' +
      'You can only message lecturers of units you are enrolled in.',
  },
  {
    id: 'how-announcement',
    q: 'Where do I see announcements?',
    keywords: ['announcement', 'notice', 'news', 'update'],
    answer:
      'Click Announcements in the top nav. You will see posts from all your unit lecturers, newest first.',
  },
  {
    id: 'how-results',
    q: 'Where do I see my grades?',
    keywords: ['grade', 'result', 'marks', 'score', 'gpa', 'results'],
    answer:
      'Click Results in the top nav. Grades appear here once your lecturers publish them.',
  },
  {
    id: 'how-attendance',
    q: 'How do I check my attendance?',
    keywords: ['attendance', 'present', 'absent', 'sessions'],
    answer:
      'Click Attendance in the top nav. You will see every session your lecturers have marked, with your status (present / absent / late / excused).',
  },
  {
    id: 'how-timetable',
    q: 'Where is my timetable?',
    keywords: ['timetable', 'schedule', 'class', 'when', 'time', 'next class'],
    answer:
      'Click Timetable in the top nav for the full weekly schedule across all your units.',
  },
  {
    id: 'how-profile',
    q: 'How do I update my profile?',
    keywords: ['profile', 'update', 'change', 'my details', 'personal'],
    answer:
      'Click your avatar (top-right) → My Profile. To change your password or personal details, contact your administrator.',
  },
  {
    id: 'how-materials',
    q: 'Where are my learning materials?',
    keywords: ['materials', 'notes', 'slides', 'resources', 'download', 'pdf'],
    answer:
      'Click Materials in the top nav. You will see everything your lecturers have uploaded — lecture notes, slides, past papers, and reading lists.',
  },
  {
    id: 'how-fees',
    q: 'How do I pay my fees?',
    keywords: ['fee', 'pay', 'payment', 'balance', 'invoice', 'receipt'],
    answer:
      'Open the Student Portal → Fees. You will see your balance and can submit a payment. Receipts appear once Finance confirms.',
  },
  {
    id: 'help',
    q: 'Something is not working — what do I do?',
    keywords: ['broken', 'error', 'bug', 'not working', 'problem', 'help', 'issue', 'stuck'],
    answer:
      'Sorry to hear that! Try:\n' +
      '1. Refresh the page (Ctrl + Shift + R)\n' +
      '2. Log out and log back in\n' +
      '3. Clear your browser cache\n\n' +
      'If it still fails, message your lecturer or contact the administrator.',
  },
];

export function matchFaq(input, faqs) {
  const text = String(input || '').toLowerCase().trim();
  if (!text) return null;

  let best = null;
  let bestScore = 0;

  for (const faq of faqs) {
    let score = 0;
    for (const kw of faq.keywords) {
      if (text.includes(kw.toLowerCase())) score += kw.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = faq;
    }
  }

  return bestScore >= 3 ? best : null;
}
