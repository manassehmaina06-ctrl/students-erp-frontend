const express = require('express');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  createQuiz, listQuizzes, getQuiz, updateQuiz, deleteQuiz,
  addQuestion, deleteQuestion, publishQuiz, closeQuiz,
  listAttempts, getAttempt, gradeAttempt,
} = require('../controllers/quizController');

const router = express.Router();
const lecturerOnly = [protect, roleCheck(['lecturer'])];

router.post   ('/units/:unitId/quizzes',        ...lecturerOnly, createQuiz);
router.get    ('/units/:unitId/quizzes',        ...lecturerOnly, listQuizzes);

router.get    ('/quizzes/:id',                  ...lecturerOnly, getQuiz);
router.put    ('/quizzes/:id',                  ...lecturerOnly, updateQuiz);
router.delete ('/quizzes/:id',                  ...lecturerOnly, deleteQuiz);

router.post   ('/quizzes/:id/questions',        ...lecturerOnly, addQuestion);
router.delete ('/quizzes/:quizId/questions/:qid', ...lecturerOnly, deleteQuestion);

router.post   ('/quizzes/:id/publish',          ...lecturerOnly, publishQuiz);
router.post   ('/quizzes/:id/close',            ...lecturerOnly, closeQuiz);

router.get    ('/quizzes/:id/attempts',         ...lecturerOnly, listAttempts);
router.get    ('/quizzes/attempts/:id',         ...lecturerOnly, getAttempt);
router.put    ('/quizzes/attempts/:id/grade',   ...lecturerOnly, gradeAttempt);

module.exports = router;
