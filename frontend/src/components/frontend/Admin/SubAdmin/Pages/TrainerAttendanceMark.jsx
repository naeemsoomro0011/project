import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faIdBadge, faMagnifyingGlass, faRightToBracket, faRightFromBracket, faClock } from '@fortawesome/free-solid-svg-icons'
import SubAdminTopbar from '../Layout/SubAdminTopbar.jsx'
import Avatar from '../../../Media/Avatar.jsx'
import { api } from '../../../../../api/client.js'

function TrainerAttendanceMark() {
  const [idInput, setIdInput] = useState('')
  const [found, setFound] = useState(null) // { teacher, slots }
  const [selectedSlot, setSelectedSlot] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [log, setLog] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/teacher-attendance/today').then(setLog).catch(() => {})
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    setFound(null)
    setNotFound(false)

    const query = idInput.trim()
    if (!query) {
      setError('Please enter an Employee ID or trainer number.')
      return
    }

    try {
      const res = await api.get(`/teacher-attendance/lookup/${encodeURIComponent(query)}`)
      setFound(res)
      setSelectedSlot(res.slots[0]?._id || '')
      setNotFound(false)
    } catch {
      setFound(null)
      setNotFound(true)
    }
  }

  const refreshLog = () => api.get('/teacher-attendance/today').then(setLog).catch(() => {})

  const handleCheckIn = async () => {
    if (!found || !selectedSlot) return
    setError('')
    try {
      await api.post('/teacher-attendance/checkin', { teacherId: found.teacher._id, slotId: selectedSlot })
      refreshLog()
    } catch (err) {
      setError(err.message || 'Could not check in.')
    }
  }

  const handleCheckOut = async () => {
    if (!found || !selectedSlot) return
    setError('')
    try {
      await api.post('/teacher-attendance/checkout', { teacherId: found.teacher._id, slotId: selectedSlot })
      refreshLog()
    } catch (err) {
      setError(err.message || 'Could not check out.')
    }
  }

  return (
    <div className="subadmin-page">
      <SubAdminTopbar breadcrumb={['Home', 'Trainers', 'Attendance', 'Mark Attendance']} />

      <form className="attendance-mark-search-box" onSubmit={handleSearch}>
        <FontAwesomeIcon icon={faIdBadge} className="attendance-mark-scan-icon" />
        <input
          type="text"
          className="auth-input attendance-mark-input"
          placeholder="Scan or type Employee ID..."
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
        />
        <button type="submit" className="auth-btn-primary attendance-mark-search-btn">
          <FontAwesomeIcon icon={faMagnifyingGlass} /> Find
        </button>
      </form>

      {error && <div className="auth-error-banner">{error}</div>}
      {notFound && <p className="attendance-mark-not-found">No trainer found with that Employee ID.</p>}

      {found && (
        <div className="attendance-mark-preview-box">
          <Avatar name={found.teacher.name} photoUrl={found.teacher.photo} className="attendance-mark-avatar" />
          <div className="attendance-mark-preview-details">
            <h4 className="attendance-mark-preview-name">{found.teacher.name}</h4>
            <p className="attendance-mark-preview-line">Employee ID: {found.teacher.employeeId}</p>

            {found.slots.length > 1 && (
              <select className="auth-input" style={{ maxWidth: 260, marginTop: 6 }} value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)}>
                {found.slots.map((s) => <option key={s._id} value={s._id}>{s.course?.name} ({s.batchLabel})</option>)}
              </select>
            )}
          </div>
          <div className="trainer-checkin-btn-row">
            <button type="button" className="auth-btn-primary trainer-checkin-btn" onClick={handleCheckIn}>
              <FontAwesomeIcon icon={faRightToBracket} /> Check In
            </button>
            <button type="button" className="auth-btn-secondary trainer-checkout-btn" onClick={handleCheckOut}>
              <FontAwesomeIcon icon={faRightFromBracket} /> Check Out
            </button>
          </div>
        </div>
      )}

      <h4 className="student-form-section-heading">
        <FontAwesomeIcon icon={faClock} /> Today's Log
      </h4>
      <div className="course-tab-box">
        {log.length === 0 && <p className="attendance-no-record">No check-in/check-out recorded yet today.</p>}
        {log.map((l) => (
          <div key={l._id} className="student-detail-row">
            <span>{l.teacher?.name}</span>
            <span>
              {l.checkIn ? `In: ${new Date(l.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '-'}
              {l.checkOut ? ` | Out: ${new Date(l.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TrainerAttendanceMark
