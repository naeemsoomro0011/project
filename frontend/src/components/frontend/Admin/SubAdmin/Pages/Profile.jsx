import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope, faIdBadge, faEarthAmericas, faCity, faSchool, faKey,
  faRightFromBracket, faShieldHalved, faPenToSquare,
} from '@fortawesome/free-solid-svg-icons'
import SubAdminTopbar from '../Layout/SubAdminTopbar.jsx'
import Avatar from '../../../Media/Avatar.jsx'
import WaitingPopup from '../../../Media/WaitingPopup.jsx'
import ChangePasswordPopup from '../Popups/ChangePasswordPopup.jsx'
import EditSubAdminProfilePopup from '../Popups/EditSubAdminProfilePopup.jsx'
import { permissions } from '../../../shared/permissionsConfig.js'
import { useAuth } from '../../../../../context/useAuth.js'

function Profile() {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showLogout, setShowLogout] = useState(false)

  const grantedKeys = user?.permissionKeys || []
  const grantedPermissions = permissions.filter((p) => grantedKeys.includes(p.key))

  return (
    <div className="subadmin-page profile-page-bg">
      <SubAdminTopbar breadcrumb={['Home', 'Profile']} />

      <div className="subadmin-profile-card">
        <div className="subadmin-profile-top">
          <Avatar name={user?.name} photoUrl={user?.photo} className="subadmin-profile-avatar" />
          <div>
            <h2 className="subadmin-profile-name">{user?.name}</h2>
            <span className="subadmin-profile-role-badge">{user?.role}</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="profile-logout-btn subadmin-profile-logout" onClick={() => setShowEdit(true)}>
              <FontAwesomeIcon icon={faPenToSquare} /> Edit
            </button>
            <button type="button" className="profile-logout-btn subadmin-profile-logout" onClick={() => setShowLogout(true)}>
              <FontAwesomeIcon icon={faRightFromBracket} /> Logout
            </button>
          </div>
        </div>

        <div className="subadmin-profile-info-row">
          <p><FontAwesomeIcon icon={faEnvelope} /> <strong>Email:</strong> {user?.email}</p>
          <p><FontAwesomeIcon icon={faEarthAmericas} /> <strong>Country:</strong> {user?.country}</p>
          <p><FontAwesomeIcon icon={faCity} /> <strong>City:</strong> {user?.city}</p>
          <p><FontAwesomeIcon icon={faSchool} /> <strong>Campus:</strong> {user?.campus?.name}</p>
        </div>

        <button type="button" className="teacher-update-password-btn subadmin-change-password-btn" onClick={() => setShowPassword(true)}>
          <FontAwesomeIcon icon={faKey} /> Change Password
        </button>

        <h4 className="student-form-section-heading">
          <FontAwesomeIcon icon={faShieldHalved} /> Permissions ({grantedPermissions.length})
        </h4>

        <div className="permissions-list">
          {grantedPermissions.map((p) => (
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
          {grantedPermissions.length === 0 && <p className="attendance-no-record">No permissions granted yet — ask your Super Admin.</p>}
        </div>
      </div>

      <ChangePasswordPopup show={showPassword} onClose={() => setShowPassword(false)} />

      {showEdit && (
        <EditSubAdminProfilePopup
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
