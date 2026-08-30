import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRightToBracket, faUserPlus, faUserTie, faUserShield, faArrowLeft, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'

import titanLogo from '../components/frontend/Media/images/titan-logo.png'
import WaitingPopup from '../components/frontend/Media/WaitingPopup.jsx'
import ForgotPasswordPopup from '../components/frontend/Media/ForgotPasswordPopup.jsx'

import StudentLoginForm from '../components/frontend/Student/Auth/StudentLoginForm.jsx'
import StudentCreateForm from '../components/frontend/Student/Auth/StudentCreateForm.jsx'
import TeacherLoginForm from '../components/frontend/Teacher/Auth/TeacherLoginForm.jsx'
import SubAdminLoginForm from '../components/frontend/Admin/SubAdmin/Auth/SubAdminLoginForm.jsx'
import SuperAdminLoginForm from '../components/frontend/Admin/SuperAdmin/Auth/SuperAdminLoginForm.jsx'

import { api } from '../api/client.js'
import { useAuth } from '../context/useAuth.js'

function Landing() {
  const navigate = useNavigate()
  const { login } = useAuth()

  // 'student' | 'teacher' | 'admin'
  const [role, setRole] = useState('student')
  // 'login' or 'create' - only relevant while role === 'student'
  const [mode, setMode] = useState('login')
  // 'subadmin' | 'superadmin' | null (role picker shown when null)
  const [adminType, setAdminType] = useState(null)

  const [showWaiting, setShowWaiting] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordRole, setForgotPasswordRole] = useState('teacher')
  const [loginError, setLoginError] = useState('')
  const [pendingRedirect, setPendingRedirect] = useState(null)

  const portalHeading =
    role === 'teacher' ? 'Trainer Portal' :
    role === 'admin' ? 'Admin Panel' :
    'Student Portal'

  // Called once a form's own client-side validation passes. Makes the real
  // login/create-account call, and only shows the waiting animation once
  // the backend has actually confirmed the credentials - a failed login
  // shows the error banner instead of a fake "logging in" animation.
  const handleFormSubmit = async (payload) => {
    setLoginError('')
    try {
      let response
      let redirectTo

      if (role === 'student' && mode === 'login') {
        response = await api.post('/auth/login/student', payload)
        redirectTo = '/student/landing'
      } else if (role === 'student' && mode === 'create') {
        response = await api.post('/auth/student/create-account', payload)
        redirectTo = '/student/landing'
      } else if (role === 'teacher') {
        response = await api.post('/auth/login/teacher', payload)
        redirectTo = '/teacher/dashboard'
      } else if (role === 'admin' && adminType === 'subadmin') {
        response = await api.post('/auth/login/subadmin', payload)
        redirectTo = '/admin/subadmin/dashboard'
      } else if (role === 'admin' && adminType === 'superadmin') {
        response = await api.post('/auth/login/superadmin', payload)
        redirectTo = '/admin/superadmin/dashboard'
      }

      login(response.token, response.role, response.user)
      setPendingRedirect(redirectTo)
      setShowWaiting(true)
    } catch (err) {
      setLoginError(err.message || 'Something went wrong. Please try again.')
    }
  }

  const handleWaitingComplete = () => {
    setShowWaiting(false)
    if (pendingRedirect) navigate(pendingRedirect)
  }

  const switchToTeacher = () => {
    setRole('teacher')
    setMode('login')
    setLoginError('')
  }

  const switchToStudent = () => {
    setRole('student')
    setMode('login')
    setAdminType(null)
    setLoginError('')
  }

  const switchToAdmin = () => {
    setRole('admin')
    setAdminType(null)
    setLoginError('')
  }

  return (
    <div className="landing-page">
      <div className="landing-glow landing-glow-one"></div>
      <div className="landing-glow landing-glow-two"></div>

      <div className="landing-content">
        <img src={titanLogo} alt="Titan Institute logo" className="landing-logo" />

        <h1 key={portalHeading} className="landing-heading">
          {portalHeading}
        </h1>

        {role === 'student' && (
          <div className="landing-toggle-group">
            <button
              type="button"
              className={`landing-toggle-btn ${mode === 'login' ? 'landing-toggle-btn-active' : ''}`}
              onClick={() => { setMode('login'); setLoginError('') }}
            >
              <FontAwesomeIcon icon={faRightToBracket} /> Login
            </button>
            <button
              type="button"
              className={`landing-toggle-btn ${mode === 'create' ? 'landing-toggle-btn-active' : ''}`}
              onClick={() => { setMode('create'); setLoginError('') }}
            >
              <FontAwesomeIcon icon={faUserPlus} /> Create
            </button>
          </div>
        )}

        <div className="auth-card">
          {loginError && (
            <div className="auth-error-banner">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <span>{loginError}</span>
            </div>
          )}

          {role === 'student' && mode === 'login' && (
            <StudentLoginForm
              onSubmit={handleFormSubmit}
              onSwitchToTeacher={switchToTeacher}
              onSwitchToAdmin={switchToAdmin}
            />
          )}

          {role === 'student' && mode === 'create' && (
            <StudentCreateForm onSubmit={handleFormSubmit} />
          )}

          {role === 'teacher' && (
            <TeacherLoginForm
              onSubmit={handleFormSubmit}
              onSwitchToStudent={switchToStudent}
              onForgotPassword={() => { setForgotPasswordRole('teacher'); setShowForgotPassword(true) }}
            />
          )}

          {role === 'admin' && adminType === null && (
            <div className="auth-form">
              <h3 className="auth-form-heading">Choose Admin Type</h3>
              <p className="auth-form-subtext">
                Select which kind of admin account you'd like to log in with.
              </p>

              <button type="button" className="admin-type-card" onClick={() => { setAdminType('subadmin'); setLoginError('') }}>
                <FontAwesomeIcon icon={faUserTie} className="admin-type-icon" />
                <span className="admin-type-text">
                  <span className="admin-type-title">Sub Admin</span>
                  <span className="admin-type-desc">Campus staff — students, attendance, trainers &amp; more</span>
                </span>
              </button>

              <button type="button" className="admin-type-card" onClick={() => { setAdminType('superadmin'); setLoginError('') }}>
                <FontAwesomeIcon icon={faUserShield} className="admin-type-icon" />
                <span className="admin-type-text">
                  <span className="admin-type-title">Super Admin</span>
                  <span className="admin-type-desc">Full control across every city &amp; campus</span>
                </span>
              </button>

              <button type="button" className="auth-link-btn" onClick={switchToStudent}>
                <FontAwesomeIcon icon={faArrowLeft} /> Back to Student Login
              </button>
            </div>
          )}

          {role === 'admin' && adminType === 'subadmin' && (
            <>
              <SubAdminLoginForm
                onSubmit={handleFormSubmit}
                onForgotPassword={() => { setForgotPasswordRole('subadmin'); setShowForgotPassword(true) }}
              />
              <button type="button" className="auth-link-btn" onClick={() => setAdminType(null)}>
                <FontAwesomeIcon icon={faArrowLeft} /> Back
              </button>
            </>
          )}

          {role === 'admin' && adminType === 'superadmin' && (
            <>
              <SuperAdminLoginForm
                onSubmit={handleFormSubmit}
                onForgotPassword={() => { setForgotPasswordRole('superadmin'); setShowForgotPassword(true) }}
              />
              <button type="button" className="auth-link-btn" onClick={() => setAdminType(null)}>
                <FontAwesomeIcon icon={faArrowLeft} /> Back
              </button>
            </>
          )}
        </div>
      </div>

      <WaitingPopup
        show={showWaiting}
        label={role === 'student' && mode === 'login' ? 'Waiting...' : 'Logging you in...'}
        durationMs={3000}
        onComplete={handleWaitingComplete}
      />

      <ForgotPasswordPopup
        show={showForgotPassword}
        role={forgotPasswordRole}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  )
}

export default Landing
