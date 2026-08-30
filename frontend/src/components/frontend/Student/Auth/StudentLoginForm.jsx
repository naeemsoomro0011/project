import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faIdCard, faLock, faEye, faEyeSlash, faRightToBracket, faChalkboardUser, faUserShield } from '@fortawesome/free-solid-svg-icons'

function StudentLoginForm({ onSubmit, onSwitchToTeacher, onSwitchToAdmin }) {
  const [cnic, setCnic] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!cnic.trim()) newErrors.cnic = 'CNIC is required'
    if (!password.trim()) newErrors.password = 'Password is required'
    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onSubmit({ cnic, password })
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h3 className="auth-form-heading">Login</h3>
      <p className="auth-form-subtext">
        Kindly provide the CNIC number and password used during SMIT course registration.
      </p>

      <div className="auth-input-group">
        <label className="auth-input-label" htmlFor="student-cnic">
          CNIC <span className="auth-required-star">*</span>
        </label>
        <div className={`auth-input-wrap ${errors.cnic ? 'auth-input-wrap-error' : ''}`}>
          <FontAwesomeIcon icon={faIdCard} className="auth-input-icon" />
          <input
            id="student-cnic"
            type="text"
            className="auth-input"
            placeholder="42101-1234567-1"
            value={cnic}
            onChange={(e) => setCnic(e.target.value)}
          />
        </div>
        {errors.cnic && <span className="auth-error-text">{errors.cnic}</span>}
      </div>

      <div className="auth-input-group">
        <label className="auth-input-label" htmlFor="student-password">
          Password <span className="auth-required-star">*</span>
        </label>
        <div className={`auth-input-wrap ${errors.password ? 'auth-input-wrap-error' : ''}`}>
          <FontAwesomeIcon icon={faLock} className="auth-input-icon" />
          <input
            id="student-password"
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

      <button type="button" className="auth-btn-secondary" onClick={onSwitchToTeacher}>
        <FontAwesomeIcon icon={faChalkboardUser} /> Login as Teacher
      </button>

      <button type="button" className="auth-btn-secondary" onClick={onSwitchToAdmin}>
        <FontAwesomeIcon icon={faUserShield} /> Login as Admin
      </button>
    </form>
  )
}

export default StudentLoginForm
