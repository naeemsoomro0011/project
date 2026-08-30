import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import SubAdminSidebar from './SubAdminSidebar.jsx'
import WaitingPopup from '../../../Media/WaitingPopup.jsx'
import { useAuth } from '../../../../../context/useAuth.js'

function SubAdminShell() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showLogout, setShowLogout] = useState(false)

  return (
    <div className="subadmin-shell">
      <SubAdminSidebar onLogoutClick={() => setShowLogout(true)} />

      <main className="subadmin-shell-main">
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

export default SubAdminShell
