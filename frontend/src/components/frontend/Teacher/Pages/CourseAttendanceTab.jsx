import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserGroup, faUserCheck, faUserClock, faUserXmark } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../api/client.js'

function statusClass(status) {
  if (status === 'Present') return 'attendance-status-present'
  if (status === 'Leave') return 'attendance-status-leave'
  return 'attendance-status-absent'
}

function CourseAttendanceTab({ slot }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [records, setRecords] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/attendance/slot/${slot._id}?date=${selectedDate}`).then(setRecords).catch((err) => setError(err.message || 'Could not load attendance.'))
  }, [slot._id, selectedDate])

  const total = records.length
  const present = records.filter((r) => r.status === 'Present').length
  const leave = records.filter((r) => r.status === 'Leave').length
  const absent = records.filter((r) => r.status === 'Absent').length

  return (
    <div className="course-tab-box">
      <div className="course-attendance-date-row">
        <label className="auth-input-label" htmlFor="attendance-date">Select Date</label>
        <input
          id="attendance-date"
          type="date"
          className="course-attendance-date-input"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {error && <div className="auth-error-banner">{error}</div>}

      <div className="attendance-stat-row">
        <div className="attendance-stat-box">
          <FontAwesomeIcon icon={faUserGroup} className="attendance-stat-icon" />
          <span className="attendance-stat-value">{total}</span>
          <span className="attendance-stat-label">Total Students</span>
        </div>
        <div className="attendance-stat-box">
          <FontAwesomeIcon icon={faUserCheck} className="attendance-stat-icon" />
          <span className="attendance-stat-value">{present}</span>
          <span className="attendance-stat-label">Present</span>
        </div>
        <div className="attendance-stat-box">
          <FontAwesomeIcon icon={faUserClock} className="attendance-stat-icon" />
          <span className="attendance-stat-value">{leave}</span>
          <span className="attendance-stat-label">Leave</span>
        </div>
        <div className="attendance-stat-box">
          <FontAwesomeIcon icon={faUserXmark} className="attendance-stat-icon" />
          <span className="attendance-stat-value">{absent}</span>
          <span className="attendance-stat-label">Absent</span>
        </div>
      </div>

      <div className="student-row-head course-attendance-row-head">
        <span>Name</span>
        <span>Roll No</span>
        <span>Status</span>
      </div>

      {records.map((r) => (
        <div key={r._id} className="student-row course-attendance-row">
          <span className="student-row-name">{r.name}</span>
          <span>{r.roll}</span>
          <span className={`attendance-status-chip ${statusClass(r.status)}`}>{r.status}</span>
        </div>
      ))}

      {records.length === 0 && !error && <p className="attendance-no-record">No students in this batch.</p>}

      <p className="subadmin-role-hint" style={{ marginTop: 10 }}>
        Attendance is marked by your Sub Admin — this view is read-only.
      </p>
    </div>
  )
}

export default CourseAttendanceTab
