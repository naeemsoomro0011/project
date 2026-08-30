import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faTrashCan, faPlus, faChevronLeft, faChevronRight, faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import CreateQuizPopup from '../Popups/CreateQuizPopup.jsx'
import QuizResultsPopup from '../Popups/QuizResultsPopup.jsx'
import RowMenu from '../../shared/RowMenu.jsx'
import { formatDate, formatTime } from '../../Media/dateUtils.js'
import { api } from '../../../../api/client.js'
import { useAlert } from '../../../../context/AlertContext.jsx'

function CourseQuizzesTab({ slot }) {
  const { confirmAction, success } = useAlert()
  const [quizzes, setQuizzes] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api.get(`/quizzes/slot/${slot._id}?page=${page}`)
      .then((res) => { setQuizzes(res.quizzes); setPages(res.pages); setTotal(res.total) })
      .catch((err) => setError(err.message || 'Could not load quizzes.'))
  }, [slot._id, page])

  useEffect(() => { load() }, [load])

  const handleDelete = async (quiz) => {
    const ok = await confirmAction({
      title: 'Delete this quiz?',
      message: `Delete "${quiz.title}"? Students will no longer be able to attempt it.`,
      confirmText: 'Yes, delete it',
    })
    if (!ok) return
    try {
      await api.delete(`/quizzes/${quiz._id}`)
      success(`"${quiz.title}" has been deleted.`, 'Quiz Deleted')
      load()
    } catch (err) {
      setError(err.message || 'Could not delete quiz.')
    }
  }

  return (
    <div className="course-tab-box">
      <div className="course-tab-header-row">
        <h4 className="course-tab-heading">Quizzes ({total})</h4>
        <button type="button" className="course-tab-new-btn" onClick={() => setShowNew(true)}>
          <FontAwesomeIcon icon={faPlus} /> Create Quiz
        </button>
      </div>

      {error && <div className="auth-error-banner">{error}</div>}

      <div className="teacher-assignment-list-head teacher-quiz-list-head">
        <span>Quiz</span>
        <span>Questions</span>
        <span>Timer</span>
        <span>Due Date</span>
        <span>Results</span>
        <span>Action</span>
      </div>

      {quizzes.map((q) => (
        <div key={q._id} className="teacher-assignment-list-row teacher-quiz-list-row">
          <span className="assignment-row-name">{q.title}</span>
          <span>{q.totalQuestions}</span>
          <span>{q.timerMinutes} min</span>
          <span>{formatDate(new Date(q.dueDate))}{q.dueTime ? ` at ${formatTime(q.dueTime)}` : ''}</span>
          <span className="teacher-quiz-action-row">
            <FontAwesomeIcon icon={faEye} className="assignment-action-icon" onClick={() => setViewing(q)} title="View Results" />
          </span>
          <span>
            <RowMenu items={[
              { label: 'Edit', icon: faPenToSquare, onClick: () => setEditing(q) },
              { label: 'Delete', icon: faTrashCan, danger: true, onClick: () => handleDelete(q) },
            ]} />
          </span>
        </div>
      ))}

      {quizzes.length === 0 && <p className="attendance-no-record">No quizzes yet.</p>}

      <div className="assignment-pagination-row">
        <span className="assignment-pagination-text">Page {page} of {pages}</span>
        <div className="assignment-pagination-btns">
          <button type="button" className="assignment-page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
            <FontAwesomeIcon icon={faChevronLeft} /> Previous
          </button>
          <button type="button" className="assignment-page-btn" disabled={page === pages} onClick={() => setPage(page + 1)}>
            Next <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>

      <CreateQuizPopup show={showNew} slotId={slot._id} onClose={() => setShowNew(false)} onCreated={load} />
      {editing && (
        <CreateQuizPopup
          show
          slotId={slot._id}
          initial={editing}
          onClose={() => setEditing(null)}
          onCreated={() => { load(); success(`"${editing.title}" has been updated.`, 'Quiz Updated') }}
        />
      )}
      {viewing && <QuizResultsPopup quiz={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

export default CourseQuizzesTab
