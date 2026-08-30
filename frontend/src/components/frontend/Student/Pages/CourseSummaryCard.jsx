import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGraduationCap, faIdBadge, faSchool, faCity, faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function CourseSummaryCard({ student, showSchedule = false, onViewDetail }) {
  if (!student) return null

  const totalTopics = (student.course?.syllabus || []).reduce((s, m) => s + m.topics.length, 0)
  const completed = student.slot?.completedTopics?.length || 0
  const percent = totalTopics ? Math.round((completed / totalTopics) * 100) : 0

  return (
    <div className="course-card">
      <div className="course-card-header">
        <h3 className="course-card-heading">
          <FontAwesomeIcon icon={faGraduationCap} /> {student.course?.name}
        </h3>
        <span className="course-card-enrolled-badge">{student.status}</span>
      </div>

      {showSchedule && student.slot && (
        <div className="course-card-schedule-row">
          {student.slot.scheduleDays.map((d) => (
            <div key={d} className="course-card-schedule-box">
              <span className="course-card-schedule-day">{WEEKDAY_LABELS[d]}</span>
              <span className="course-card-schedule-time">{student.slot.startTime}-{student.slot.endTime}</span>
            </div>
          ))}
        </div>
      )}

      <div className="course-card-progress-row">
        <span className="course-card-progress-label">Progress</span>
        <span className="course-card-progress-percent">{percent}%</span>
      </div>
      <div className="course-card-progress-track">
        <div className="course-card-progress-fill" style={{ width: `${percent}%` }}></div>
      </div>

      <div className="course-card-meta-row">
        <span className="course-card-meta-item">
          <FontAwesomeIcon icon={faIdBadge} /> Batch: {student.slot?.batchLabel}
        </span>
        <span className="course-card-meta-item">
          <FontAwesomeIcon icon={faIdBadge} /> Roll: {student.roll}
        </span>
      </div>
      <div className="course-card-meta-row">
        <span className="course-card-meta-item">
          <FontAwesomeIcon icon={faSchool} /> Campus: {student.campus?.name}
        </span>
        <span className="course-card-meta-item">
          <FontAwesomeIcon icon={faCity} /> City: {student.city}
        </span>
      </div>

      {onViewDetail && (
        <button type="button" className="course-card-view-detail-btn" onClick={onViewDetail}>
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} /> View Detail
        </button>
      )}
    </div>
  )
}

export default CourseSummaryCard
