import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faUserGraduate } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../api/client.js'

const tabs = ['Attendance', 'Assignments', 'Quizzes']

function StudentDetailPopup({ student, slot, onClose }) {
  const [tab, setTab] = useState('Attendance')
  const [attendance, setAttendance] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [quizzes, setQuizzes] = useState([])

  useEffect(() => {
    if (!student) return
    api.get(`/attendance/student/${student._id}`).then(setAttendance).catch(() => {})
    api.get(`/assignments/student/${student._id}?slot=${slot._id}`).then(setAssignments).catch(() => {})
    api.get(`/quizzes/student/${student._id}?slot=${slot._id}`).then(setQuizzes).catch(() => {})
  }, [student, slot])

  if (!student) return null

  return (
    <div className="generic-popup-overlay">
      <div className="student-detail-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faUserGraduate} /> {student.name}
          </span>
          <button className="generic-popup-close" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <p className="student-detail-meta">Roll: {student.roll} &nbsp;|&nbsp; {student.email}</p>

        <div className="course-detail-tab-row student-detail-tab-row">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              className={`course-detail-tab-btn ${tab === t ? 'course-detail-tab-btn-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Attendance' && attendance && (
          <div className="student-detail-section">
            <div className="attendance-overview-track">
              <div
                className={`attendance-overview-fill ${attendance.percentage >= 70 ? 'attendance-overview-fill-good' : 'attendance-overview-fill-bad'}`}
                style={{ width: `${attendance.percentage}%` }}
              ></div>
            </div>
            <p className="student-detail-percent-label">{attendance.percentage}% Present ({attendance.present}/{attendance.totalClasses} classes)</p>
          </div>
        )}

        {tab === 'Assignments' && (
          <div className="student-detail-section">
            {assignments.map((a) => (
              <div key={a._id} className="student-detail-row">
                <span>{a.title}</span>
                <span className={`assignment-status-chip assignment-status-${(a.studentSubmission?.status || 'Not Submitted').replace(/\s+/g, '-').toLowerCase()}`}>
                  {a.studentSubmission ? (a.studentSubmission.isLate ? 'Late' : a.studentSubmission.status) : 'Not Submitted'}
                </span>
              </div>
            ))}
            {assignments.length === 0 && <p className="attendance-no-record">No assignments yet.</p>}
          </div>
        )}

        {tab === 'Quizzes' && (
          <div className="student-detail-section">
            {quizzes.map((q) => (
              <div key={q._id} className="student-detail-row">
                <span>{q.title}</span>
                {q.studentLatestAttempt ? (
                  <span className={`quiz-status-chip ${q.studentLatestAttempt.passed ? 'quiz-status-passed' : 'quiz-status-failed'}`}>
                    {q.studentLatestAttempt.correctCount}/{q.totalQuestions} ({q.studentLatestAttempt.percentage}%)
                  </span>
                ) : (
                  <span className="quiz-status-chip">Not attempted</span>
                )}
              </div>
            ))}
            {quizzes.length === 0 && <p className="attendance-no-record">No quizzes yet.</p>}
          </div>
        )}

        <div className="assignment-view-footer">
          <button type="button" className="generic-popup-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default StudentDetailPopup
