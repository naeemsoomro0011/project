import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faClock, faHourglassHalf, faClockRotateLeft, faCircleInfo, faFlag } from '@fortawesome/free-solid-svg-icons'
import TeacherTopbar from '../Layout/TeacherTopbar.jsx'
import RequestCorrectionPopup from '../Popups/RequestCorrectionPopup.jsx'
import { api } from '../../../../api/client.js'
import { useAuth } from '../../../../context/useAuth.js'

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
}
function lastNMonths(n) {
  const months = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

function TeacherAttendance() {
  const { user } = useAuth()
  const [slots, setSlots] = useState([])
  const [courseOpen, setCourseOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [view, setView] = useState('This Slot')
  const [monthOpen, setMonthOpen] = useState(false)
  const [month, setMonth] = useState(currentMonthKey())
  const [summary, setSummary] = useState({ totalClasses: 0, totalTimeSpend: 0, totalLateTime: 0, records: [] })
  const [showRequest, setShowRequest] = useState(false)

  useEffect(() => {
    api.get('/dashboard/teacher').then((res) => {
      setSlots(res.slots)
      if (res.slots.length) setSelectedSlot(res.slots[0])
    }).catch(() => {})
  }, [])

  const loadSummary = useCallback(() => {
    if (view === 'This Slot') {
      if (!selectedSlot) return
      api.get(`/teacher-attendance/summary/${user._id}?slot=${selectedSlot._id}&month=${month}`).then(setSummary)
    } else {
      Promise.all(
        slots.map((s) => api.get(`/teacher-attendance/summary/${user._id}?slot=${s._id}&month=${month}`))
      ).then((results) => {
        setSummary({
          totalClasses: results.reduce((sum, r) => sum + r.totalClasses, 0),
          totalTimeSpend: results.reduce((sum, r) => sum + r.totalTimeSpend, 0),
          totalLateTime: results.reduce((sum, r) => sum + r.totalLateTime, 0),
          records: results.flatMap((r) => r.records),
        })
      })
    }
  }, [view, selectedSlot, slots, month, user])

  useEffect(() => { loadSummary() }, [loadSummary])

  return (
    <div className="teacher-page">
      <TeacherTopbar breadcrumb={['Home', 'Attendance']} />

      <div className="teacher-attendance-top-row">
        <h4 className="teacher-attendance-heading">Attendance</h4>

        <div className="attendance-month-picker">
          <button type="button" className="attendance-month-btn" onClick={() => setCourseOpen(!courseOpen)}>
            {selectedSlot ? `${selectedSlot.course?.name} (${selectedSlot.batchLabel})` : 'Select course'} <FontAwesomeIcon icon={faChevronDown} />
          </button>
          {courseOpen && (
            <div className="attendance-month-menu teacher-course-picker-menu">
              {slots.map((s) => (
                <button key={s._id} type="button" className="attendance-month-item" onClick={() => { setSelectedSlot(s); setCourseOpen(false) }}>
                  {s.course?.name} ({s.batchLabel})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="teacher-overall-stats-label">Overall Stats</p>

      <div className="teacher-attendance-controls-row">
        <div className="attendance-month-picker">
          <button type="button" className="attendance-month-btn" onClick={() => setMonthOpen(!monthOpen)}>
            {monthLabel(month)} <FontAwesomeIcon icon={faChevronDown} />
          </button>
          {monthOpen && (
            <div className="attendance-month-menu">
              {lastNMonths(6).map((key) => (
                <button key={key} type="button" className="attendance-month-item" onClick={() => { setMonth(key); setMonthOpen(false) }}>
                  {monthLabel(key)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="teacher-view-toggle-group">
          <button type="button" className={`teacher-view-toggle-btn ${view === 'Overall' ? 'teacher-view-toggle-btn-active' : ''}`} onClick={() => setView('Overall')}>
            Overall
          </button>
          <button type="button" className={`teacher-view-toggle-btn ${view === 'This Slot' ? 'teacher-view-toggle-btn-active' : ''}`} onClick={() => setView('This Slot')}>
            This Slot
          </button>
        </div>

        <button type="button" className="subadmin-toolbar-btn" onClick={() => setShowRequest(true)}>
          <FontAwesomeIcon icon={faFlag} /> Report an Issue
        </button>
      </div>

      <div className="attendance-stat-row">
        <div className="attendance-stat-box">
          <FontAwesomeIcon icon={faClock} className="attendance-stat-icon" />
          <span className="attendance-stat-value">{summary.totalClasses}</span>
          <span className="attendance-stat-label">Total Classes</span>
        </div>
        <div className="attendance-stat-box">
          <FontAwesomeIcon icon={faHourglassHalf} className="attendance-stat-icon" />
          <span className="attendance-stat-value">{summary.totalTimeSpend} min</span>
          <span className="attendance-stat-label">Total Time Spent</span>
        </div>
        <div className="attendance-stat-box">
          <FontAwesomeIcon icon={faClockRotateLeft} className="attendance-stat-icon" />
          <span className="attendance-stat-value">{summary.totalLateTime} min</span>
          <span className="attendance-stat-label">Total Late Time</span>
        </div>
      </div>

      <h5 className="teacher-attendance-records-heading">Attendance Records</h5>
      {view === 'This Slot' && selectedSlot && (
        <p className="teacher-attendance-course-label">Course: {selectedSlot.course?.name} ({selectedSlot.batchLabel})</p>
      )}

      {summary.records.length === 0 ? (
        <div className="teacher-no-record-box">
          <FontAwesomeIcon icon={faCircleInfo} className="teacher-no-record-icon" />
          <p>No Attendance Record Found</p>
        </div>
      ) : (
        <div className="course-tab-box">
          {summary.records.map((r) => (
            <div key={r._id} className="student-detail-row">
              <span>{new Date(r.date).toLocaleDateString()}</span>
              <span>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '-'} → {r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '-'}</span>
              <span className={r.lateMinutes > 0 ? 'assignment-status-chip assignment-status-late' : ''}>{r.lateMinutes > 0 ? `${r.lateMinutes} min late` : 'On time'}</span>
            </div>
          ))}
        </div>
      )}

      <RequestCorrectionPopup show={showRequest} onClose={() => setShowRequest(false)} />
    </div>
  )
}

export default TeacherAttendance
