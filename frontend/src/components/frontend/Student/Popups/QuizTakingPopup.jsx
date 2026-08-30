import { useState, useEffect, useRef, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faCircleCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../api/client.js'

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Full-screen quiz-taking experience: starts the attempt on open, counts
// down locally, and submits (auto or manual) to the server, which is the
// one source of truth for scoring and for whether time actually ran out.
function QuizTakingPopup({ quizId, onClose, onFinished }) {
  const [session, setSession] = useState(null) // { attemptId, quiz, timerMinutes, serverStartTime }
  const [answers, setAnswers] = useState({}) // questionId -> [optionIndex]
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const submittedRef = useRef(false)
  const startedRef = useRef(false)

  useEffect(() => {
    // Guard against firing the start request twice for the same mount
    // (React 18 StrictMode intentionally double-invokes effects in dev,
    // which used to send two "start" calls back-to-back and could surface
    // as a "quiz already in use" error even though nothing was wrong).
    if (startedRef.current) return
    startedRef.current = true
    api.post(`/quizzes/${quizId}/start`)
      .then((res) => {
        setSession(res)
        setSecondsLeft(res.timerMinutes * 60)
      })
      .catch((err) => setError(err.message || 'Could not start the quiz.'))
  }, [quizId])

  const doSubmit = useCallback((timedOut = false) => {
    if (!session || submittedRef.current) return
    submittedRef.current = true
    setSubmitting(true)
    const payload = {
      attemptId: session.attemptId,
      answers: Object.entries(answers).map(([questionId, selectedOptionIndexes]) => ({ questionId, selectedOptionIndexes })),
      timedOut,
    }
    api.post('/quizzes/submit', payload)
      .then(setResult)
      .catch((err) => setError(err.message || 'Could not submit the quiz.'))
      .finally(() => setSubmitting(false))
  }, [session, answers])

  useEffect(() => {
    if (secondsLeft === null || result) return
    if (secondsLeft <= 0) {
      doSubmit(true)
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft, result, doSubmit])

  // Each question has exactly one correct answer, so selecting an option
  // replaces whatever was picked before for that question rather than
  // adding to a set - matches the radio-button UI below.
  const selectOption = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: [optionIndex] }))
  }

  if (error) {
    return (
      <div className="generic-popup-overlay">
        <div className="generic-popup-card">
          <div className="generic-popup-icon-wrap"><FontAwesomeIcon icon={faTriangleExclamation} className="generic-popup-icon" /></div>
          <h3 className="generic-popup-title">Couldn't Start Quiz</h3>
          <div className="auth-error-banner">{error}</div>
          <button className="generic-popup-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="generic-popup-overlay">
        <div className="generic-popup-card">
          <div className="generic-popup-icon-wrap"><FontAwesomeIcon icon={faCircleCheck} className="generic-popup-icon" /></div>
          <h3 className="generic-popup-title">{result.passed ? 'You Passed!' : 'Quiz Submitted'}</h3>
          <p className="generic-popup-text">
            {result.correctCount}/{result.totalQuestions} correct — {result.percentage}%
          </p>
          <p className={`quiz-status-chip ${result.passed ? 'quiz-status-passed' : 'quiz-status-failed'}`} style={{ margin: '0 auto 16px' }}>
            {result.passed ? 'Pass (70%+)' : 'Fail (below 70%)'}
          </p>
          <button className="generic-popup-btn" onClick={() => onFinished()}>Done</button>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="generic-popup-overlay">
        <div className="generic-popup-card"><p className="subadmin-chart-title">Starting quiz...</p></div>
      </div>
    )
  }

  const isLowTime = secondsLeft <= 30

  return (
    <div className="quiz-taking-overlay">
      <div className="quiz-taking-header">
        <h3 className="quiz-taking-title">{session.quiz.title}</h3>
        <span className={`quiz-taking-timer ${isLowTime ? 'quiz-taking-timer-low' : ''}`}>
          <FontAwesomeIcon icon={faClock} /> {formatTime(secondsLeft)}
        </span>
      </div>

      <div className="quiz-taking-body">
        {session.quiz.questions.map((q, idx) => (
          <div key={q._id} className="quiz-question-box">
            <div className="quiz-question-box-head">
              <span className="quiz-question-number">Q{idx + 1}</span>
              <span style={{ fontWeight: 600 }}>{q.text}</span>
            </div>
            {q.options.map((opt, optIdx) => (
              <label key={opt._id} className="quiz-taking-option-row">
                <input
                  type="radio"
                  name={`question-${q._id}`}
                  checked={(answers[q._id] || []).includes(optIdx)}
                  onChange={() => selectOption(q._id, optIdx)}
                />
                <span className="quiz-option-letter">{String.fromCharCode(65 + optIdx)}</span>
                {opt.text}
              </label>
            ))}
          </div>
        ))}
      </div>

      <div className="quiz-taking-footer">
        <span className="subadmin-role-hint">{Object.keys(answers).length}/{session.quiz.questions.length} answered</span>
        <button type="button" className="generic-popup-btn" disabled={submitting} onClick={() => doSubmit(false)}>
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
      </div>
    </div>
  )
}

export default QuizTakingPopup
