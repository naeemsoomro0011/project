import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen, faCircleCheck, faCircleXmark, faChevronDown,
  faSquareCheck, faClock,
} from '@fortawesome/free-solid-svg-icons'
import StudentTopbar from '../Layout/StudentTopbar.jsx'
import { api } from '../../../../api/client.js'

function isTopicDone(completedTopics, moduleId, topicId) {
  return completedTopics?.some((t) => String(t.moduleId) === String(moduleId) && String(t.topicId) === String(topicId))
}
function completedDateFor(completedTopics, moduleId, topicId) {
  const entry = completedTopics?.find((t) => String(t.moduleId) === String(moduleId) && String(t.topicId) === String(topicId))
  return entry ? new Date(entry.completedDate).toLocaleDateString() : null
}

function Progress() {
  const { openFeedback } = useOutletContext()
  const [openModules, setOpenModules] = useState({})
  const [student, setStudent] = useState(null)

  useEffect(() => {
    api.get('/students/me/profile').then(setStudent).catch(() => {})
  }, [])

  const toggleModule = (id) => setOpenModules((prev) => ({ ...prev, [id]: !prev[id] }))

  if (!student) {
    return (
      <div className="student-page">
        <StudentTopbar breadcrumb={['Home', 'Progress']} onFeedbackClick={openFeedback} />
        <p className="subadmin-chart-title">Loading...</p>
      </div>
    )
  }

  const modules = student.course?.syllabus || []
  const completedTopics = student.slot?.completedTopics || []
  const totalTopics = modules.reduce((s, m) => s + m.topics.length, 0)
  // Same fix as the teacher's Course Progress tab: only count completedTopics
  // entries that still match a topic in the current syllabus, so this total
  // can't drift above what the per-module breakdown below actually shows
  // after the Admin edits the syllabus.
  const totalCompleted = modules.reduce(
    (sum, m) => sum + m.topics.filter((t) => isTopicDone(completedTopics, m._id, t._id)).length,
    0
  )
  const totalNotCompleted = totalTopics - totalCompleted

  return (
    <div className="student-page">
      <StudentTopbar breadcrumb={['Home', student.course?.name, 'Progress']} onFeedbackClick={openFeedback} />

      <div className="progress-stat-row">
        <div className="progress-stat-box">
          <FontAwesomeIcon icon={faBookOpen} className="progress-stat-icon" />
          <span className="progress-stat-value">{totalTopics}</span>
          <span className="progress-stat-label">Total Topics</span>
        </div>
        <div className="progress-stat-box">
          <FontAwesomeIcon icon={faCircleCheck} className="progress-stat-icon" />
          <span className="progress-stat-value">{totalCompleted}</span>
          <span className="progress-stat-label">Total Completed</span>
        </div>
        <div className="progress-stat-box">
          <FontAwesomeIcon icon={faCircleXmark} className="progress-stat-icon" />
          <span className="progress-stat-value">{totalNotCompleted}</span>
          <span className="progress-stat-label">Not Completed</span>
        </div>
      </div>

      {modules.map((mod) => {
        const modCompleted = mod.topics.filter((t) => isTopicDone(completedTopics, mod._id, t._id)).length
        const isFullyDone = mod.topics.length > 0 && modCompleted === mod.topics.length
        const isOpen = !!openModules[mod._id]
        const percent = mod.topics.length ? Math.round((modCompleted / mod.topics.length) * 100) : 0

        return (
          <div key={mod._id} className="progress-module-box">
            <button type="button" className="progress-module-header" onClick={() => toggleModule(mod._id)}>
              <span className="progress-module-title">
                <FontAwesomeIcon
                  icon={isFullyDone ? faSquareCheck : faClock}
                  className={isFullyDone ? 'progress-module-tick-done' : 'progress-module-tick-pending'}
                />
                {mod.title}
                <span className="progress-module-topics-count">Topics: {modCompleted}/{mod.topics.length}</span>
              </span>

              <span className="progress-module-right">
                <span className="progress-module-percent-circle">{percent}%</span>
                <FontAwesomeIcon icon={faChevronDown} className={`progress-module-arrow ${isOpen ? 'progress-module-arrow-open' : ''}`} />
              </span>
            </button>

            {isOpen && (
              <div className="progress-module-body">
                <p className="progress-module-body-heading">Topics in {mod.title}:</p>
                {mod.topics.map((t) => {
                  const done = isTopicDone(completedTopics, mod._id, t._id)
                  const date = completedDateFor(completedTopics, mod._id, t._id)
                  return (
                    <div key={t._id} className="progress-topic-row">
                      <span className="progress-topic-name">
                        {done && <FontAwesomeIcon icon={faSquareCheck} className="progress-topic-tick" />}
                        {t.title}
                      </span>
                      {date && <span className="progress-topic-date">{date}</span>}
                    </div>
                  )
                })}
                {mod.topics.length === 0 && <p className="attendance-no-record">No topics in this module yet.</p>}
              </div>
            )}
          </div>
        )
      })}

      {modules.length === 0 && <p className="attendance-no-record">No syllabus has been added for your course yet.</p>}
    </div>
  )
}

export default Progress
