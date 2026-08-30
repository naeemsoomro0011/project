import { useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faUserCheck, faUserClock, faUserXmark, faListCheck, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import SuperAdminTopbar from '../Layout/SuperAdminTopbar.jsx'
import Avatar from '../../../Media/Avatar.jsx'
import { api } from '../../../../../api/client.js'

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildGrid(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function statusClass(status) {
  if (status === 'Present') return 'calendar-day-present'
  if (status === 'Leave') return 'calendar-day-leave'
  return 'calendar-day-absent'
}
function monthLabel(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

function AttendanceView() {
  const [rollInput, setRollInput] = useState('')
  const [attendance, setAttendance] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [monthKey, setMonthKey] = useState('')
  const [monthOpen, setMonthOpen] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    try {
      const res = await api.get(`/attendance/view/${rollInput.trim()}`)
      setAttendance(res)
      setNotFound(false)
      if (res.days.length) setMonthKey(res.days[res.days.length - 1].date.slice(0, 7))
    } catch {
      setAttendance(null)
      setNotFound(true)
    }
  }

  const monthKeys = useMemo(() => (attendance ? [...new Set(attendance.days.map((d) => d.date.slice(0, 7)))] : []), [attendance])
  const [y, m] = monthKey ? monthKey.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1]
  const cells = buildGrid(y, m - 1)
  const dayStatusMap = attendance ? Object.fromEntries(attendance.days.filter((d) => d.date.startsWith(monthKey)).map((d) => [Number(d.date.slice(8, 10)), d.status])) : {}

  return (
    <div className="superadmin-page">
      <SuperAdminTopbar breadcrumb={['Home', 'Attendance', 'View Attendance']} />

      <form className="attendance-mark-search-box" onSubmit={handleSearch}>
        <input
          type="text"
          className="auth-input attendance-mark-input"
          placeholder="Search by roll number..."
          value={rollInput}
          onChange={(e) => setRollInput(e.target.value)}
        />
        <button type="submit" className="auth-btn-primary attendance-mark-search-btn">
          <FontAwesomeIcon icon={faMagnifyingGlass} /> Search
        </button>
      </form>

      {notFound && <p className="attendance-mark-not-found">No student found with that roll number.</p>}

      {attendance && (
        <>
          <div className="attendance-mark-preview-box">
            <Avatar name={attendance.student.name} photoUrl={attendance.student.photo} className="attendance-mark-avatar" />
            <div className="attendance-mark-preview-details">
              <h4 className="attendance-mark-preview-name">{attendance.student.name}</h4>
              <p className="attendance-mark-preview-line">Roll: {attendance.student.roll} &nbsp;|&nbsp; {attendance.student.course}</p>
            </div>
          </div>

          <div className="attendance-stat-row">
            <div className="attendance-stat-box">
              <FontAwesomeIcon icon={faListCheck} className="attendance-stat-icon" />
              <span className="attendance-stat-value">{attendance.percentage}%</span>
              <span className="attendance-stat-label">Attendance</span>
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

          <div className="calendar-box">
            <div className="calendar-header-row">
              <h4 className="subadmin-chart-title" style={{ margin: 0 }}>Calendar</h4>
              <div className="attendance-month-picker">
                <button type="button" className="attendance-month-btn" onClick={() => setMonthOpen(!monthOpen)}>
                  {monthKey ? monthLabel(monthKey) : 'Select month'} <FontAwesomeIcon icon={faChevronDown} />
                </button>
                {monthOpen && (
                  <div className="attendance-month-menu">
                    {monthKeys.map((key) => (
                      <button key={key} type="button" className="attendance-month-item" onClick={() => { setMonthKey(key); setMonthOpen(false) }}>
                        {monthLabel(key)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="calendar-weekday-row">
              {weekdayLabels.map((w) => <span key={w} className="calendar-weekday-label">{w}</span>)}
            </div>
            <div className="calendar-grid">
              {cells.map((day, idx) => {
                const status = day ? dayStatusMap[day] : null
                return (
                  <div key={idx} className={`calendar-cell ${day === null ? 'calendar-cell-empty' : ''} ${status ? statusClass(status) : ''}`}>
                    {day && <span className="calendar-cell-day">{day}</span>}
                    {status && <span className="calendar-day-status-label">{status}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AttendanceView
