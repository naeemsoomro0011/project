import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark, faClipboardCheck } from '@fortawesome/free-solid-svg-icons'
import SubAdminTopbar from '../Layout/SubAdminTopbar.jsx'
import { api } from '../../../../../api/client.js'

function statusClass(status) {
  if (status === 'Approved') return 'student-status-good'
  if (status === 'Rejected') return 'student-status-bad'
  return 'student-status-pending'
}

function TrainerAttendanceRequests() {
  const [requests, setRequests] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api.get('/teacher-attendance/requests').then(setRequests).catch((err) => setError(err.message || 'Could not load requests.'))
  }, [])

  useEffect(() => { load() }, [load])

  const setStatus = async (id, status) => {
    setError('')
    try {
      await api.put(`/teacher-attendance/requests/${id}`, { status })
      load()
    } catch (err) {
      setError(err.message || 'Could not update request.')
    }
  }

  return (
    <div className="subadmin-page">
      <SubAdminTopbar breadcrumb={['Home', 'Trainers', 'Attendance', 'Requests']} />

      <h4 className="course-tab-heading" style={{ marginBottom: 14 }}>
        <FontAwesomeIcon icon={faClipboardCheck} /> Attendance Correction Requests
      </h4>

      {error && <div className="auth-error-banner">{error}</div>}

      <div className="course-tab-box">
        {requests.map((r) => (
          <div key={r._id} className="trainer-request-row">
            <div className="trainer-request-info">
              <p className="trainer-request-name">{r.teacher?.name} <span className="trainer-request-date">— {new Date(r.date).toLocaleDateString()}</span></p>
              <p className="trainer-request-reason">{r.reason}</p>
            </div>
            <span className={`student-status-chip ${statusClass(r.status)}`}>{r.status}</span>
            {r.status === 'Pending' && (
              <div className="trainer-request-actions">
                <button type="button" className="trainer-request-approve-btn" onClick={() => setStatus(r._id, 'Approved')}>
                  <FontAwesomeIcon icon={faCheck} /> Approve
                </button>
                <button type="button" className="trainer-request-reject-btn" onClick={() => setStatus(r._id, 'Rejected')}>
                  <FontAwesomeIcon icon={faXmark} /> Reject
                </button>
              </div>
            )}
          </div>
        ))}

        {requests.length === 0 && <p className="attendance-no-record">No attendance correction requests.</p>}
      </div>
    </div>
  )
}

export default TrainerAttendanceRequests
