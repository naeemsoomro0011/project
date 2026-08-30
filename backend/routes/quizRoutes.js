import express from 'express'
import {
  createQuiz,
  listQuizzesForSlot,
  myQuizzes,
  startQuiz,
  submitQuiz,
  updateQuiz,
  deleteQuiz,
  quizResults,
  resetStudentAttempts,
  quizzesForStudentInSlot,
} from '../controllers/quizController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/me', restrictTo('student'), myQuizzes)
router.get('/student/:studentId', restrictTo('teacher', 'superadmin', 'subadmin'), quizzesForStudentInSlot)
router.get('/slot/:slotId', restrictTo('teacher', 'superadmin', 'subadmin'), listQuizzesForSlot)
router.post('/', restrictTo('teacher'), createQuiz)
router.post('/:id/start', restrictTo('student'), startQuiz)
router.post('/submit', restrictTo('student'), submitQuiz)
router.put('/:id', restrictTo('teacher'), updateQuiz)
router.delete('/:id', restrictTo('teacher'), deleteQuiz)
router.get('/:id/results', restrictTo('teacher', 'superadmin', 'subadmin'), quizResults)
router.delete('/:id/results/:studentId', restrictTo('teacher'), resetStudentAttempts)

export default router
