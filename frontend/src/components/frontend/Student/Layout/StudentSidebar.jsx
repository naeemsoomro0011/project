import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGaugeHigh, faChartLine, faCalendarCheck, faMoneyBillWave,
  faFileLines, faPenToSquare, faBars, faUserCircle, faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons'
import titanLogo from '../../Media/images/titan-logo.png'
import Avatar from '../../Media/Avatar.jsx'
import { useAuth } from '../../../../context/useAuth.js'

const navItems = [
  { to: '/student/dashboard', label: 'Dashboard', icon: faGaugeHigh },
  { to: '/student/progress', label: 'Progress', icon: faChartLine },
  { to: '/student/attendance', label: 'Attendance', icon: faCalendarCheck },
  { to: '/student/payment', label: 'Payment', icon: faMoneyBillWave },
  { to: '/student/assignment', label: 'Assignment', icon: faFileLines },
  { to: '/student/quiz', label: 'Quiz', icon: faPenToSquare },
]

function StudentSidebar({ onLogoutClick }) {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <aside className={`student-sidebar ${collapsed ? 'student-sidebar-collapsed' : ''}`}>
      <div className="student-sidebar-top">
        <button
          type="button"
          className="student-sidebar-fold-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <img src={titanLogo} alt="Titan" className="student-sidebar-logo" />
      </div>

      <nav className="student-sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `student-sidebar-nav-item ${isActive ? 'student-sidebar-nav-item-active' : ''}`
            }
          >
            <FontAwesomeIcon icon={item.icon} className="student-sidebar-nav-icon" />
            <span className="student-sidebar-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="student-sidebar-profile-wrap">
        <button
          type="button"
          className="student-sidebar-profile"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Avatar name={user?.name} photoUrl={user?.photo} className="student-sidebar-avatar" />
          <span className="student-sidebar-name">{user?.name}</span>
        </button>

        {menuOpen && (
          <div className="student-sidebar-menu">
            <NavLink
              to="/student/profile"
              className="student-sidebar-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              <FontAwesomeIcon icon={faUserCircle} /> Profile
            </NavLink>
            <button
              type="button"
              className="student-sidebar-menu-item"
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

export default StudentSidebar
