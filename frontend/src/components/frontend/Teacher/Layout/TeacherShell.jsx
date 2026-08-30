import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import TeacherSidebar from './TeacherSidebar.jsx'
import WaitingPopup from '../../Media/WaitingPopup.jsx'
import { useAuth } from '../../../../context/useAuth.js'

function TeacherShell() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showLogout, setShowLogout] = useState(false)

  return (
    <div className="teacher-shell">
      <TeacherSidebar onLogoutClick={() => setShowLogout(true)} />

      <main className="teacher-shell-main">
        <Outlet />
      </main>

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

export default TeacherShell
