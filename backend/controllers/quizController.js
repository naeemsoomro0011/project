import Quiz from '../models/Quiz.js'
import QuizAttempt from '../models/QuizAttempt.js'
import Slot from '../models/Slot.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const MAX_ATTEMPTS = 3
const PASS_PERCENTAGE = 70

// A teacher can mark one or more options correct on a question, but the
// student always picks just a single option when taking the quiz - they're
// marked correct if that one pick is any of the marked-correct indexes.
// So a question just needs at least one correct option, not exactly one.
function validateQuestions(questions) {
  for (const q of questions) {
    if (!q.text || !q.options?.length || q.options.length < 2) {
      return 'Every question needs text and at least 2 options.'
    }
    if (!q.correctOptionIndexes?.length) {
      return `"${q.text}" must have at least one correct option marked.`
    }
  }
  return null
}

function stripAnswers(quiz) {
  const obj = quiz.toObject ? quiz.toObject() : quiz
  return {
    ...obj,
    questions: obj.questions.map((q) => ({
      _id: q._id,
      text: q.text,
      options: q.options,
    })),
  }
}

export const quizzesForStudentInSlot = asyncHandler(async (req, res) => {
  const { studentId } = req.params
  const { slot } = req.query
  if (!slot) return res.status(400).json({ message: 'A slot is required.' })

  const quizzes = await Quiz.find({ slot, isDeleted: false }).sort({ createdAt: -1 })
  const attempts = await QuizAttempt.find({ student: studentId, quiz: { $in: quizzes.map((q) => q._id) } }).sort({ attemptNumber: -1 })
  const latestByQuiz = new Map()
  for (const a of attempts) {
    if (!latestByQuiz.has(String(a.quiz))) latestByQuiz.set(String(a.quiz), a)
  }

  res.json(quizzes.map((q) => ({
    ...stripAnswers(q),
    totalQuestions: q.questions.length,
    studentLatestAttempt: latestByQuiz.get(String(q._id)) || null,
  })))
})

export const createQuiz = asyncHandler(async (req, res) => {
  const { slot, title, totalMarks, timerMinutes, dueDate, dueTime, questions } = req.body
  if (!slot || !title || !totalMarks || !timerMinutes || !dueDate || !questions?.length) {
    return res.status(400).json({ message: 'Slot, title, total marks, timer, due date and at least one question are required.' })
  }
  const slotDoc = await Slot.findById(slot)
  if (!slotDoc) return res.status(404).json({ message: 'Slot not found.' })
  if (String(slotDoc.teacher) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only create quizzes for your own batch.' })
  }
  const questionsError = validateQuestions(questions)
  if (questionsError) return res.status(400).json({ message: questionsError })

  const quiz = await Quiz.create({ teacher: req.user._id, slot, title, totalMarks, timerMinutes, dueDate, dueTime, questions })
  res.status(201).json(quiz)
})

export const listQuizzesForSlot = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = 8
  const filter = { slot: req.params.slotId, isDeleted: false }
  const [quizzes, total] = await Promise.all([
    Quiz.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Quiz.countDocuments(filter),
  ])
  res.json({ quizzes, total, page, pages: Math.ceil(total / limit) })
})

export const myQuizzes = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = 8
  const filter = { slot: req.user.slot, isDeleted: false }
  const [quizzes, total] = await Promise.all([
    Quiz.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Quiz.countDocuments(filter),
  ])

  const withAttempts = await Promise.all(
    quizzes.map(async (q) => {
      const attempts = await QuizAttempt.find({ quiz: q._id, student: req.user._id }).sort({ attemptNumber: -1 })
      return {
        ...stripAnswers(q),
        totalQuestions: q.questions.length,
        attemptsUsed: attempts.length,
        attemptsRemaining: Math.max(0, MAX_ATTEMPTS - attempts.length),
        lastAttempt: attempts[0] || null,
      }
    })
  )

  res.json({ quizzes: withAttempts, total, page, pages: Math.ceil(total / limit) })
})

export const startQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id)
  if (!quiz || quiz.isDeleted) return res.status(404).json({ message: 'Quiz not found.' })
  if (String(quiz.slot) !== String(req.user.slot)) {
    return res.status(403).json({ message: 'This quiz is not for your batch.' })
  }

  // If this student already has an unsubmitted attempt (popup re-opened,
  // page refreshed mid-quiz, etc.), resume it instead of trying to create a
  // brand new one - that's what used to collide with the unique index below
  // and surface as a confusing "This quiz is already in use" error.
  const inProgress = await QuizAttempt
    .findOne({ quiz: quiz._id, student: req.user._id, submittedAt: null })
    .sort({ attemptNumber: -1 })
  if (inProgress) {
    return res.status(201).json({
      attemptId: inProgress._id,
      quiz: stripAnswers(quiz),
      timerMinutes: quiz.timerMinutes,
      serverStartTime: inProgress.startedAt,
    })
  }

  const attemptsCount = await QuizAttempt.countDocuments({ quiz: quiz._id, student: req.user._id })
  if (attemptsCount >= MAX_ATTEMPTS) {
    return res.status(403).json({ message: `You have used all ${MAX_ATTEMPTS} attempts for this quiz. Ask your teacher to reset your attempts.` })
  }

  let attempt
  try {
    attempt = await QuizAttempt.create({
      quiz: quiz._id,
      student: req.user._id,
      attemptNumber: attemptsCount + 1,
      startedAt: new Date(),
    })
  } catch (err) {
    // Two "start" requests landed at the same instant (double-click, a slow
    // connection retrying, React dev-mode firing the effect twice) and both
    // read the same attemptsCount, so both tried to create attemptNumber N -
    // the unique index rejects the loser with a duplicate-key error. Instead
    // of bubbling that up as "quiz already in use", just hand back the
    // attempt the winner created.
    if (err.code === 11000) {
      attempt = await QuizAttempt
        .findOne({ quiz: quiz._id, student: req.user._id, submittedAt: null })
        .sort({ attemptNumber: -1 })
      if (!attempt) throw err
    } else {
      throw err
    }
  }

  res.status(201).json({
    attemptId: attempt._id,
    quiz: stripAnswers(quiz),
    timerMinutes: quiz.timerMinutes,
    serverStartTime: attempt.startedAt,
  })
})

export const submitQuiz = asyncHandler(async (req, res) => {
  const { attemptId, answers, timedOut } = req.body
  const attempt = await QuizAttempt.findById(attemptId)
  if (!attempt) return res.status(404).json({ message: 'Attempt not found.' })
  if (String(attempt.student) !== String(req.user._id)) {
    return res.status(403).json({ message: 'This is not your attempt.' })
  }
  if (attempt.submittedAt) {
    return res.status(409).json({ message: 'This attempt was already submitted.' })
  }

  const quiz = await Quiz.findById(attempt.quiz)
  if (!quiz) return res.status(404).json({ message: 'Quiz not found.' })

  // Grace period matches the timer + 15s network/UI buffer; anything beyond
  // that is scored as a timeout regardless of what the client claims.
  const elapsedMs = Date.now() - new Date(attempt.startedAt).getTime()
  const allowedMs = quiz.timerMinutes * 60 * 1000 + 15000
  const serverTimedOut = elapsedMs > allowedMs

  let correctCount = 0
  const answerMap = new Map((answers || []).map((a) => [String(a.questionId), a.selectedOptionIndexes || []]))

  for (const q of quiz.questions) {
    if (serverTimedOut) continue // ran out of time -> everything remaining counts as incorrect
    // Student picks exactly one option for a question; it's correct as long
    // as that pick is one of the (possibly several) options the teacher
    // marked correct - not an exact match against the whole correct set.
    const given = answerMap.get(String(q._id)) || []
    const isCorrect = given.length === 1 && q.correctOptionIndexes.includes(given[0])
    if (isCorrect) correctCount++
  }

  const totalQuestions = quiz.questions.length
  const incorrectCount = totalQuestions - correctCount
  const percentage = totalQuestions ? Math.round((correctCount / totalQuestions) * 1000) / 10 : 0

  attempt.answers = (answers || []).map((a) => ({ questionId: a.questionId, selectedOptionIndexes: a.selectedOptionIndexes || [] }))
  attempt.correctCount = correctCount
  attempt.incorrectCount = incorrectCount
  attempt.percentage = percentage
  attempt.passed = percentage >= PASS_PERCENTAGE
  attempt.submittedAt = new Date()
  attempt.timedOut = serverTimedOut || !!timedOut
  await attempt.save()

  res.json({
    totalQuestions,
    correctCount,
    incorrectCount,
    percentage,
    passed: attempt.passed,
  })
})

export const updateQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id)
  if (!quiz) return res.status(404).json({ message: 'Quiz not found.' })
  if (String(quiz.teacher) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only edit your own quizzes.' })
  }
  const { title, totalMarks, timerMinutes, dueDate, dueTime, questions } = req.body
  if (title) quiz.title = title
  if (totalMarks) quiz.totalMarks = totalMarks
  if (timerMinutes) quiz.timerMinutes = timerMinutes
  if (dueDate) quiz.dueDate = dueDate
  if (dueTime !== undefined) quiz.dueTime = dueTime
  if (questions) {
    const questionsError = validateQuestions(questions)
    if (questionsError) return res.status(400).json({ message: questionsError })
    quiz.questions = questions
  }
  await quiz.save()
  res.json(quiz)
})

export const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id)
  if (!quiz) return res.status(404).json({ message: 'Quiz not found.' })
  if (String(quiz.teacher) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only delete your own quizzes.' })
  }
  await QuizAttempt.deleteMany({ quiz: quiz._id })
  await Quiz.findByIdAndDelete(quiz._id)
  res.json({ message: 'Quiz deleted.' })
})

export const quizResults = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id)
  if (!quiz) return res.status(404).json({ message: 'Quiz not found.' })
  const attempts = await QuizAttempt.find({ quiz: quiz._id }).populate('student', 'name roll photo').sort({ createdAt: -1 })
  res.json(attempts)
})

// Deletes ALL of one student's attempts for this quiz, resetting them to 0/3
// so they can attempt again - the exact behaviour called for in the spec.
export const resetStudentAttempts = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id)
  if (!quiz) return res.status(404).json({ message: 'Quiz not found.' })
  if (String(quiz.teacher) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only manage your own quizzes.' })
  }
  await QuizAttempt.deleteMany({ quiz: quiz._id, student: req.params.studentId })
  res.json({ message: "Student's attempts have been reset to 0/3." })
})
