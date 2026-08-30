import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGaugeHigh, faUserGraduate, faCalendarCheck, faLayerGroup, faChalkboardUser,
  faArrowsRotate, faBars, faChevronDown, faUserCircle, faRightFromBracket,
  faClipboardCheck, faCommentDots, faUserShield,
} from '@fortawesome/free-solid-svg-icons'
import titanLogo from '../../../Media/images/titan-logo.png'
import Avatar from '../../../Media/Avatar.jsx'
import { hasPermission } from '../data/subAdminData.js'
import { useAuth } from '../../../../../context/useAuth.js'

function SubAdminSidebar({ onLogoutClick }) {
  const { user } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const inPath = (prefix) => location.pathname.startsWith(prefix)

  const [attendanceOpen, setAttendanceOpen] = useState(inPath('/admin/subadmin/attendance'))
  const [trainersOpen, setTrainersOpen] = useState(inPath('/admin/subadmin/trainers'))
  const [trainerAttendanceOpen, setTrainerAttendanceOpen] = useState(inPath('/admin/subadmin/trainers/attendance'))

  const showAttendanceGroup =
    hasPermission('ATTENDANCE_VIEW') || hasPermission('ATTENDANCE_MARK') || hasPermission('ATTENDANCE_ADD_MULTI')
  const showTrainersGroup =
    hasPermission('TRAINER') || hasPermission('TRAINER_ATTENDANCE_MARK') ||
    hasPermission('TRAINER_ATTENDANCE_VIEW') || hasPermission('TRAINER_ATTENDANCE_REQUEST')
  const showTrainerAttendanceGroup =
    hasPermission('TRAINER_ATTENDANCE_MARK') || hasPermission('TRAINER_ATTENDANCE_VIEW') || hasPermission('TRAINER_ATTENDANCE_REQUEST')

  return (
    <aside className={`subadmin-sidebar ${collapsed ? 'subadmin-sidebar-collapsed' : ''}`}>
      <div className="subadmin-sidebar-top">
        <button type="button" className="subadmin-sidebar-fold-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
          <FontAwesomeIcon icon={faBars} />
        </button>
        <div className="subadmin-sidebar-logo-wrap">
          <img src={titanLogo} alt="Titan" className="subadmin-sidebar-logo" />
          <span className="subadmin-sidebar-badge" title="Sub Admin">
            <FontAwesomeIcon icon={faUserShield} />
          </span>
        </div>
      </div>

      <nav className="subadmin-sidebar-nav">
        {hasPermission('DASHBOARD') && (
          <NavLink to="/admin/subadmin/dashboard" className={({ isActive }) => `subadmin-nav-item ${isActive ? 'subadmin-nav-item-active' : ''}`}>
            <FontAwesomeIcon icon={faGaugeHigh} className="subadmin-nav-icon" />
            <span className="subadmin-nav-label">Dashboard</span>
          </NavLink>
        )}

        {hasPermission('STUDENT') && (
          <NavLink to="/admin/subadmin/students" className={({ isActive }) => `subadmin-nav-item ${isActive ? 'subadmin-nav-item-active' : ''}`}>
            <FontAwesomeIcon icon={faUserGraduate} className="subadmin-nav-icon" />
            <span className="subadmin-nav-label">Students</span>
          </NavLink>
        )}

        {showAttendanceGroup && (
          <div className="subadmin-nav-group">
            <button type="button" className="subadmin-nav-item subadmin-nav-group-btn" onClick={() => setAttendanceOpen(!attendanceOpen)}>
              <FontAwesomeIcon icon={faCalendarCheck} className="subadmin-nav-icon" />
              <span className="subadmin-nav-label">Attendance</span>
              <FontAwesomeIcon icon={faChevronDown} className={`subadmin-nav-chevron ${attendanceOpen ? 'subadmin-nav-chevron-open' : ''}`} />
            </button>
            {attendanceOpen && (
              <div className="subadmin-nav-children">
                {hasPermission('ATTENDANCE_MARK') && (
                  <NavLink to="/admin/subadmin/attendance/mark" className={({ isActive }) => `subadmin-nav-subitem ${isActive ? 'subadmin-nav-subitem-active' : ''}`}>
                    Mark Attendance
                  </NavLink>
                )}
                {hasPermission('ATTENDANCE_VIEW') && (
                  <NavLink to="/admin/subadmin/attendance/view" className={({ isActive }) => `subadmin-nav-subitem ${isActive ? 'subadmin-nav-subitem-active' : ''}`}>
                    View Attendance
                  </NavLink>
                )}
                {hasPermission('ATTENDANCE_ADD_MULTI') && (
                  <NavLink to="/admin/subadmin/attendance/multi" className={({ isActive }) => `subadmin-nav-subitem ${isActive ? 'subadmin-nav-subitem-active' : ''}`}>
                    Multi Attendance
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {hasPermission('SLOT') && (
          <NavLink to="/admin/subadmin/administration" className={({ isActive }) => `subadmin-nav-item ${isActive ? 'subadmin-nav-item-active' : ''}`}>
            <FontAwesomeIcon icon={faLayerGroup} className="subadmin-nav-icon" />
            <span className="subadmin-nav-label">Administration</span>
          </NavLink>
        )}

        {showTrainersGroup && (
          <div className="subadmin-nav-group">
            <button type="button" className="subadmin-nav-item subadmin-nav-group-btn" onClick={() => setTrainersOpen(!trainersOpen)}>
              <FontAwesomeIcon icon={faChalkboardUser} className="subadmin-nav-icon" />
              <span className="subadmin-nav-label">Trainers</span>
              <FontAwesomeIcon icon={faChevronDown} className={`subadmin-nav-chevron ${trainersOpen ? 'subadmin-nav-chevron-open' : ''}`} />
            </button>
            {trainersOpen && (
              <div className="subadmin-nav-children">
                {hasPermission('TRAINER') && (
                  <NavLink to="/admin/subadmin/trainers" end className={({ isActive }) => `subadmin-nav-subitem ${isActive ? 'subadmin-nav-subitem-active' : ''}`}>
                    Trainers
                  </NavLink>
                )}

                {showTrainerAttendanceGroup && (
                  <div className="subadmin-nav-group">
                    <button type="button" className="subadmin-nav-subitem subadmin-nav-group-btn" onClick={() => setTrainerAttendanceOpen(!trainerAttendanceOpen)}>
                      <span>Attendance</span>
                      <FontAwesomeIcon icon={faChevronDown} className={`subadmin-nav-chevron ${trainerAttendanceOpen ? 'subadmin-nav-chevron-open' : ''}`} />
                    </button>
                    {trainerAttendanceOpen && (
                      <div className="subadmin-nav-children subadmin-nav-children-deep">
                        {hasPermission('TRAINER_ATTENDANCE_MARK') && (
                          <NavLink to="/admin/subadmin/trainers/attendance/mark" className={({ isActive }) => `subadmin-nav-subitem ${isActive ? 'subadmin-nav-subitem-active' : ''}`}>
                            Mark Attendance
                          </NavLink>
                        )}
                        {hasPermission('TRAINER_ATTENDANCE_VIEW') && (
                          <NavLink to="/admin/subadmin/trainers/attendance/view" className={({ isActive }) => `subadmin-nav-subitem ${isActive ? 'subadmin-nav-subitem-active' : ''}`}>
                            View Attendance
                          </NavLink>
                        )}
                        {hasPermission('TRAINER_ATTENDANCE_REQUEST') && (
                          <NavLink to="/admin/subadmin/trainers/attendance/requests" className={({ isActive }) => `subadmin-nav-subitem ${isActive ? 'subadmin-nav-subitem-active' : ''}`}>
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

        <NavLink to="/admin/subadmin/feedback" className={({ isActive }) => `subadmin-nav-item ${isActive ? 'subadmin-nav-item-active' : ''}`}>
          <FontAwesomeIcon icon={faCommentDots} className="subadmin-nav-icon" />
          <span className="subadmin-nav-label">Students Feedbacks</span>
        </NavLink>

        {hasPermission('UPDATION') && (
          <NavLink to="/admin/subadmin/updation" className={({ isActive }) => `subadmin-nav-item ${isActive ? 'subadmin-nav-item-active' : ''}`}>
            <FontAwesomeIcon icon={faArrowsRotate} className="subadmin-nav-icon" />
            <span className="subadmin-nav-label">Updation</span>
          </NavLink>
        )}
      </nav>

      <div className="subadmin-sidebar-profile-wrap">
        <button type="button" className="subadmin-sidebar-profile" onClick={() => setMenuOpen(!menuOpen)}>
          <Avatar name={user?.name} photoUrl={user?.photo} className="subadmin-sidebar-avatar" />
          <span className="subadmin-sidebar-name">{user?.name}</span>
        </button>

        {menuOpen && (
          <div className="subadmin-sidebar-menu">
            <NavLink to="/admin/subadmin/profile" className="subadmin-sidebar-menu-item" onClick={() => setMenuOpen(false)}>
              <FontAwesomeIcon icon={faUserCircle} /> Profile
            </NavLink>
            <button type="button" className="subadmin-sidebar-menu-item" onClick={() => { setMenuOpen(false); onLogoutClick() }}>
              <FontAwesomeIcon icon={faRightFromBracket} /> Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

export default SubAdminSidebar
