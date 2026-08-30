import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarCheck, faFileLines, faChalkboard, faFileCircleQuestion,
  faLightbulb, faCalendarDay, faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons'
import StudentTopbar from '../Layout/StudentTopbar.jsx'
import CourseSummaryCard from './CourseSummaryCard.jsx'
import { getCurrentWeekDates, dayName, formatDate } from '../../Media/dateUtils.js'
import { api } from '../../../../api/client.js'

const activityTabs = [
  { id: 'assignments', label: 'Assignments', icon: faFileLines, message: 'No Upcoming Assignments' },
  { id: 'quizzes', label: 'Quizzes', icon: faFileCircleQuestion, message: 'No Upcoming Quizzes' },
]

function Dashboard() {
  const navigate = useNavigate()
  const { openFeedback } = useOutletContext()
  const [activeTab, setActiveTab] = useState('assignments')
  const weekDates = getCurrentWeekDates()

  const [student, setStudent] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [voucher, setVoucher] = useState(null)

  useEffect(() => {
    api.get('/students/me/profile').then(setStudent).catch(() => {})
    api.get('/attendance/me').then(setAttendance).catch(() => {})
    api.get('/assignments/me').then((res) => setAssignments(res.assignments)).catch(() => {})
    api.get('/quizzes/me').then((res) => setQuizzes(res.quizzes)).catch(() => {})
    api.get('/vouchers/me').then((res) => setVoucher(res[0] || null)).catch(() => {})
  }, [])

  const upcomingAssignments = assignments.filter((a) => !a.mySubmission || a.mySubmission.status === 'Not Submitted')
  const upcomingQuizzes = quizzes.filter((q) => q.attemptsRemaining > 0)
  const activeWeekdays = new Set(student?.slot?.scheduleDays || [])

  return (
    <div className="student-page">
      <StudentTopbar breadcrumb={['Home', 'Dashboard']} onFeedbackClick={openFeedback} />

      <div className="dashboard-top-row">
        <button type="button" className="dashboard-stat-card" onClick={() => navigate('/student/attendance')}>
          <FontAwesomeIcon icon={faCalendarCheck} className="dashboard-stat-icon" />
          <span className="dashboard-stat-value">{attendance ? `${attendance.percentage}%` : '-'}</span>
          <span className="dashboard-stat-label">Attendance</span>
        </button>

        <button type="button" className="dashboard-stat-card" onClick={() => navigate('/student/assignment')}>
          <FontAwesomeIcon icon={faFileLines} className="dashboard-stat-icon" />
          <span className="dashboard-stat-value">{assignments.length}</span>
          <span className="dashboard-stat-label">Assignments</span>
        </button>

        <div className="dashboard-schedule-card">
          <span className="dashboard-schedule-heading">
            <FontAwesomeIcon icon={faCalendarDay} /> Class Schedule
          </span>
          <div className="dashboard-schedule-days">
            {weekDates.map((d) => {
              const dname = dayName(d)
              const isClassDay = activeWeekdays.has(d.getDay())
              return (
                <div key={d.toISOString()} className={`dashboard-day-box ${isClassDay ? 'dashboard-day-box-active' : ''}`}>
                  <span className="dashboard-day-name">{dname}</span>
                  <span className="dashboard-day-date">{d.getDate()}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <h3 className="student-section-heading">Active Course</h3>

      <div className="dashboard-active-course-row">
        <div className="dashboard-active-course-left">
          <CourseSummaryCard student={student} showSchedule />
        </div>

        <div className="dashboard-active-course-right">
          <div className="activity-tab-row">
            {activityTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`activity-tab-btn ${activeTab === tab.id ? 'activity-tab-btn-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <FontAwesomeIcon icon={tab.icon} /> {tab.label}
              </button>
            ))}
          </div>
          <div className="activity-tab-content">
            {activeTab === 'assignments' && (
              upcomingAssignments.length > 0 ? (
                <div className="dashboard-activity-list">
                  {upcomingAssignments.slice(0, 4).map((a) => (
                    <button key={a._id} type="button" className="dashboard-activity-item" onClick={() => navigate('/student/assignment')}>
                      <FontAwesomeIcon icon={faFileLines} /> {a.title} — due {formatDate(new Date(a.dueDate))}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <FontAwesomeIcon icon={faChalkboard} className="activity-tab-content-icon" />
                  <p>No Upcoming Assignments</p>
                </>
              )
            )}
            {activeTab === 'quizzes' && (
              upcomingQuizzes.length > 0 ? (
                <div className="dashboard-activity-list">
                  {upcomingQuizzes.slice(0, 4).map((q) => (
                    <button key={q._id} type="button" className="dashboard-activity-item" onClick={() => navigate('/student/quiz')}>
                      <FontAwesomeIcon icon={faFileCircleQuestion} /> {q.title} — due {formatDate(new Date(q.dueDate))}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <FontAwesomeIcon icon={faLightbulb} className="activity-tab-content-icon" />
                  <p>No Upcoming Quizzes</p>
                </>
              )
            )}
          </div>
        </div>
      </div>

      <h3 className="student-section-heading">
        <FontAwesomeIcon icon={faMoneyBillWave} /> Fee
      </h3>

      <div className="fee-challan-box">
        <div className="fee-challan-header">
          <span>Month</span>
          <span>Amount</span>
          <span>Type</span>
          <span>Due Date</span>
          <span>Voucher ID</span>
          <span>Status</span>
        </div>
        {voucher ? (
          <div className="fee-challan-row">
            <span>{voucher.month}</span>
            <span>Rs. {voucher.amount}</span>
            <span>{voucher.type}</span>
            <span>{formatDate(new Date(voucher.dueDate))}</span>
            <span>{voucher.invoiceNo}</span>
            <span className={voucher.status === 'Paid' ? 'fee-status-paid' : 'voucher-status-pending'}>{voucher.status}</span>
          </div>
        ) : (
          <p className="attendance-no-record">No voucher generated yet.</p>
        )}
      </div>
    </div>
  )
}

export default Dashboard
