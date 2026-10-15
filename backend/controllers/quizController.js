const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const Unit = require('../models/Unit');
const Student = require('../models/Student');
const UnitRegistration = require('../models/UnitRegistration');
const Semester = require('../models/Semester');
const Assessment = require('../models/Assessment');

const assertLecturerOwnsUnit = async (req, res, unitId) => {
  const unit = await Unit.findById(unitId);
  if (!unit) { res.status(404).json({ message: 'Unit not found' }); return null; }
  if (String(unit.lecturerId) !== String(req.user._id)) {
    res.status(403).json({ message: 'You do not own this unit' });
    return null;
  }
  return unit;
};

const computeMaxScore = (questions) => questions.reduce((s, q) => s + (q.points || 0), 0);

exports.createQuiz = async (req, res) => {
  try {
    const unit = await assertLecturerOwnsUnit(req, res, req.params.unitId);
    if (!unit) return;

    const { title, description, durationMinutes, maxAttempts, passScore,
            linkToAssessment, weight, shuffleQuestions, showScoreImmediately } = req.body;

    if (!title || !title.trim()) return res.status(400).json({ message: 'Title required' });

  const currentSemester = await Semester.findOne({ isCurrent: true });
const semester = currentSemester ? currentSemester.code : (unit.semester || '2026-S1');

    if (linkToAssessment && Number(weight) > 0) {
      const existing = await Assessment.find({ unitId: unit._id, semester });
      const total = existing.reduce((s, a) => s + (Number(a.weight) || 0), 0);
      if (total + Number(weight) > 100) {
        return res.status(400).json({
          message: 'Cannot add ' + weight + '% — current total is ' + total + '%, would become ' + (total + Number(weight)) + '%',
        });
      }
    }

    const quiz = await Quiz.create({
      unitId: unit._id,
      semester,
      createdBy: req.user._id,
      title: title.trim(),
      description: (description || '').trim(),
      durationMinutes: Number(durationMinutes) || 30,
      maxAttempts: Math.min(5, Math.max(1, Number(maxAttempts) || 1)),
      passScore: Number(passScore) || 50,
      shuffleQuestions: !!shuffleQuestions,
      showScoreImmediately: showScoreImmediately !== false,
      linkToAssessment: !!linkToAssessment,
      weight: Number(weight) || 0,
    });

    res.status(201).json({ quiz });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.listQuizzes = async (req, res) => {
  try {
    const unit = await assertLecturerOwnsUnit(req, res, req.params.unitId);
    if (!unit) return;

    const quizzes = await Quiz.find({ unitId: unit._id }).sort({ createdAt: -1 }).lean();

    const withCounts = await Promise.all(quizzes.map(async (q) => {
      const [questionCount, attemptCount] = await Promise.all([
        QuizQuestion.countDocuments({ quizId: q._id }),
        QuizAttempt.countDocuments({ quizId: q._id, status: { $in: ['submitted', 'graded'] } }),
      ]);
      return Object.assign({}, q, { questionCount, attemptCount });
    }));

    res.json({ quizzes: withCounts });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const unit = await assertLecturerOwnsUnit(req, res, quiz.unitId);
    if (!unit) return;

    const questions = await QuizQuestion.find({ quizId: quiz._id }).sort({ order: 1 }).lean();
    res.json({ quiz, questions });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const unit = await assertLecturerOwnsUnit(req, res, quiz.unitId);
    if (!unit) return;

    const allowed = ['title','description','durationMinutes','maxAttempts','passScore',
                     'shuffleQuestions','showScoreImmediately','showCorrectAnswers','weight'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) quiz[k] = req.body[k];
    }
    quiz.updatedAt = new Date();
    await quiz.save();
    res.json({ quiz });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const unit = await assertLecturerOwnsUnit(req, res, quiz.unitId);
    if (!unit) return;

    await Promise.all([
      QuizQuestion.deleteMany({ quizId: quiz._id }),
      QuizAttempt.deleteMany({ quizId: quiz._id }),
    ]);
    await Quiz.findByIdAndDelete(quiz._id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.addQuestion = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const unit = await assertLecturerOwnsUnit(req, res, quiz.unitId);
    if (!unit) return;

    const { type, question, options, correctIndex, expectedAnswer, points } = req.body;
    if (['mcq','truefalse','short'].indexOf(type) === -1) return res.status(400).json({ message: 'Invalid type' });
    if (!question || !question.trim()) return res.status(400).json({ message: 'Question required' });

    if (type === 'mcq') {
      if (!Array.isArray(options) || options.length < 2) return res.status(400).json({ message: 'MCQ needs 2+ options' });
      if (correctIndex == null || correctIndex < 0 || correctIndex >= options.length) {
        return res.status(400).json({ message: 'Pick a correct option' });
      }
    }
    if (type === 'truefalse') {
      if (!Array.isArray(options) || options.length !== 2) {
        return res.status(400).json({ message: 'True/False must have 2 options' });
      }
    }

    const maxOrder = await QuizQuestion.findOne({ quizId: quiz._id }).sort({ order: -1 }).select('order');
    const order = maxOrder ? maxOrder.order + 1 : 1;

    const q = await QuizQuestion.create({
      quizId: quiz._id,
      order,
      type,
      question: question.trim(),
      options: (type === 'short') ? [] : options.map((o) => ({ label: (o.label || o).trim() })),
      correctIndex: type === 'short' ? null : Number(correctIndex),
      expectedAnswer: (expectedAnswer || '').trim(),
      points: Number(points) || 1,
    });

    res.status(201).json({ question: q });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const unit = await assertLecturerOwnsUnit(req, res, quiz.unitId);
    if (!unit) return;
    await QuizQuestion.findByIdAndDelete(req.params.qid);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.publishQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const unit = await assertLecturerOwnsUnit(req, res, quiz.unitId);
    if (!unit) return;

    const count = await QuizQuestion.countDocuments({ quizId: quiz._id });
    if (count === 0) return res.status(400).json({ message: 'Add at least one question before publishing' });

    quiz.status = 'published';
    quiz.publishedAt = new Date();

    if (quiz.linkToAssessment && quiz.weight > 0 && !quiz.assessmentId) {
      const assess = await Assessment.create({
        unitId: quiz.unitId, semester: quiz.semester,
        name: quiz.title, type: 'cat', number: 1, weight: quiz.weight, maxScore: 100,
      });
      quiz.assessmentId = assess._id;
    }

    await quiz.save();
    res.json({ quiz });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.closeQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const unit = await assertLecturerOwnsUnit(req, res, quiz.unitId);
    if (!unit) return;
    quiz.status = 'closed';
    await quiz.save();
    res.json({ quiz });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyQuizzes = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.json({ quizzes: [] });

    const reg = await UnitRegistration.findOne({
      studentId: student._id, semester: semester.code, status: 'approved',
    }).populate('unitIds', 'code name');
    if (!reg || !reg.unitIds || !reg.unitIds.length) return res.json({ quizzes: [] });

    const unitIds = reg.unitIds.map((u) => u._id);

    const quizzes = await Quiz.find({
      unitId: { $in: unitIds },
      semester: semester.code,
      status: { $in: ['published','closed'] },
    }).populate('unitId', 'code name').sort({ createdAt: -1 }).lean();

    const attempts = await QuizAttempt.find({
      quizId: { $in: quizzes.map((q) => q._id) },
      studentId: student._id,
    }).lean();

    const attemptMap = {};
    attempts.forEach((a) => {
      const k = String(a.quizId);
      if (!attemptMap[k]) attemptMap[k] = [];
      attemptMap[k].push(a);
    });

    const rows = await Promise.all(quizzes.map(async (q) => {
      const mine = attemptMap[String(q._id)] || [];
      const best = mine
        .filter((a) => a.status !== 'in-progress' && a.status !== 'expired')
        .sort((a,b) => b.percent - a.percent)[0] || null;
      const inProg = mine.find((a) => a.status === 'in-progress') || null;
      const qCount = await QuizQuestion.countDocuments({ quizId: q._id });

      return {
        _id: q._id,
        title: q.title,
        description: q.description,
        unit: q.unitId ? { code: q.unitId.code, name: q.unitId.name } : null,
        durationMinutes: q.durationMinutes,
        maxAttempts: q.maxAttempts,
        passScore: q.passScore,
        status: q.status,
        questionCount: qCount,
        attemptsUsed: mine.length,
        inProgressId: inProg ? inProg._id : null,
   best: best ? {
  attemptId: best._id,
  percent: best.percent,
  score: (best.autoScore || 0) + (best.manualScore || 0),
  maxScore: best.maxScore,
  status: best.status,
} : null,
      };
    }));

    res.json({ quizzes: rows });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.startQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || quiz.status !== 'published') return res.status(400).json({ message: 'Quiz not available' });

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const existing = await QuizAttempt.findOne({
      quizId: quiz._id, studentId: student._id, status: 'in-progress',
    });
    if (existing) {
      if (new Date() > existing.expiresAt) {
        existing.status = 'expired';
        existing.submittedAt = existing.expiresAt;
        await existing.save();
      } else {
        return res.json({ attempt: existing, resumed: true });
      }
    }

    const used = await QuizAttempt.countDocuments({
      quizId: quiz._id, studentId: student._id,
      status: { $in: ['submitted','graded','expired'] },
    });
    if (used >= quiz.maxAttempts) {
      return res.status(400).json({ message: 'Maximum attempts reached' });
    }

    const questions = await QuizQuestion.find({ quizId: quiz._id }).sort({ order: 1 }).lean();
    if (questions.length === 0) return res.status(400).json({ message: 'Quiz has no questions' });

    const expiresAt = new Date(Date.now() + quiz.durationMinutes * 60 * 1000);

    const attempt = await QuizAttempt.create({
      quizId: quiz._id,
      studentId: student._id,
      unitId: quiz.unitId,
      semester: quiz.semester,
      answers: questions.map((q) => ({ questionId: q._id })),
      startedAt: new Date(),
      expiresAt,
      maxScore: computeMaxScore(questions),
      status: 'in-progress',
    });

    res.status(201).json({
      attempt,
      quiz: {
        _id: quiz._id, title: quiz.title,
        description: quiz.description, durationMinutes: quiz.durationMinutes,
      },
      questions: questions.map((q) => ({
        _id: q._id, type: q.type, question: q.question,
        options: q.options, points: q.points,
      })),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.submitAttempt = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id);
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    if (attempt.status !== 'in-progress') return res.status(400).json({ message: 'Attempt already submitted' });

    const student = await Student.findOne({ userId: req.user._id });
    if (!student || String(attempt.studentId) !== String(student._id)) {
      return res.status(403).json({ message: 'Not your attempt' });
    }

    const questions = await QuizQuestion.find({ quizId: attempt.quizId }).lean();
    const submitted = req.body.answers || [];
    let autoScore = 0;

    const newAnswers = questions.map((q) => {
      const given = submitted.find((a) => String(a.questionId) === String(q._id)) || {};
      let auto = 0;
      if ((q.type === 'mcq' || q.type === 'truefalse') && given.selectedIndex != null) {
        if (Number(given.selectedIndex) === Number(q.correctIndex)) auto = q.points;
      }
      autoScore += auto;
      return {
        questionId: q._id,
        selectedIndex: given.selectedIndex != null ? given.selectedIndex : null,
        text: given.text || '',
        autoScore: auto,
        manualScore: null,
        feedback: '',
      };
    });

    attempt.answers = newAnswers;
    attempt.autoScore = autoScore;
    attempt.submittedAt = new Date();

    const hasShort = questions.some((q) => q.type === 'short');
    attempt.status = hasShort ? 'submitted' : 'graded';
    attempt.percent = attempt.maxScore > 0
      ? Math.round((autoScore / attempt.maxScore) * 10000) / 100
      : 0;

    await attempt.save();

    if (attempt.status === 'graded') {
      await syncMarksForAttempt(attempt);
    }

    res.json({ attempt });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyAttempt = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id).lean();
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || String(attempt.studentId) !== String(student._id)) {
      return res.status(403).json({ message: 'Not your attempt' });
    }

    const quiz = await Quiz.findById(attempt.quizId).lean();
    const questions = await QuizQuestion.find({ quizId: attempt.quizId }).sort({ order: 1 }).lean();

   // After the student has submitted, always reveal the correct answer for auto-graded questions
const submitted = attempt.status !== 'in-progress';
const reveal = submitted || (quiz.showCorrectAnswers && attempt.status === 'graded');

    res.json({
      attempt,
      quiz: { _id: quiz._id, title: quiz.title, showScoreImmediately: quiz.showScoreImmediately },
      questions: questions.map((q) => ({
        _id: q._id, type: q.type, question: q.question,
        options: q.options, points: q.points,
        correctIndex: reveal ? q.correctIndex : undefined,
      })),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.listAttempts = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const unit = await assertLecturerOwnsUnit(req, res, quiz.unitId);
    if (!unit) return;

    const attempts = await QuizAttempt.find({ quizId: quiz._id })
      .populate('studentId', 'studentNumber personalInfo userId')
      .sort({ submittedAt: -1, startedAt: -1 })
      .lean();

    const rows = attempts.map((a) => {
      const p = (a.studentId && a.studentId.personalInfo) || {};
      const name = [p.title, p.surname, p.lastName].filter(Boolean).join(' ')
        || (a.studentId && a.studentId.studentNumber) || 'Unnamed';
      return {
        _id: a._id,
        studentName: name,
        studentNumber: a.studentId ? a.studentId.studentNumber : null,
        status: a.status,
        autoScore: a.autoScore,
        manualScore: a.manualScore,
        maxScore: a.maxScore,
        percent: a.percent,
        submittedAt: a.submittedAt,
        startedAt: a.startedAt,
      };
    });

    res.json({ attempts: rows });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAttempt = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id)
      .populate('studentId', 'studentNumber personalInfo').lean();
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

    const quiz = await Quiz.findById(attempt.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const unit = await assertLecturerOwnsUnit(req, res, quiz.unitId);
    if (!unit) return;

    const questions = await QuizQuestion.find({ quizId: quiz._id }).sort({ order: 1 }).lean();
    res.json({ attempt, quiz, questions });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.gradeAttempt = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id);
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

    const quiz = await Quiz.findById(attempt.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const unit = await assertLecturerOwnsUnit(req, res, quiz.unitId);
    if (!unit) return;

    const questions = await QuizQuestion.find({ quizId: quiz._id }).lean();
    const qMap = Object.fromEntries(questions.map((q) => [String(q._id), q]));
    const grades = req.body.manualScores || {};

    let manualTotal = 0;
    attempt.answers.forEach((a) => {
      const q = qMap[String(a.questionId)];
      const g = grades[String(a.questionId)];
      if (q && q.type === 'short') {
        if (g && g.manualScore != null) {
          a.manualScore = Math.min(Number(g.manualScore), q.points);
          a.feedback = g.feedback || '';
          manualTotal += a.manualScore;
        } else {
          a.manualScore = 0;
        }
      } else {
        a.manualScore = null;
      }
    });

    attempt.manualScore = manualTotal;
    attempt.status = 'graded';
    attempt.gradedBy = req.user._id;
    attempt.gradedAt = new Date();
    attempt.percent = attempt.maxScore > 0
      ? Math.round(((attempt.autoScore + manualTotal) / attempt.maxScore) * 10000) / 100
      : 0;

    await attempt.save();
    await syncMarksForAttempt(attempt);

    res.json({ attempt });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

async function syncMarksForAttempt(attempt) {
  try {
    const quiz = await Quiz.findById(attempt.quizId);
    if (!quiz || !quiz.linkToAssessment || !quiz.assessmentId) return;

    const Mark = require('../models/Mark');
    await Mark.findOneAndUpdate(
      { studentId: attempt.studentId, assessmentId: quiz.assessmentId },
      {
        $set: {
          unitId: quiz.unitId,
          semester: quiz.semester,
          score: (attempt.autoScore || 0) + (attempt.manualScore || 0),
          gradedBy: attempt.gradedBy,
          gradedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (e) {
    console.error('syncMarksForAttempt failed:', e.message);
  }
}
