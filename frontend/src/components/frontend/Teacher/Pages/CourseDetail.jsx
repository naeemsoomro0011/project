import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserGroup, faCalendarCheck,
  faFileLines, faFileCircleQuestion, faChartLine,
} from '@fortawesome/free-solid-svg-icons'
import TeacherTopbar from '../Layout/TeacherTopbar.jsx'
import CourseStudentsTab from './CourseStudentsTab.jsx'
import CourseAttendanceTab from './CourseAttendanceTab.jsx'
import CourseAssignmentsTab from './CourseAssignmentsTab.jsx'
import CourseQuizzesTab from './CourseQuizzesTab.jsx'
import CourseProgressTab from './CourseProgressTab.jsx'
import { api } from '../../../../api/client.js'

const tabs = [
  { id: 'students', label: 'Students', icon: faUserGroup },
  { id: 'attendance', label: 'Attendance', icon: faCalendarCheck },
  { id: 'assignments', label: 'Assignments', icon: faFileLines },
  { id: 'quizzes', label: 'Quizzes', icon: faFileCircleQuestion },
  { id: 'progress', label: 'Course Progress', icon: faChartLine },
]

function CourseDetail() {
  const { courseId: slotId } = useParams()
  const [slot, setSlot] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState('students')

  const loadSlot = useCallback(() => {
    api.get(`/slots/${slotId}`).then(setSlot).catch(() => setNotFound(true))
  }, [slotId])

  useEffect(() => { loadSlot() }, [loadSlot])

  if (notFound) {
    return (
      <div className="teacher-page">
        <p>Course not found.</p>
      </div>
    )
  }

  if (!slot) {
    return (
      <div className="teacher-page">
        <p className="subadmin-chart-title">Loading...</p>
      </div>
    )
  }

  return (
    <div className="teacher-page">
      <TeacherTopbar breadcrumb={['Home', 'Dashboard', slot.course?.name]} />

      <div className="course-detail-header-row">
        <h2 className="course-detail-title">{slot.course?.name} ({slot.batchLabel})</h2>
      </div>

      <div className="course-detail-tab-row">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`course-detail-tab-btn ${activeTab === tab.id ? 'course-detail-tab-btn-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <FontAwesomeIcon icon={tab.icon} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'students' && <CourseStudentsTab slot={slot} />}
      {activeTab === 'attendance' && <CourseAttendanceTab slot={slot} />}
      {activeTab === 'assignments' && <CourseAssignmentsTab slot={slot} />}
      {activeTab === 'quizzes' && <CourseQuizzesTab slot={slot} />}
      {activeTab === 'progress' && <CourseProgressTab slot={slot} onSlotUpdated={loadSlot} />}
    </div>
  )
}

export default CourseDetail
