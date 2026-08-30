import mongoose from 'mongoose'

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOptionIndexes: { type: [Number], default: [] },
  },
  { _id: false }
)

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    attemptNumber: { type: Number, required: true },
    answers: { type: [answerSchema], default: [] },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    timedOut: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Teachers can reset a student's attempts by deleting their QuizAttempt docs
// for that quiz (see quizController.resetAttempts) - attemptNumber then
// naturally restarts from 1 since it's derived from the remaining count.
quizAttemptSchema.index({ quiz: 1, student: 1, attemptNumber: 1 }, { unique: true })

export default mongoose.model('QuizAttempt', quizAttemptSchema)
