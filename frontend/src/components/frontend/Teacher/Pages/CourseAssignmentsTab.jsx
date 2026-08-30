import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEye, faTrashCan, faChevronLeft, faChevronRight, faLock, faLockOpen, faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import NewAssignmentPopup from '../Popups/NewAssignmentPopup.jsx'
import ViewSubmissionsPopup from '../Popups/ViewSubmissionsPopup.jsx'
import RowMenu from '../../shared/RowMenu.jsx'
import { formatDate, formatTime } from '../../Media/dateUtils.js'
import { api } from '../../../../api/client.js'
import { useAlert } from '../../../../context/AlertContext.jsx'

function CourseAssignmentsTab({ slot }) {
  const { confirmAction, success } = useAlert()
  const [assignments, setAssignments] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api.get(`/assignments/slot/${slot._id}?page=${page}`)
      .then((res) => { setAssignments(res.assignments); setPages(res.pages); setTotal(res.total) })
      .catch((err) => setError(err.message || 'Could not load assignments.'))
  }, [slot._id, page])

  useEffect(() => { load() }, [load])

  const handleDelete = async (assignment) => {
    const ok = await confirmAction({
      title: 'Delete this assignment?',
      message: `Delete "${assignment.title}"? Students will no longer see it.`,
      confirmText: 'Yes, delete it',
    })
    if (!ok) return
    try {
      await api.delete(`/assignments/${assignment._id}`)
      success(`"${assignment.title}" has been deleted.`, 'Assignment Deleted')
      load()
    } catch (err) {
      setError(err.message || 'Could not delete assignment.')
    }
  }

  const toggleClose = async (assignment) => {
    try {
      await api.put(`/assignments/${assignment._id}/close`)
      load()
    } catch (err) {
      setError(err.message || 'Could not update assignment.')
    }
  }

  return (
    <div className="course-tab-box">
      <div className="course-tab-header-row">
        <h4 className="course-tab-heading">Assignments ({total})</h4>
        <button type="button" className="course-tab-new-btn" onClick={() => setShowNew(true)}>
          <FontAwesomeIcon icon={faPlus} /> New Assignment
        </button>
      </div>

      {error && <div className="auth-error-banner">{error}</div>}

      <div className="teacher-assignment-list-head">
        <span>Assignment</span>
        <span>Description</span>
        <span>Type</span>
        <span>Due Date</span>
        <span>View</span>
        <span>Action</span>
      </div>

      {assignments.map((a) => (
        <div key={a._id} className="teacher-assignment-list-row">
          <span className="assignment-row-name">{a.title}</span>
          <span className="assignment-row-course">{a.description}</span>
          <span>{a.type}</span>
          <span>{formatDate(new Date(a.dueDate))}{a.dueTime ? ` at ${formatTime(a.dueTime)}` : ''}</span>
          <span>
            <FontAwesomeIcon icon={faEye} className="assignment-action-icon" onClick={() => setViewing(a)} title="View Submissions" />
          </span>
          <span>
            <RowMenu items={[
              { label: 'Edit', icon: faPenToSquare, onClick: () => setEditing(a) },
              {
                label: a.submissionClosed ? 'Reopen Submissions' : 'Close Submissions',
                icon: a.submissionClosed ? faLockOpen : faLock,
                onClick: () => toggleClose(a),
              },
              { label: 'Delete', icon: faTrashCan, danger: true, onClick: () => handleDelete(a) },
            ]} />
          </span>
        </div>
      ))}

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

      <NewAssignmentPopup show={showNew} slotId={slot._id} onClose={() => setShowNew(false)} onCreated={load} />
      {editing && (
        <NewAssignmentPopup
          show
          slotId={slot._id}
          initial={editing}
          onClose={() => setEditing(null)}
          onCreated={() => { load(); success(`"${editing.title}" has been updated.`, 'Assignment Updated') }}
        />
      )}

      {viewing && <ViewSubmissionsPopup assignment={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

export default CourseAssignmentsTab
