import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleInfo, faCircleCheck, faPlay } from '@fortawesome/free-solid-svg-icons'
import StudentTopbar from '../Layout/StudentTopbar.jsx'
import QuizTakingPopup from '../Popups/QuizTakingPopup.jsx'
import { api } from '../../../../api/client.js'

const infoLines = [
  'Once started, the timer cannot be paused — finish the quiz in one sitting.',
  'You get 3 attempts per quiz; your best attempt is what counts.',
  'You need 70% or higher to pass.',
  'Ask your teacher to reset your attempts if you run out.',
]

function Quiz() {
  const { openFeedback } = useOutletContext()
  const [quizzes, setQuizzes] = useState([])
  const [error, setError] = useState('')
  const [taking, setTaking] = useState(null) // quizId

  const load = useCallback(() => {
    api.get('/quizzes/me').then((res) => setQuizzes(res.quizzes)).catch((err) => setError(err.message || 'Could not load quizzes.'))
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="student-page">
      <StudentTopbar breadcrumb={['Home', 'Quiz']} onFeedbackClick={openFeedback} />

      <div className="quiz-info-box">
        <h4 className="quiz-info-heading">
          <FontAwesomeIcon icon={faCircleInfo} /> Important Information
        </h4>
        <ol className="quiz-info-list">
          {infoLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </div>

      {error && <div className="auth-error-banner">{error}</div>}

      <div className="quiz-table-box">
        <div className="quiz-table-head">
          <span>Title</span>
          <span>Questions</span>
          <span>Attempts</span>
          <span>Score</span>
          <span>Percentage</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {quizzes.map((q) => {
          const attempt = q.lastAttempt
          const statusLabel = attempt?.submittedAt ? (attempt.passed ? 'Passed' : 'Failed') : 'Not Attempted'
          return (
            <div key={q._id} className="quiz-table-row">
              <span>{q.title}</span>
              <span>{q.totalQuestions}</span>
              <span>{q.attemptsUsed}/3</span>
              <span>{attempt ? `${attempt.correctCount}/${q.totalQuestions}` : '-'}</span>
              <span>{attempt ? `${attempt.percentage}%` : '-'}</span>
              <span className={`quiz-status-chip ${statusLabel === 'Passed' ? 'quiz-status-passed' : statusLabel === 'Failed' ? 'quiz-status-failed' : ''}`}>
                {statusLabel}
              </span>
              <span>
                {q.attemptsRemaining > 0 ? (
                  <button type="button" className="quiz-start-btn" onClick={() => setTaking(q._id)}>
                    <FontAwesomeIcon icon={faPlay} /> {q.attemptsUsed > 0 ? 'Retake' : 'Start Quiz'}
                  </button>
                ) : (
                  <span className="quiz-action-completed">
                    <FontAwesomeIcon icon={faCircleCheck} /> No attempts left
                  </span>
                )}
              </span>
            </div>
          )
        })}

        {quizzes.length === 0 && <p className="attendance-no-record">No quizzes yet.</p>}
      </div>

      <p className="quiz-footer-note">
        Contact your instructor if you have any issues accessing your quizzes.
      </p>

      {taking && (
        <QuizTakingPopup
          quizId={taking}
          onClose={() => setTaking(null)}
          onFinished={() => { setTaking(null); load() }}
        />
      )}
    </div>
  )
}

export default Quiz
