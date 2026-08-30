import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark, faFileCircleQuestion, faTrashCan, faChevronLeft, faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../api/client.js'

const PAGE_SIZE = 8

function QuizResultsPopup({ quiz, onClose }) {
  const [attempts, setAttempts] = useState([])
  const [confirming, setConfirming] = useState(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  const load = () => {
    api.get(`/quizzes/${quiz._id}/results`).then(setAttempts).catch((err) => setError(err.message || 'Could not load results.'))
  }

  useEffect(() => { if (quiz) load() }, [quiz]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!quiz) return null

  // Group attempts by student, keep only the latest attempt per student for display.
  const byStudent = new Map()
  for (const a of attempts) {
    const key = a.student?._id
    if (!key) continue
    const existing = byStudent.get(key)
    if (!existing || a.attemptNumber > existing.attemptNumber) byStudent.set(key, a)
  }
  const results = [...byStudent.values()]

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const start = (page - 1) * PAGE_SIZE
  const pageItems = results.slice(start, start + PAGE_SIZE)

  const handleReset = async (studentId) => {
    setError('')
    try {
      await api.delete(`/quizzes/${quiz._id}/results/${studentId}`)
      load()
      setConfirming(null)
    } catch (err) {
      setError(err.message || 'Could not reset attempts.')
    }
  }

  return (
    <div className="generic-popup-overlay">
      <div className="submissions-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faFileCircleQuestion} /> Quiz Results — {quiz.title}
          </span>
          <button className="generic-popup-close" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="quiz-results-table">
          <div className="quiz-results-head">
            <span>Name</span>
            <span>Status</span>
            <span>Score</span>
            <span>Attempt #</span>
            <span>Date</span>
            <span>Reset</span>
          </div>

          {pageItems.map((a) => (
            <div key={a._id} className="quiz-results-row">
              <span>{a.student?.name}</span>
              <span className={`quiz-status-chip ${!a.submittedAt ? '' : a.passed ? 'quiz-status-passed' : 'quiz-status-failed'}`}>
                {!a.submittedAt ? 'In Progress' : a.passed ? 'Pass' : 'Fail'}
              </span>
              <span>{a.correctCount}/{quiz.totalQuestions} ({a.percentage}%)</span>
              <span>{a.attemptNumber}/3</span>
              <span className="quiz-results-date">{a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '-'}</span>
              <span>
                <FontAwesomeIcon
                  icon={faTrashCan}
                  className="assignment-action-icon"
                  onClick={() => setConfirming(a.student?._id)}
                  title="Reset attempts to 0/3"
                />
              </span>
            </div>
          ))}

          {pageItems.length === 0 && <p className="attendance-no-record">No attempts yet.</p>}
        </div>

        <div className="assignment-pagination-row">
          <span className="assignment-pagination-text">
            Showing {results.length === 0 ? 0 : start + 1}-{Math.min(start + PAGE_SIZE, results.length)} of {results.length} records
          </span>
          <div className="assignment-pagination-btns">
            <button type="button" className="assignment-page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <FontAwesomeIcon icon={faChevronLeft} /> Previous
            </button>
            <button type="button" className="assignment-page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Next <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </div>

      {confirming && (
        <div className="generic-popup-overlay">
          <div className="generic-popup-card">
            <h3 className="generic-popup-title">Reset this student's attempts?</h3>
            <p className="generic-popup-text">
              This deletes all of their attempts for this quiz (back to 0/3) so they can retake it
              from scratch. This can't be undone.
            </p>
            <div className="feedback-confirm-btn-row">
              <button className="generic-popup-btn-outline" onClick={() => setConfirming(null)}>Back</button>
              <button className="generic-popup-btn" onClick={() => handleReset(confirming)}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuizResultsPopup
