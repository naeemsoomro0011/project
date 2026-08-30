import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faLock, faEye, faEyeSlash, faRightToBracket, faGraduationCap } from '@fortawesome/free-solid-svg-icons'

function TeacherLoginForm({ onSubmit, onSwitchToStudent, onForgotPassword }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!email.trim()) newErrors.email = 'Email is required'
    if (!password.trim()) newErrors.password = 'Password is required'
    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onSubmit({ email, password })
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h3 className="auth-form-heading">Login</h3>
      <p className="auth-form-subtext">
        Kindly provide the email and password used during SMIT course registration.
      </p>

      <div className="auth-input-group">
        <label className="auth-input-label" htmlFor="teacher-email">
          Email <span className="auth-required-star">*</span>
        </label>
        <div className={`auth-input-wrap ${errors.email ? 'auth-input-wrap-error' : ''}`}>
          <FontAwesomeIcon icon={faEnvelope} className="auth-input-icon" />
          <input
            id="teacher-email"
            type="email"
            className="auth-input"
            placeholder="you@titan.edu.pk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {errors.email && <span className="auth-error-text">{errors.email}</span>}
      </div>

      <div className="auth-input-group">
        <label className="auth-input-label" htmlFor="teacher-password">
          Password <span className="auth-required-star">*</span>
        </label>
        <div className={`auth-input-wrap ${errors.password ? 'auth-input-wrap-error' : ''}`}>
          <FontAwesomeIcon icon={faLock} className="auth-input-icon" />
          <input
            id="teacher-password"
            type={showPassword ? 'text' : 'password'}
            className="auth-input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FontAwesomeIcon
            icon={showPassword ? faEyeSlash : faEye}
            className="auth-eye-icon"
            onClick={() => setShowPassword(!showPassword)}
          />
        </div>
        {errors.password && <span className="auth-error-text">{errors.password}</span>}
      </div>

      <button type="submit" className="auth-btn-primary">
        <FontAwesomeIcon icon={faRightToBracket} /> Login
      </button>

      <button type="button" className="auth-link-btn" onClick={onForgotPassword}>
        Forgot Password?
      </button>

      <button type="button" className="auth-btn-secondary" onClick={onSwitchToStudent}>
        <FontAwesomeIcon icon={faGraduationCap} /> Login as Student
      </button>
    </form>
  )
}

export default TeacherLoginForm
