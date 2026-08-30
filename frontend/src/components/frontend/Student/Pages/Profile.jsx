import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserPen, faEnvelope, faPhone, faLocationDot, faIdCard,
  faVenusMars, faCakeCandles, faGraduationCap, faRightFromBracket, faShieldHalved,
} from '@fortawesome/free-solid-svg-icons'
import StudentTopbar from '../Layout/StudentTopbar.jsx'
import EditProfilePopup from '../Popups/EditProfilePopup.jsx'
import UpdatePasswordPopup from '../Popups/UpdatePasswordPopup.jsx'
import WaitingPopup from '../../Media/WaitingPopup.jsx'
import Avatar from '../../Media/Avatar.jsx'
import titanLogo from '../../Media/images/titan-logo.png'
import { useAuth } from '../../../../context/useAuth.js'

function Profile() {
  const navigate = useNavigate()
  const { openFeedback } = useOutletContext()
  const { user, updateUser, logout } = useAuth()
  const [showEdit, setShowEdit] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showLogout, setShowLogout] = useState(false)

  if (!user) return null

  return (
    <div className="student-page profile-page-bg">
      <StudentTopbar breadcrumb={['Home', 'Profile']} onFeedbackClick={openFeedback} />

      <div className="profile-header-wrap">
        <div className="profile-banner">
          <img src={titanLogo} alt="" className="profile-banner-backdrop" />
          <img src={titanLogo} alt="Titan" className="profile-banner-logo" />
        </div>

        <Avatar name={user.name} photoUrl={user.photo} className="profile-photo" />

        <div className="profile-action-btns">
          <button type="button" className="profile-edit-btn" onClick={() => setShowEdit(true)}>
            <FontAwesomeIcon icon={faUserPen} /> Edit Profile
          </button>
        </div>
      </div>
      <h3 className="profile-name">{user.name}</h3>

      <div className="profile-info-row">
        <div className="profile-info-card">
          <h5 className="profile-info-heading">
            <FontAwesomeIcon icon={faEnvelope} /> Contact Info
          </h5>
          <p className="profile-info-line"><FontAwesomeIcon icon={faEnvelope} /> Email: {user.email}</p>
          <p className="profile-info-line"><FontAwesomeIcon icon={faPhone} /> Number: {user.phone}</p>
          <p className="profile-info-line"><FontAwesomeIcon icon={faLocationDot} /> Address: {user.address}</p>
        </div>

        <div className="profile-info-card">
          <h5 className="profile-info-heading">
            <FontAwesomeIcon icon={faIdCard} /> Personal Info
          </h5>
          <p className="profile-info-line"><FontAwesomeIcon icon={faVenusMars} /> Gender: {user.gender}</p>
          <p className="profile-info-line"><FontAwesomeIcon icon={faCakeCandles} /> Date of Birth: {user.dob ? new Date(user.dob).toDateString() : '-'}</p>
          <p className="profile-info-line"><FontAwesomeIcon icon={faIdCard} /> CNIC: {user.cnic}</p>
          <p className="profile-info-line"><FontAwesomeIcon icon={faGraduationCap} /> Roll Number: {user.roll}</p>
        </div>

        <div className="profile-info-card">
          <h5 className="profile-info-heading">
            <FontAwesomeIcon icon={faGraduationCap} /> Enrolled Course
          </h5>
          <p className="profile-course-name">{user.course?.name}</p>
          <span className="profile-enrolled-badge">{user.status}</span>
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

      <EditProfilePopup
        show={showEdit}
        info={user}
        onClose={() => setShowEdit(false)}
        onSave={(updated) => updateUser(updated)}
      />

      <UpdatePasswordPopup show={showPassword} onClose={() => setShowPassword(false)} />

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
