import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDay } from '@fortawesome/free-solid-svg-icons'
import SubAdminTopbar from '../Layout/SubAdminTopbar.jsx'
import Avatar from '../../../Media/Avatar.jsx'
import { api } from '../../../../../api/client.js'

function TrainerAttendanceView() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/teacher-attendance/view?date=${date}`).then(setRows).catch((err) => setError(err.message || 'Could not load attendance.'))
  }, [date])

  return (
    <div className="subadmin-page">
      <SubAdminTopbar breadcrumb={['Home', 'Trainers', 'Attendance', 'View Attendance']} />

      <div className="course-attendance-date-row">
        <label className="auth-input-label" htmlFor="trainer-att-date">
          <FontAwesomeIcon icon={faCalendarDay} /> Select Date
        </label>
        <input
          id="trainer-att-date"
          type="date"
          className="course-attendance-date-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {error && <div className="auth-error-banner">{error}</div>}

      <div className="course-tab-box">
        <div className="student-row-head trainer-attendance-row-head">
          <span>Photo</span>
          <span>Trainer</span>
          <span>Check In</span>
          <span>Check Out</span>
          <span>Status</span>
        </div>
        {rows.map((r) => (
          <div key={r.slot.id} className="student-row trainer-attendance-row">
            <Avatar name={r.teacher?.name} photoUrl={r.teacher?.photo} className="student-row-photo" />
            <span className="student-row-name">{r.teacher?.name} <span className="subadmin-role-hint">({r.slot.course} — {r.slot.batchLabel})</span></span>
            <span>{r.attendance?.checkIn ? new Date(r.attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
            <span>{r.attendance?.checkOut ? new Date(r.attendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
            <span className={`attendance-status-chip ${r.attendance?.checkIn ? 'attendance-status-present' : 'attendance-status-absent'}`}>
              {r.attendance?.checkIn ? 'Present' : 'Absent'}
            </span>
          </div>
        ))}

        {rows.length === 0 && !error && <p className="attendance-no-record">No trainers scheduled for this date.</p>}
      </div>
    </div>
  )
}

export default TrainerAttendanceView
