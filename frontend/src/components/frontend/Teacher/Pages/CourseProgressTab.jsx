import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faSquareCheck, faSquare, faChartLine } from '@fortawesome/free-solid-svg-icons'
import CompareProgressPopup from '../Popups/CompareProgressPopup.jsx'
import { useAuth } from '../../../../context/useAuth.js'
import { api } from '../../../../api/client.js'

function isTopicDone(slot, moduleId, topicId) {
  return slot.completedTopics?.some((t) => String(t.moduleId) === String(moduleId) && String(t.topicId) === String(topicId))
}
function completedDateFor(slot, moduleId, topicId) {
  const entry = slot.completedTopics?.find((t) => String(t.moduleId) === String(moduleId) && String(t.topicId) === String(topicId))
  return entry ? new Date(entry.completedDate).toLocaleDateString() : null
}

function CourseProgressTab({ slot, onSlotUpdated }) {
  const { user } = useAuth()
  const [openModules, setOpenModules] = useState({})
  const [showCompare, setShowCompare] = useState(false)
  const [error, setError] = useState('')

  const modules = slot.course?.syllabus || []
  const totalTopics = modules.reduce((s, m) => s + m.topics.length, 0)
  // Count only completedTopics entries that still match a topic in the
  // *current* syllabus. Using the raw array length here counted stale
  // entries left behind whenever the Admin edited/reordered/removed
  // syllabus topics, which is exactly why this number could drift above
  // the sum of the per-module counts shown further down the page.
  const totalCompleted = modules.reduce(
    (sum, m) => sum + m.topics.filter((t) => isTopicDone(slot, m._id, t._id)).length,
    0
  )
  const overallPercent = totalTopics ? Math.round((totalCompleted / totalTopics) * 100) : 0

  const toggleModule = (id) => setOpenModules((prev) => ({ ...prev, [id]: !prev[id] }))

  const handleToggleTopic = async (moduleId, topicId) => {
    setError('')
    try {
      await api.put(`/slots/${slot._id}/progress`, { moduleId, topicId })
      onSlotUpdated()
    } catch (err) {
      setError(err.message || 'Could not update progress.')
    }
  }

  return (
    <div className="course-tab-box">
      <div className="compare-progress-header-row">
        <div>
          <p className="compare-progress-small-label">Compare Progress</p>
          <h4 className="course-tab-heading">Course Progress Overview</h4>
        </div>
        <button type="button" className="course-tab-new-btn" onClick={() => setShowCompare(true)}>
          <FontAwesomeIcon icon={faChartLine} /> Show Comparison
        </button>
      </div>

      {error && <div className="auth-error-banner">{error}</div>}

      <div className="my-progress-box">
        <p className="my-progress-label">My Progress</p>
        <div className="my-progress-top-row">
          <span className="my-progress-name">{user?.name} - {slot.campus?.name}</span>
          <span className="my-progress-batch-badge">{slot.batchLabel}</span>
          <span className="my-progress-topics">{totalCompleted}/{totalTopics}</span>
        </div>
        <div className="course-card-progress-track">
          <div className="course-card-progress-fill" style={{ width: `${overallPercent}%` }}></div>
        </div>
      </div>

      {modules.map((mod) => {
        const modCompleted = mod.topics.filter((t) => isTopicDone(slot, mod._id, t._id)).length
        const isFullyDone = mod.topics.length > 0 && modCompleted === mod.topics.length
        const isOpen = !!openModules[mod._id]
        const percent = mod.topics.length ? Math.round((modCompleted / mod.topics.length) * 100) : 0
        return (
          <div key={mod._id} className="progress-module-box">
            <button type="button" className="progress-module-header" onClick={() => toggleModule(mod._id)}>
              <span className="progress-module-title">
                <FontAwesomeIcon
                  icon={isFullyDone ? faSquareCheck : faSquare}
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
                {mod.topics.map((topic) => {
                  const done = isTopicDone(slot, mod._id, topic._id)
                  const date = completedDateFor(slot, mod._id, topic._id)
                  return (
                    <button
                      key={topic._id}
                      type="button"
                      className={`progress-topic-row ${done ? 'progress-topic-row-done' : ''}`}
                      onClick={() => handleToggleTopic(mod._id, topic._id)}
                    >
                      <FontAwesomeIcon icon={done ? faSquareCheck : faSquare} className={done ? 'progress-module-tick-done' : 'progress-module-tick-pending'} />
                      <span style={{ flex: 1, textAlign: 'left' }}>{topic.title}</span>
                      {done && date && <span className="subadmin-role-hint">Completed {date}</span>}
                    </button>
                  )
                })}
                {mod.topics.length === 0 && <p className="attendance-no-record">No topics in this module yet.</p>}
              </div>
            )}
          </div>
        )
      })}

      {modules.length === 0 && <p className="attendance-no-record">Your Super Admin hasn't added a syllabus for this course yet.</p>}

      <CompareProgressPopup show={showCompare} slot={slot} onClose={() => setShowCompare(false)} />
    </div>
  )
}

export default CourseProgressTab
