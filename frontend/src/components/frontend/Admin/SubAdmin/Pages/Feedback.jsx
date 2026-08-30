import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBug, faLightbulb, faCommentDots, faInbox } from '@fortawesome/free-solid-svg-icons'
import SubAdminTopbar from '../Layout/SubAdminTopbar.jsx'
import Avatar from '../../../Media/Avatar.jsx'
import { api } from '../../../../../api/client.js'

const typeIcon = { Bug: faBug, Idea: faLightbulb, Other: faCommentDots }
const typeClass = { Bug: 'feedback-type-bug', Idea: 'feedback-type-idea', Other: 'feedback-type-other' }

// Reading a feedback card marks it read server-side and removes it from the
// list - exactly the "disappears once opened" behaviour from the spec, so
// the list here always shows only what Sub Admin hasn't looked at yet.
function Feedback() {
  const [items, setItems] = useState([])
  const [opened, setOpened] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api.get('/feedback').then(setItems).catch((err) => setError(err.message || 'Could not load feedback.'))
  }, [])

  useEffect(() => { load() }, [load])

  const handleOpen = async (item) => {
    setOpened(item)
    try {
      await api.put(`/feedback/${item._id}/read`)
      setItems((prev) => prev.filter((i) => i._id !== item._id))
    } catch {
      // even if marking-read fails, still let them read it now; try again next load
    }
  }

  return (
    <div className="subadmin-page">
      <SubAdminTopbar breadcrumb={['Home', 'Students Feedbacks']} />

      <h4 className="course-tab-heading" style={{ marginBottom: 14 }}>
        <FontAwesomeIcon icon={faInbox} /> Students Feedbacks ({items.length})
      </h4>

      {error && <div className="auth-error-banner">{error}</div>}

      {opened ? (
        <div className="feedback-detail-card">
          <button type="button" className="feedback-back-btn" onClick={() => setOpened(null)}>← Back to list</button>
          <div className="feedback-detail-top">
            <Avatar name={opened.student?.name} photoUrl={opened.student?.photo} className="feedback-detail-avatar" />
            <div>
              <h4 className="feedback-detail-name">{opened.student?.name}</h4>
              <p className="feedback-detail-meta">
                Roll: {opened.student?.roll} &nbsp;|&nbsp; {opened.student?.course?.name}
              </p>
            </div>
            <span className={`feedback-type-badge ${typeClass[opened.type]}`}>
              <FontAwesomeIcon icon={typeIcon[opened.type]} /> {opened.type}
            </span>
          </div>
          <p className="assignment-view-label">Message</p>
          <div className="assignment-view-notes-box">{opened.message}</div>
          {opened.image && (
            <>
              <p className="assignment-view-label">Attached Image</p>
              <img src={opened.image} alt="Feedback attachment" className="assignment-view-image" />
            </>
          )}
        </div>
      ) : (
        <div className="feedback-card-grid">
          {items.map((f) => (
            <button key={f._id} type="button" className="feedback-list-card" onClick={() => handleOpen(f)}>
              <div className="feedback-list-card-top">
                <Avatar name={f.student?.name} photoUrl={f.student?.photo} className="feedback-list-avatar" />
                <div>
                  <h5 className="feedback-list-name">{f.student?.name}</h5>
                  <span className="feedback-list-course">{f.student?.course?.name} — {f.student?.roll}</span>
                </div>
                <span className={`feedback-type-badge ${typeClass[f.type]}`}>
                  <FontAwesomeIcon icon={typeIcon[f.type]} /> {f.type}
                </span>
              </div>
              <p className="feedback-list-preview">{f.message}</p>
            </button>
          ))}

          {items.length === 0 && <p className="attendance-no-record">No new feedback — all caught up!</p>}
        </div>
      )}
    </div>
  )
}

export default Feedback
