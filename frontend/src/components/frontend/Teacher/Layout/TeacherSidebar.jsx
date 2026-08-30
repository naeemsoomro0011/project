import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGaugeHigh, faCalendarDays, faCalendarCheck, faBars,
  faUserCircle, faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons'
import titanLogo from '../../Media/images/titan-logo.png'
import Avatar from '../../Media/Avatar.jsx'
import { useAuth } from '../../../../context/useAuth.js'

const navItems = [
  { to: '/teacher/dashboard', label: 'Dashboard', icon: faGaugeHigh },
  { to: '/teacher/calendar', label: 'Calendar', icon: faCalendarDays },
  { to: '/teacher/attendance', label: 'Attendance', icon: faCalendarCheck },
]

function TeacherSidebar({ onLogoutClick }) {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <aside className={`teacher-sidebar ${collapsed ? 'teacher-sidebar-collapsed' : ''}`}>
      <div className="teacher-sidebar-top">
        <button
          type="button"
          className="teacher-sidebar-fold-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <img src={titanLogo} alt="Titan" className="teacher-sidebar-logo" />
      </div>

      <nav className="teacher-sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `teacher-sidebar-nav-item ${isActive ? 'teacher-sidebar-nav-item-active' : ''}`
            }
          >
            <FontAwesomeIcon icon={item.icon} className="teacher-sidebar-nav-icon" />
            <span className="teacher-sidebar-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="teacher-sidebar-profile-wrap">
        <button type="button" className="teacher-sidebar-profile" onClick={() => setMenuOpen(!menuOpen)}>
          <Avatar name={user?.name} photoUrl={user?.photo} className="teacher-sidebar-avatar" />
          <span className="teacher-sidebar-name">{user?.name}</span>
        </button>

        {menuOpen && (
          <div className="teacher-sidebar-menu">
            <NavLink
              to="/teacher/profile"
              className="teacher-sidebar-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              <FontAwesomeIcon icon={faUserCircle} /> Profile
            </NavLink>
            <button
              type="button"
              className="teacher-sidebar-menu-item"
              onClick={() => {
                setMenuOpen(false)
                onLogoutClick()
              }}
            >
              <FontAwesomeIcon icon={faRightFromBracket} /> Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

export default TeacherSidebar
