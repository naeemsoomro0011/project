import { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faListCheck, faUserCheck, faUserClock, faUserXmark,
  faChevronDown, faClipboardList,
} from '@fortawesome/free-solid-svg-icons'
import StudentTopbar from '../Layout/StudentTopbar.jsx'
import { api } from '../../../../api/client.js'

function statusClass(status) {
  if (status === 'Present') return 'attendance-status-present'
  if (status === 'Leave') return 'attendance-status-leave'
  return 'attendance-status-absent'
}

// `r.date` is a plain "YYYY-MM-DD" calendar day, not a moment in time.
// Parsing it with `new Date(str)` treats it as UTC and then converting to a
// display string re-interprets it in the browser's local timezone, which
// can silently roll the shown date back or forward a day depending where
// the person is. Building the Date from the parsed Y/M/D as *local* values
// sidesteps that entirely - what was marked is exactly what's shown.
function formatDayLabel(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number)
  return new Date(y, m - 1, d).toDateString()
}

function AttendanceDetail() {
  const { openFeedback } = useOutletContext()
  const [attendance, setAttendance] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [monthMenuOpen, setMonthMenuOpen] = useState(false)

  useEffect(() => {
    api.get('/attendance/me').then((res) => {
      setAttendance(res)
      if (res.days.length) setSelectedMonth(res.days[res.days.length - 1].date.slice(0, 7))
    }).catch(() => {})
  }, [])

  const monthKeys = useMemo(() => {
    if (!attendance) return []
    return [...new Set(attendance.days.map((d) => d.date.slice(0, 7)))]
  }, [attendance])

  const monthLabel = (key) => {
    const [y, m] = key.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
  }

  const recordsForMonth = attendance ? attendance.days.filter((d) => d.date.startsWith(selectedMonth)) : []

  if (!attendance) {
    return (
      <div className="student-page">
        <StudentTopbar breadcrumb={['Home', 'Attendance']} onFeedbackClick={openFeedback} />
        <p className="subadmin-chart-title">Loading...</p>
      </div>
    )
  }

  const fillClass = attendance.remark.level === 'outstanding' ? 'attendance-overview-fill-outstanding'
    : attendance.remark.level === 'good' ? 'attendance-overview-fill-good'
    : 'attendance-overview-fill-bad'
  const messageClass = attendance.remark.level === 'outstanding' ? 'attendance-overview-message-outstanding'
    : attendance.remark.level === 'good' ? 'attendance-overview-message-good'
    : 'attendance-overview-message-bad'

  return (
    <div className="student-page">
      <StudentTopbar breadcrumb={['Home', 'Attendance']} onFeedbackClick={openFeedback} />

      <div className="attendance-stat-row">
        <div className="attendance-stat-box">
          <FontAwesomeIcon icon={faListCheck} className="attendance-stat-icon" />
          <span className="attendance-stat-value">{attendance.totalClasses}</span>
          <span className="attendance-stat-label">Total Classes</span>
        </div>
        <div className="attendance-stat-box">
          <FontAwesomeIcon icon={faUserCheck} className="attendance-stat-icon" />
          <span className="attendance-stat-value">{attendance.present}</span>
          <span className="attendance-stat-label">Present</span>
        </div>
        <div className="attendance-stat-box">
          <FontAwesomeIcon icon={faUserClock} className="attendance-stat-icon" />
          <span className="attendance-stat-value">{attendance.leave}</span>
          <span className="attendance-stat-label">Leave</span>
        </div>
        <div className="attendance-stat-box">
          <FontAwesomeIcon icon={faUserXmark} className="attendance-stat-icon" />
          <span className="attendance-stat-value">{attendance.absent}</span>
          <span className="attendance-stat-label">Absent</span>
        </div>
      </div>

      <div className="attendance-overview-box">
        <h4 className="attendance-overview-heading">Attendance Overview ({attendance.percentage}%)</h4>
        <div className="attendance-overview-track">
          <div className={`attendance-overview-fill ${fillClass}`} style={{ width: `${attendance.percentage}%` }}></div>
        </div>
        <p className={`attendance-overview-message ${messageClass}`}>{attendance.remark.text}</p>
      </div>

      <div className="attendance-detail-box">
        <div className="attendance-detail-header">
          <span className="attendance-detail-heading">
            <FontAwesomeIcon icon={faClipboardList} /> Attendance Details
          </span>

          <div className="attendance-month-picker">
            <button type="button" className="attendance-month-btn" onClick={() => setMonthMenuOpen(!monthMenuOpen)}>
              {selectedMonth ? monthLabel(selectedMonth) : 'Select month'} <FontAwesomeIcon icon={faChevronDown} />
            </button>
            {monthMenuOpen && (
              <div className="attendance-month-menu">
                {monthKeys.map((key) => (
                  <button key={key} type="button" className="attendance-month-item" onClick={() => { setSelectedMonth(key); setMonthMenuOpen(false) }}>
                    {monthLabel(key)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="attendance-table-head">
          <span>Date</span>
          <span>Status</span>
        </div>

        {recordsForMonth.length === 0 && (
          <p className="attendance-no-record">No attendance record found for this month.</p>
        )}

        {recordsForMonth.map((r) => (
          <div key={r.date} className="attendance-table-row">
            <span className="attendance-date-label">{formatDayLabel(r.date)}</span>
            <span className={`attendance-status-chip ${statusClass(r.status)}`}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AttendanceDetail
