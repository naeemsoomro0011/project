import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import StudentSidebar from './StudentSidebar.jsx'
import FeedbackPopup from '../Popups/FeedbackPopup.jsx'
import WaitingPopup from '../../Media/WaitingPopup.jsx'
import { useAuth } from '../../../../context/useAuth.js'

function StudentShell() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showFeedback, setShowFeedback] = useState(false)
  const [showLogout, setShowLogout] = useState(false)

  return (
    <div className="student-shell">
      <StudentSidebar onLogoutClick={() => setShowLogout(true)} />

      <main className="student-shell-main">
        <Outlet context={{ openFeedback: () => setShowFeedback(true) }} />
      </main>

      <FeedbackPopup show={showFeedback} onClose={() => setShowFeedback(false)} />

      <WaitingPopup
        show={showLogout}
        label="Logging out..."
        durationMs={3000}
        onComplete={() => {
          logout()
          navigate('/')
        }}
      />
    </div>
  )
}

export default StudentShell
