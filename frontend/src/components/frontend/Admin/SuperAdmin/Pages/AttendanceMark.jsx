import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBarcode, faMagnifyingGlass, faCircleCheck, faTriangleExclamation, faClipboardList, faCalendarDay,
} from '@fortawesome/free-solid-svg-icons'
import SuperAdminTopbar from '../Layout/SuperAdminTopbar.jsx'
import Avatar from '../../../Media/Avatar.jsx'
import { api } from '../../../../../api/client.js'

function AttendanceMark() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [rollInput, setRollInput] = useState('')
  const [found, setFound] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [justMarked, setJustMarked] = useState(false)
  const [recent, setRecent] = useState([])
  const [error, setError] = useState('')

  const loadRecent = () => {
    api.get('/attendance/recent').then(setRecent).catch(() => {})
  }

  useEffect(() => { loadRecent() }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    setJustMarked(false)
    setError('')
    try {
      const student = await api.get(`/students/by-roll/${rollInput.trim()}`)
      setFound(student)
      setNotFound(false)
    } catch {
      setFound(null)
      setNotFound(true)
    }
  }

  const handleMark = async () => {
    if (!found) return
    setError('')
    try {
      await api.post('/attendance/mark', { studentId: found._id, date, status: 'Present' })
      setJustMarked(true)
      loadRecent()
    } catch (err) {
      setError(err.message || 'Could not mark attendance.')
    }
  }

  return (
    <div className="superadmin-page">
      <SuperAdminTopbar breadcrumb={['Home', 'Attendance', 'Mark Attendance']} />

      <div className="attendance-mark-date-row">
        <label className="auth-input-label" htmlFor="mark-date"><FontAwesomeIcon icon={faCalendarDay} /> Date</label>
        <input id="mark-date" type="date" className="attendance-mark-date-input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <form className="attendance-mark-search-box" onSubmit={handleSearch}>
        <FontAwesomeIcon icon={faBarcode} className="attendance-mark-scan-icon" />
        <input
          type="text"
          className="auth-input attendance-mark-input"
          placeholder="Type or scan roll number..."
          value={rollInput}
          onChange={(e) => setRollInput(e.target.value)}
        />
        <button type="submit" className="auth-btn-primary attendance-mark-search-btn">
          <FontAwesomeIcon icon={faMagnifyingGlass} /> Find
        </button>
      </form>

      {error && <div className="auth-error-banner">{error}</div>}
      {notFound && <p className="attendance-mark-not-found">No student found with that roll number.</p>}

      {found && (
        <div className="attendance-mark-preview-box">
          <Avatar name={found.name} photoUrl={found.photo} className="attendance-mark-avatar" />
          <div className="attendance-mark-preview-details">
            <h4 className="attendance-mark-preview-name">{found.name}</h4>
            <p className="attendance-mark-preview-line">Roll: {found.roll} &nbsp;|&nbsp; {found.course?.name} ({found.slot?.batchLabel})</p>
            <p className="attendance-mark-preview-line">Campus: {found.campus?.name}</p>
            {found.paymentStatus !== 'Paid' && (
              <p className="attendance-mark-payment-warning">
                <FontAwesomeIcon icon={faTriangleExclamation} /> This student hasn't paid yet — marking attendance is still allowed.
              </p>
            )}
            {found.status === 'dropout' && (
              <p className="attendance-mark-payment-warning">
                <FontAwesomeIcon icon={faTriangleExclamation} /> This student has dropped out — attendance can't be marked.
              </p>
            )}
          </div>

          {justMarked ? (
            <span className="attendance-mark-marked-badge">
              <FontAwesomeIcon icon={faCircleCheck} /> Attendance Marked
            </span>
          ) : (
            <button
              type="button"
              className="auth-btn-primary attendance-mark-btn"
              onClick={handleMark}
              disabled={found.status === 'dropout'}
              style={found.status === 'dropout' ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              <FontAwesomeIcon icon={faCircleCheck} /> Mark Present
            </button>
          )}
        </div>
      )}

      <h4 className="student-form-section-heading">
        <FontAwesomeIcon icon={faClipboardList} /> Recently Marked
      </h4>
      <div className="course-tab-box">
        {recent.length === 0 && <p className="attendance-no-record">No attendance marked yet.</p>}
        {recent.map((r) => (
          <div key={r._id} className="student-detail-row">
            <span>{r.student?.name} ({r.student?.roll})</span>
            <span className={`attendance-status-chip attendance-status-${r.status.toLowerCase()}`}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AttendanceMark
