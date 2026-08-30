import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserPen, faDownload, faIdCard, faIdBadge, faEnvelope, faPhone,
  faMoneyBill, faLink, faShieldHalved, faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons'
import TeacherTopbar from '../Layout/TeacherTopbar.jsx'
import TeacherEditProfilePopup from '../Popups/TeacherEditProfilePopup.jsx'
import UpdatePasswordPopup from '../Popups/UpdatePasswordPopup.jsx'
import DownloadCardPopup from '../Popups/DownloadCardPopup.jsx'
import WaitingPopup from '../../Media/WaitingPopup.jsx'
import Avatar from '../../Media/Avatar.jsx'
import titanLogo from '../../Media/images/titan-logo.png'
import { useAuth } from '../../../../context/useAuth.js'

function TeacherProfile() {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuth()
  const [showEdit, setShowEdit] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [showDownload, setShowDownload] = useState(false)

  return (
    <div className="teacher-page profile-page-bg">
      <TeacherTopbar breadcrumb={['Home', 'Profile']} />

      <div className="profile-header-wrap">
        <div className="profile-banner">
          <img src={titanLogo} alt="" className="profile-banner-backdrop" />
          <img src={titanLogo} alt="Titan" className="profile-banner-logo" />
        </div>

        <Avatar name={user?.name} photoUrl={user?.photo} className="profile-photo" />

        <div className="profile-action-btns">
          <button type="button" className="profile-edit-btn" onClick={() => setShowEdit(true)}>
            <FontAwesomeIcon icon={faUserPen} /> Edit Profile
          </button>
          <button type="button" className="profile-edit-btn teacher-download-card-btn" onClick={() => setShowDownload(true)}>
            <FontAwesomeIcon icon={faDownload} /> Download Card
          </button>
        </div>
      </div>
      <h3 className="profile-name">{user?.name}</h3>

      <div className="profile-info-row">
        <div className="profile-info-card">
          <h5 className="profile-info-heading">
            <FontAwesomeIcon icon={faIdCard} /> Contact Info
          </h5>
          <p className="profile-info-line">Bio</p>
          <p className="profile-info-line-dim">{user?.bio || 'No bio added yet'}</p>
        </div>

        <div className="profile-info-card">
          <h5 className="profile-info-heading">
            <FontAwesomeIcon icon={faIdBadge} /> Personal Info
          </h5>
          <p className="profile-info-line"><FontAwesomeIcon icon={faEnvelope} /> Email: {user?.email}</p>
          <p className="profile-info-line"><FontAwesomeIcon icon={faIdBadge} /> Employee ID: {user?.employeeId}</p>
          <p className="profile-info-line"><FontAwesomeIcon icon={faPhone} /> Number: {user?.phone}</p>
          <p className="profile-info-line"><FontAwesomeIcon icon={faMoneyBill} /> Hourly Rate: {user?.hourlyRate}</p>
        </div>

        <div className="profile-info-card">
          <h5 className="profile-info-heading">
            <FontAwesomeIcon icon={faLink} /> Social Links
          </h5>
          <p className="profile-info-line-dim">
            {user?.socialLinks?.length > 0 ? user.socialLinks.map((l) => l.url).join(', ') : 'No Social Links added yet'}
          </p>
        </div>

        <div className="profile-info-card">
          <h5 className="profile-info-heading">
            <FontAwesomeIcon icon={faShieldHalved} /> Security
          </h5>
          <button type="button" className="teacher-update-password-btn" onClick={() => setShowPassword(true)}>
            <FontAwesomeIcon icon={faShieldHalved} /> Update Password
          </button>
        </div>
      </div>

      <div className="profile-logout-row">
        <button type="button" className="profile-logout-btn" onClick={() => setShowLogout(true)}>
          <FontAwesomeIcon icon={faRightFromBracket} /> Logout
        </button>
      </div>

      <TeacherEditProfilePopup
        show={showEdit}
        info={user}
        onClose={() => setShowEdit(false)}
        onSave={(updated) => updateUser(updated)}
      />

      <UpdatePasswordPopup show={showPassword} onClose={() => setShowPassword(false)} />

      {showDownload && (
        <DownloadCardPopup
          teacherId={user?._id}
          filename={`${user?.employeeId}-id-card.pdf`}
          onClose={() => setShowDownload(false)}
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

export default TeacherProfile
