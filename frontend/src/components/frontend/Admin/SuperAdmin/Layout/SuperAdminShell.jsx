import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import SuperAdminSidebar from './SuperAdminSidebar.jsx'
import WaitingPopup from '../../../Media/WaitingPopup.jsx'
import { useAuth } from '../../../../../context/useAuth.js'

function SuperAdminShell() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showLogout, setShowLogout] = useState(false)

  return (
    <div className="superadmin-shell">
      <SuperAdminSidebar onLogoutClick={() => setShowLogout(true)} />

      <main className="superadmin-shell-main">
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

export default SuperAdminShell
