import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileLines, faPaperPlane, faCircleCheck, faCircleXmark,
  faEye, faCloudArrowUp, faPenToSquare, faChevronLeft, faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import StudentTopbar from '../Layout/StudentTopbar.jsx'
import AssignmentViewPopup from '../Popups/AssignmentViewPopup.jsx'
import AssignmentSubmitPopup from '../Popups/AssignmentSubmitPopup.jsx'
import { formatDate } from '../../Media/dateUtils.js'
import { api } from '../../../../api/client.js'

function statusClass(status) {
  if (status === 'Approved') return 'assignment-row-approved'
  if (status === 'Not Approved') return 'assignment-row-not-approved'
  return 'assignment-row-not-submitted'
}

// The bug: comparing `now` against `new Date(a.dueDate)` directly compares
// against *midnight* of the due date - so the moment the due date arrived
// (12:00 AM), the assignment was already treated as past due and the
// Submit button got disabled for the entire day it was actually due. This
// builds the real due moment: the specific due time if the teacher set
// one, otherwise the end of that day (23:59:59), so students can submit
// any time up until when it's actually due.
function getDueMoment(assignment) {
  const due = new Date(assignment.dueDate)
  if (assignment.dueTime) {
    const [h, m] = assignment.dueTime.split(':').map(Number)
    due.setHours(h || 0, m || 0, 59, 999)
  } else {
    due.setHours(23, 59, 59, 999)
  }
  return due
}

function Assignments() {
  const { openFeedback } = useOutletContext()
  const [page, setPage] = useState(1)
  const [assignments, setAssignments] = useState([])
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [viewing, setViewing] = useState(null)
  const [submitPopup, setSubmitPopup] = useState(null) // { assignment, mode }
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api.get(`/assignments/me?page=${page}`)
      .then((res) => { setAssignments(res.assignments); setPages(res.pages); setTotal(res.total) })
      .catch((err) => setError(err.message || 'Could not load assignments.'))
  }, [page])

  useEffect(() => { load() }, [load])

  const summary = {
    total,
    submitted: assignments.filter((a) => a.mySubmission?.submittedAt).length,
    approved: assignments.filter((a) => a.mySubmission?.status === 'Approved').length,
    notApproved: assignments.filter((a) => a.mySubmission?.status === 'Not Approved').length,
  }

  return (
    <div className="student-page">
      <StudentTopbar breadcrumb={['Home', 'Assignments']} onFeedbackClick={openFeedback} />

      {error && <div className="auth-error-banner">{error}</div>}

      <div className="assignment-stat-row">
        <div className="assignment-stat-box">
          <FontAwesomeIcon icon={faFileLines} className="assignment-stat-icon" />
          <span className="assignment-stat-value">{summary.total}</span>
          <span className="assignment-stat-label">Total</span>
        </div>
        <div className="assignment-stat-box">
          <FontAwesomeIcon icon={faPaperPlane} className="assignment-stat-icon" />
          <span className="assignment-stat-value">{summary.submitted}</span>
          <span className="assignment-stat-label">Submitted</span>
        </div>
        <div className="assignment-stat-box">
          <FontAwesomeIcon icon={faCircleCheck} className="assignment-stat-icon" />
          <span className="assignment-stat-value">{summary.approved}</span>
          <span className="assignment-stat-label">Approved</span>
        </div>
        <div className="assignment-stat-box">
          <FontAwesomeIcon icon={faCircleXmark} className="assignment-stat-icon" />
          <span className="assignment-stat-value">{summary.notApproved}</span>
          <span className="assignment-stat-label">Not Approved</span>
        </div>
      </div>

      <div className="assignment-list-box">
        <div className="assignment-list-head">
          <span>Assignment</span>
          <span>Type</span>
          <span>Due Date</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {assignments.map((a) => {
          const notSubmitted = !a.mySubmission?.submittedAt
          const pastDue = new Date() > getDueMoment(a)
          const canEdit = !notSubmitted && !a.submissionClosed && !pastDue
          const canSubmit = notSubmitted && !a.submissionClosed && !pastDue
          const displayStatus = a.mySubmission ? (a.mySubmission.isLate && a.mySubmission.status === 'Pending' ? 'Late' : a.mySubmission.status) : 'Not Submitted'

          return (
            <div key={a._id} className={`assignment-list-row ${statusClass(displayStatus)}`}>
              <span className="assignment-row-name">{a.title}</span>
              <span className="assignment-row-course">{a.type}</span>
              <span className="assignment-row-date">{formatDate(new Date(a.dueDate))}</span>
              <span className={`assignment-status-chip assignment-status-${displayStatus.replace(/\s+/g, '-').toLowerCase()}`}>
                {displayStatus}
              </span>
              <span className="assignment-row-actions">
                <FontAwesomeIcon
                  icon={faEye}
                  className={`assignment-action-icon ${notSubmitted ? 'assignment-action-icon-disabled' : ''}`}
                  onClick={() => !notSubmitted && setViewing(a)}
                  title="View"
                />
                <FontAwesomeIcon
                  icon={faCloudArrowUp}
                  className={`assignment-action-icon ${!canSubmit ? 'assignment-action-icon-disabled' : ''}`}
                  onClick={() => canSubmit && setSubmitPopup({ assignment: a, mode: 'submit' })}
                  title="Submit"
                />
                <FontAwesomeIcon
                  icon={faPenToSquare}
                  className={`assignment-action-icon ${!canEdit ? 'assignment-action-icon-disabled' : ''}`}
                  onClick={() => canEdit && setSubmitPopup({ assignment: a, mode: 'edit' })}
                  title="Edit"
                />
              </span>
            </div>
          )
        })}

        {assignments.length === 0 && <p className="attendance-no-record">No assignments yet.</p>}

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
      </div>

      {viewing && <AssignmentViewPopup assignment={viewing} onClose={() => setViewing(null)} />}

      {submitPopup && (
        <AssignmentSubmitPopup
          assignment={submitPopup.assignment}
          mode={submitPopup.mode}
          onClose={() => setSubmitPopup(null)}
          onDone={() => { setSubmitPopup(null); load() }}
        />
      )}
    </div>
  )
}

export default Assignments
