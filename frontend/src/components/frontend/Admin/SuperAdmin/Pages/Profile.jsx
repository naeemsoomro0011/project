import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope, faIdBadge, faEarthAmericas, faCity, faKey,
  faRightFromBracket, faShieldHalved, faCrown, faPenToSquare,
} from '@fortawesome/free-solid-svg-icons'
import SuperAdminTopbar from '../Layout/SuperAdminTopbar.jsx'
import Avatar from '../../../Media/Avatar.jsx'
import WaitingPopup from '../../../Media/WaitingPopup.jsx'
import ChangePasswordPopup from '../Popups/ChangePasswordPopup.jsx'
import EditSuperAdminProfilePopup from '../Popups/EditSuperAdminProfilePopup.jsx'
import { permissions } from '../../../shared/permissionsConfig.js'
import { useAuth } from '../../../../../context/useAuth.js'

function Profile() {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showLogout, setShowLogout] = useState(false)

  return (
    <div className="superadmin-page profile-page-bg">
      <SuperAdminTopbar breadcrumb={['Home', 'Profile']} />

      <div className="superadmin-profile-card">
        <div className="superadmin-profile-top">
          <Avatar name={user?.name} photoUrl={user?.photo} className="superadmin-profile-avatar" />
          <div>
            <h2 className="superadmin-profile-name">{user?.name}</h2>
            <span className="superadmin-profile-role-badge">
              <FontAwesomeIcon icon={faCrown} /> Super Admin
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="profile-logout-btn superadmin-profile-logout" onClick={() => setShowEdit(true)}>
              <FontAwesomeIcon icon={faPenToSquare} /> Edit
            </button>
            <button type="button" className="profile-logout-btn superadmin-profile-logout" onClick={() => setShowLogout(true)}>
              <FontAwesomeIcon icon={faRightFromBracket} /> Logout
            </button>
          </div>
        </div>

        <div className="superadmin-profile-info-row">
          <p><FontAwesomeIcon icon={faEnvelope} /> <strong>Email:</strong> {user?.email}</p>
          <p><FontAwesomeIcon icon={faEarthAmericas} /> <strong>Country:</strong> {user?.country}</p>
          <p><FontAwesomeIcon icon={faCity} /> <strong>Phone:</strong> {user?.phone}</p>
        </div>

        <button type="button" className="teacher-update-password-btn superadmin-change-password-btn" onClick={() => setShowPassword(true)}>
          <FontAwesomeIcon icon={faKey} /> Change Password
        </button>

        <h4 className="student-form-section-heading">
          <FontAwesomeIcon icon={faShieldHalved} /> Permissions
        </h4>
        <p className="subadmin-role-hint">Super Admin always has full access to every module.</p>

        <div className="permissions-list">
          {permissions.map((p) => (
            <div key={p.key} className="permission-row">
              <span className="permission-key">
                <FontAwesomeIcon icon={faIdBadge} /> {p.key}
              </span>
              <span className="permission-badges">
                {p.actions.map((a) => (
                  <span key={a} className="permission-badge">{a}</span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ChangePasswordPopup show={showPassword} onClose={() => setShowPassword(false)} />

      {showEdit && (
        <EditSuperAdminProfilePopup
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => updateUser(updated)}
        />
      )}

      <WaitingPopup
        show={showLogout}
        label="Logging out..."
        durationMs={3000}
        onComplete={() => { logout(); navigate('/') }}
      />
    </div>
  )
}

export default Profile
