import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark, faFileLines, faMagnifyingGlass, faCircleCheck, faCircleXmark, faClock,
} from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../api/client.js'

function ViewSubmissionsPopup({ assignment, onClose }) {
  const [submissions, setSubmissions] = useState([])
  const [counts, setCounts] = useState({ approved: 0, notApproved: 0, pending: 0, total: 0 })
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    api.get(`/assignments/${assignment._id}/submissions`)
      .then((res) => { setSubmissions(res.submissions); setCounts(res.counts) })
      .catch((err) => setError(err.message || 'Could not load submissions.'))
  }

  useEffect(() => { if (assignment) load() }, [assignment]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!assignment) return null

  const filtered = submissions.filter((s) => s.student?.name.toLowerCase().includes(search.toLowerCase()))
  const selected = submissions.find((s) => s.student?._id === selectedId) || filtered[0]

  const setStatus = async (submissionId, status) => {
    setError('')
    try {
      await api.put(`/assignments/submissions/${submissionId}/status`, { status })
      load()
    } catch (err) {
      setError(err.message || 'Could not update status.')
    }
  }

  const submittedCount = submissions.filter((s) => s.status !== 'Not Submitted' && s.submittedAt).length

  return (
    <div className="generic-popup-overlay">
      <div className="submissions-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faFileLines} /> Assignment Submissions — {assignment.title}
          </span>
          <button className="generic-popup-close" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="submissions-stat-row">
          <div className="submissions-stat-box">
            <FontAwesomeIcon icon={faFileLines} className="assignment-stat-icon" />
            <span className="assignment-stat-value">{submittedCount}</span>
            <span className="assignment-stat-label">Submitted</span>
          </div>
          <div className="submissions-stat-box">
            <FontAwesomeIcon icon={faCircleCheck} className="assignment-stat-icon" />
            <span className="assignment-stat-value">{counts.approved}</span>
            <span className="assignment-stat-label">Approved</span>
          </div>
          <div className="submissions-stat-box">
            <FontAwesomeIcon icon={faCircleXmark} className="assignment-stat-icon" />
            <span className="assignment-stat-value">{counts.notApproved}</span>
            <span className="assignment-stat-label">Not Approved</span>
          </div>
        </div>

        <div className="submissions-body">
          <div className="submissions-list-col">
            <div className="course-landing-search-wrap submissions-search">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="course-landing-search-icon" />
              <input
                type="text"
                className="course-landing-search-input"
                placeholder="Search student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {filtered.map((s) => (
              <button
                key={s._id}
                type="button"
                className={`submissions-student-item ${selected?._id === s._id ? 'submissions-student-item-active' : ''}`}
                onClick={() => setSelectedId(s.student?._id)}
              >
                <span>{s.student?.name}</span>
                <span className={`assignment-status-chip assignment-status-${(s.isLate ? 'Late' : s.status).replace(/\s+/g, '-').toLowerCase()}`}>
                  {s.isLate && s.status === 'Pending' ? 'Late' : s.status}
                </span>
              </button>
            ))}
            {filtered.length === 0 && <p className="attendance-no-record">No students found.</p>}
          </div>

          <div className="submissions-detail-col">
            {selected && (
              <>
                <h4 className="submissions-detail-name">{selected.student?.name}</h4>
                <p className="assignment-view-label">Status</p>
                <p className={`assignment-status-chip assignment-status-${(selected.isLate && selected.status === 'Pending' ? 'Late' : selected.status).replace(/\s+/g, '-').toLowerCase()}`}>
                  {selected.isLate && selected.status === 'Pending' ? 'Late' : selected.status}
                </p>

                {selected.status !== 'Not Submitted' && selected.submittedAt ? (
                  <>
                    {selected.link && (
                      <>
                        <p className="assignment-view-label">Submission Link</p>
                        <div className="assignment-view-link-box">{selected.link}</div>
                      </>
                    )}
                    <p className="assignment-view-label">Notes</p>
                    <div className="assignment-view-notes-box">{selected.notes || 'No notes added.'}</div>
                    <p className="subadmin-role-hint">
                      Submitted {new Date(selected.submittedAt).toLocaleString()}{selected.isEdited ? ' (edited after first submission)' : ''}
                    </p>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        className="submissions-approve-btn"
                        disabled={selected.status === 'Approved'}
                        onClick={() => setStatus(selected._id, 'Approved')}
                      >
                        <FontAwesomeIcon icon={faCircleCheck} /> {selected.status === 'Approved' ? 'Approved' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="submissions-approve-btn slot-toggle-btn-danger"
                        disabled={selected.status === 'Not Approved'}
                        onClick={() => setStatus(selected._id, 'Not Approved')}
                      >
                        <FontAwesomeIcon icon={faCircleXmark} /> {selected.status === 'Not Approved' ? 'Not Approved' : 'Disapprove'}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="submissions-empty-note">
                    <FontAwesomeIcon icon={faClock} /> This student hasn't submitted this assignment yet.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewSubmissionsPopup
