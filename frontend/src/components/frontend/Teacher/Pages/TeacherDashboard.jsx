import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChalkboardUser, faUserGroup, faFileLines, faCalendarDay,
  faIdBadge, faSchool, faCalendarDays, faUsers,
} from '@fortawesome/free-solid-svg-icons'
import TeacherTopbar from '../Layout/TeacherTopbar.jsx'
import { getCurrentWeekDates, dayName } from '../../Media/dateUtils.js'
import { api } from '../../../../api/client.js'

const colorThemes = ['blue', 'purple', 'green', 'orange', 'teal']

function TeacherDashboard() {
  const navigate = useNavigate()
  const weekDates = getCurrentWeekDates()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/dashboard/teacher').then(setData).catch((err) => setError(err.message || 'Could not load dashboard.'))
  }, [])

  if (error) return <div className="teacher-page"><TeacherTopbar breadcrumb={['Home', 'Dashboard']} /><div className="auth-error-banner">{error}</div></div>
  if (!data) return <div className="teacher-page"><TeacherTopbar breadcrumb={['Home', 'Dashboard']} /><p className="subadmin-chart-title">Loading...</p></div>

  // Union of every day-of-week the teacher has any class on, across all their slots.
  const activeWeekdays = new Set(data.slots.flatMap((s) => s.scheduleDays))

  return (
    <div className="teacher-page">
      <TeacherTopbar breadcrumb={['Home', 'Dashboard']} />

      <div className="teacher-stat-row">
        <div className="teacher-stat-card">
          <FontAwesomeIcon icon={faChalkboardUser} className="teacher-stat-icon" />
          <span className="teacher-stat-value">{data.activeCourses}</span>
          <span className="teacher-stat-label">Active Course</span>
        </div>
        <div className="teacher-stat-card">
          <FontAwesomeIcon icon={faUserGroup} className="teacher-stat-icon" />
          <span className="teacher-stat-value">{data.enrolledStudents}</span>
          <span className="teacher-stat-label">Enrolled Students</span>
        </div>
        <div className="teacher-stat-card">
          <FontAwesomeIcon icon={faFileLines} className="teacher-stat-icon" />
          <span className="teacher-stat-value">{data.totalAssignments}</span>
          <span className="teacher-stat-label">Total Assignments</span>
        </div>

        <div className="teacher-schedule-card">
          <span className="teacher-schedule-heading">
            <FontAwesomeIcon icon={faCalendarDay} /> Class Schedule
          </span>
          <div className="teacher-schedule-days">
            {weekDates.map((d) => {
              const dname = dayName(d)
              const isClassDay = activeWeekdays.has(d.getDay())
              return (
                <div key={d.toISOString()} className={`teacher-day-box ${isClassDay ? 'teacher-day-box-active' : ''}`}>
                  <span className="teacher-day-name">{dname}</span>
                  <span className="teacher-day-date">{d.getDate()}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <h3 className="teacher-section-heading">Active Courses</h3>

      <div className="teacher-course-grid">
        {data.slots.map((slot, idx) => {
          const totalTopics = (slot.course?.syllabus || []).reduce((s, m) => s + m.topics.length, 0)
          const progressPercent = totalTopics ? Math.round(((slot.completedTopics?.length || 0) / totalTopics) * 100) : 0
          const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          return (
            <button
              key={slot._id}
              type="button"
              className={`teacher-course-card teacher-course-card-${colorThemes[idx % colorThemes.length]}`}
              onClick={() => navigate(`/teacher/course/${slot._id}`)}
            >
              <h4 className="teacher-course-title">{slot.course?.name}</h4>
              <div className="teacher-course-meta-row">
                <span className="teacher-course-lab">
                  <FontAwesomeIcon icon={faUsers} /> {slot.classType}
                </span>
                <span className="teacher-course-batch-badge">{slot.batchLabel}</span>
              </div>
              <p className="teacher-course-campus">
                <FontAwesomeIcon icon={faSchool} /> {slot.campus?.name}
              </p>

              <div className="teacher-course-progress-row">
                <span>Progress</span>
                <span>{progressPercent}% Complete</span>
              </div>
              <div className="teacher-course-progress-track">
                <div className="teacher-course-progress-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>

              <p className="teacher-course-enrolled">
                <FontAwesomeIcon icon={faIdBadge} /> Enrolled: {slot.seatsUsed || 0} Students
              </p>
              <p className="teacher-course-schedule">
                <FontAwesomeIcon icon={faCalendarDays} /> {slot.scheduleDays.map((d) => WEEKDAY_LABELS[d]).join('/')} {slot.startTime}-{slot.endTime}
              </p>
              <p className="teacher-course-start">Start: {new Date(slot.startDate).toDateString()}</p>
            </button>
          )
        })}

        {data.slots.length === 0 && <p className="attendance-no-record">No courses assigned to you yet.</p>}
      </div>
    </div>
  )
}

export default TeacherDashboard
