import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGaugeHigh, faUserGraduate, faCalendarCheck, faLayerGroup, faChalkboardUser,
  faArrowsRotate, faBars, faChevronDown, faUserCircle, faRightFromBracket, faCommentDots,
  faClipboardCheck, faCrown, faUserShield, faSchool, faBookOpen,
} from '@fortawesome/free-solid-svg-icons'
import titanLogo from '../../../Media/images/titan-logo.png'
import Avatar from '../../../Media/Avatar.jsx'
import { hasPermission } from '../data/superAdminData.js'
import { useAuth } from '../../../../../context/useAuth.js'

function SuperAdminSidebar({ onLogoutClick }) {
  const { user } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const inPath = (prefix) => location.pathname.startsWith(prefix)

  const [attendanceOpen, setAttendanceOpen] = useState(inPath('/admin/superadmin/attendance'))
  const [trainersOpen, setTrainersOpen] = useState(inPath('/admin/superadmin/trainers'))
  const [trainerAttendanceOpen, setTrainerAttendanceOpen] = useState(inPath('/admin/superadmin/trainers/attendance'))

  const showAttendanceGroup =
    hasPermission('ATTENDANCE_VIEW') || hasPermission('ATTENDANCE_MARK') || hasPermission('ATTENDANCE_ADD_MULTI')
  const showTrainersGroup =
    hasPermission('TRAINER') || hasPermission('TRAINER_ATTENDANCE_MARK') ||
    hasPermission('TRAINER_ATTENDANCE_VIEW') || hasPermission('TRAINER_ATTENDANCE_REQUEST')
  const showTrainerAttendanceGroup =
    hasPermission('TRAINER_ATTENDANCE_MARK') || hasPermission('TRAINER_ATTENDANCE_VIEW') || hasPermission('TRAINER_ATTENDANCE_REQUEST')

  return (
    <aside className={`superadmin-sidebar ${collapsed ? 'superadmin-sidebar-collapsed' : ''}`}>
      <div className="superadmin-sidebar-top">
        <button type="button" className="superadmin-sidebar-fold-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
          <FontAwesomeIcon icon={faBars} />
        </button>
        <div className="superadmin-sidebar-logo-wrap">
          <img src={titanLogo} alt="Titan" className="superadmin-sidebar-logo" />
          <span className="superadmin-sidebar-crown-badge" title="Super Admin">
            <FontAwesomeIcon icon={faCrown} />
          </span>
        </div>
      </div>

      <nav className="superadmin-sidebar-nav">
        {hasPermission('DASHBOARD') && (
          <NavLink to="/admin/superadmin/dashboard" className={({ isActive }) => `superadmin-nav-item ${isActive ? 'superadmin-nav-item-active' : ''}`}>
            <FontAwesomeIcon icon={faGaugeHigh} className="superadmin-nav-icon" />
            <span className="superadmin-nav-label">Dashboard</span>
          </NavLink>
        )}

        {hasPermission('STUDENT') && (
          <NavLink to="/admin/superadmin/students" className={({ isActive }) => `superadmin-nav-item ${isActive ? 'superadmin-nav-item-active' : ''}`}>
            <FontAwesomeIcon icon={faUserGraduate} className="superadmin-nav-icon" />
            <span className="superadmin-nav-label">Students</span>
          </NavLink>
        )}

        {showAttendanceGroup && (
          <div className="superadmin-nav-group">
            <button type="button" className="superadmin-nav-item superadmin-nav-group-btn" onClick={() => setAttendanceOpen(!attendanceOpen)}>
              <FontAwesomeIcon icon={faCalendarCheck} className="superadmin-nav-icon" />
              <span className="superadmin-nav-label">Attendance</span>
              <FontAwesomeIcon icon={faChevronDown} className={`superadmin-nav-chevron ${attendanceOpen ? 'superadmin-nav-chevron-open' : ''}`} />
            </button>
            {attendanceOpen && (
              <div className="superadmin-nav-children">
                {hasPermission('ATTENDANCE_MARK') && (
                  <NavLink to="/admin/superadmin/attendance/mark" className={({ isActive }) => `superadmin-nav-subitem ${isActive ? 'superadmin-nav-subitem-active' : ''}`}>
                    Mark Attendance
                  </NavLink>
                )}
                {hasPermission('ATTENDANCE_VIEW') && (
                  <NavLink to="/admin/superadmin/attendance/view" className={({ isActive }) => `superadmin-nav-subitem ${isActive ? 'superadmin-nav-subitem-active' : ''}`}>
                    View Attendance
                  </NavLink>
                )}
                {hasPermission('ATTENDANCE_ADD_MULTI') && (
                  <NavLink to="/admin/superadmin/attendance/multi" className={({ isActive }) => `superadmin-nav-subitem ${isActive ? 'superadmin-nav-subitem-active' : ''}`}>
                    Multi Attendance
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {hasPermission('SLOT') && (
          <NavLink to="/admin/superadmin/administration" className={({ isActive }) => `superadmin-nav-item ${isActive ? 'superadmin-nav-item-active' : ''}`}>
            <FontAwesomeIcon icon={faLayerGroup} className="superadmin-nav-icon" />
            <span className="superadmin-nav-label">Administration</span>
          </NavLink>
        )}

        {showTrainersGroup && (
          <div className="superadmin-nav-group">
            <button type="button" className="superadmin-nav-item superadmin-nav-group-btn" onClick={() => setTrainersOpen(!trainersOpen)}>
              <FontAwesomeIcon icon={faChalkboardUser} className="superadmin-nav-icon" />
              <span className="superadmin-nav-label">Trainers</span>
              <FontAwesomeIcon icon={faChevronDown} className={`superadmin-nav-chevron ${trainersOpen ? 'superadmin-nav-chevron-open' : ''}`} />
            </button>
            {trainersOpen && (
              <div className="superadmin-nav-children">
                {hasPermission('TRAINER') && (
                  <NavLink to="/admin/superadmin/trainers" end className={({ isActive }) => `superadmin-nav-subitem ${isActive ? 'superadmin-nav-subitem-active' : ''}`}>
                    Trainers
                  </NavLink>
                )}

                {showTrainerAttendanceGroup && (
                  <div className="superadmin-nav-group">
                    <button type="button" className="superadmin-nav-subitem superadmin-nav-group-btn" onClick={() => setTrainerAttendanceOpen(!trainerAttendanceOpen)}>
                      <span>Attendance</span>
                      <FontAwesomeIcon icon={faChevronDown} className={`superadmin-nav-chevron ${trainerAttendanceOpen ? 'superadmin-nav-chevron-open' : ''}`} />
                    </button>
                    {trainerAttendanceOpen && (
                      <div className="superadmin-nav-children superadmin-nav-children-deep">
                        {hasPermission('TRAINER_ATTENDANCE_MARK') && (
                          <NavLink to="/admin/superadmin/trainers/attendance/mark" className={({ isActive }) => `superadmin-nav-subitem ${isActive ? 'superadmin-nav-subitem-active' : ''}`}>
                            Mark Attendance
                          </NavLink>
                        )}
                        {hasPermission('TRAINER_ATTENDANCE_VIEW') && (
                          <NavLink to="/admin/superadmin/trainers/attendance/view" className={({ isActive }) => `superadmin-nav-subitem ${isActive ? 'superadmin-nav-subitem-active' : ''}`}>
                            View Attendance
                          </NavLink>
                        )}
                        {hasPermission('TRAINER_ATTENDANCE_REQUEST') && (
                          <NavLink to="/admin/superadmin/trainers/attendance/requests" className={({ isActive }) => `superadmin-nav-subitem ${isActive ? 'superadmin-nav-subitem-active' : ''}`}>
                            <FontAwesomeIcon icon={faClipboardCheck} /> Attendance Request
                          </NavLink>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <NavLink to="/admin/superadmin/feedback" className={({ isActive }) => `superadmin-nav-item ${isActive ? 'superadmin-nav-item-active' : ''}`}>
          <FontAwesomeIcon icon={faCommentDots} className="superadmin-nav-icon" />
          <span className="superadmin-nav-label">Students Feedbacks</span>
        </NavLink>

        {hasPermission('UPDATION') && (
          <NavLink to="/admin/superadmin/updation" className={({ isActive }) => `superadmin-nav-item ${isActive ? 'superadmin-nav-item-active' : ''}`}>
            <FontAwesomeIcon icon={faArrowsRotate} className="superadmin-nav-icon" />
            <span className="superadmin-nav-label">Updation</span>
          </NavLink>
        )}

        <div className="superadmin-nav-divider">
          <span className="superadmin-nav-divider-label">Super Admin Only</span>
        </div>

        {hasPermission('CAMPUS') && (
          <NavLink to="/admin/superadmin/campuses" className={({ isActive }) => `superadmin-nav-item ${isActive ? 'superadmin-nav-item-active' : ''}`}>
            <FontAwesomeIcon icon={faSchool} className="superadmin-nav-icon" />
            <span className="superadmin-nav-label">Campuses</span>
          </NavLink>
        )}

        {hasPermission('CAMPUS') && (
          <NavLink to="/admin/superadmin/courses" className={({ isActive }) => `superadmin-nav-item ${isActive ? 'superadmin-nav-item-active' : ''}`}>
            <FontAwesomeIcon icon={faBookOpen} className="superadmin-nav-icon" />
            <span className="superadmin-nav-label">Courses</span>
          </NavLink>
        )}

        {hasPermission('SUB_ADMIN') && (
          <NavLink to="/admin/superadmin/subadmins" className={({ isActive }) => `superadmin-nav-item ${isActive ? 'superadmin-nav-item-active' : ''}`}>
            <FontAwesomeIcon icon={faUserShield} className="superadmin-nav-icon" />
            <span className="superadmin-nav-label">Sub Admins</span>
          </NavLink>
        )}
      </nav>

      <div className="superadmin-sidebar-profile-wrap">
        <button type="button" className="superadmin-sidebar-profile" onClick={() => setMenuOpen(!menuOpen)}>
          <Avatar name={user?.name} photoUrl={user?.photo} className="superadmin-sidebar-avatar" />
          <span className="superadmin-sidebar-name">{user?.name}</span>
        </button>

        {menuOpen && (
          <div className="superadmin-sidebar-menu">
            <NavLink to="/admin/superadmin/profile" className="superadmin-sidebar-menu-item" onClick={() => setMenuOpen(false)}>
              <FontAwesomeIcon icon={faUserCircle} /> Profile
            </NavLink>
            <button type="button" className="superadmin-sidebar-menu-item" onClick={() => { setMenuOpen(false); onLogoutClick() }}>
              <FontAwesomeIcon icon={faRightFromBracket} /> Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

export default SuperAdminSidebar
