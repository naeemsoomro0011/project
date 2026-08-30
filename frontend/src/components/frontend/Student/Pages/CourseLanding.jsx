import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faCommentDots } from '@fortawesome/free-solid-svg-icons'
import titanLogo from '../../Media/images/titan-logo.png'
import WaitingPopup from '../../Media/WaitingPopup.jsx'
import FeedbackPopup from '../Popups/FeedbackPopup.jsx'
import CourseSummaryCard from './CourseSummaryCard.jsx'
import { api } from '../../../../api/client.js'

function CourseLanding() {
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    api.get('/students/me/profile').then(setStudent).catch(() => {})
  }, [])

  return (
    <div className="course-landing-page">
      <div className="course-landing-topbar">
        <img src={titanLogo} alt="Titan" className="course-landing-logo" />

        <div className="course-landing-search-wrap">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="course-landing-search-icon" />
          <input type="text" className="course-landing-search-input" placeholder="Search courses..." disabled />
        </div>

        <button type="button" className="course-landing-feedback-btn" onClick={() => setShowFeedback(true)}>
          <FontAwesomeIcon icon={faCommentDots} /> Feedback
        </button>
      </div>

      <div className="course-landing-body">
        <CourseSummaryCard student={student} onViewDetail={() => setConnecting(true)} />
      </div>

      <FeedbackPopup show={showFeedback} onClose={() => setShowFeedback(false)} />

      <WaitingPopup
        show={connecting}
        label="Connecting to more detail..."
        durationMs={2000}
        onComplete={() => navigate('/student/dashboard')}
      />
    </div>
  )
}

export default CourseLanding
