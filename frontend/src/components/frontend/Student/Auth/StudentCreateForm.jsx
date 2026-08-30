import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faIdCard, faLock, faEye, faEyeSlash, faCalendarDays, faUserPlus } from '@fortawesome/free-solid-svg-icons'

function StudentCreateForm({ onSubmit }) {
  const [cnic, setCnic] = useState('')
  const [dob, setDob] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!cnic.trim()) newErrors.cnic = 'CNIC is required'
    if (!dob.trim()) newErrors.dob = 'Date of birth is required'
    if (!password.trim()) newErrors.password = 'Password is required'
    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onSubmit({ cnic, dob, password })
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h3 className="auth-form-heading">Create a Password</h3>
      <p className="auth-form-subtext">
        Kindly provide the CNIC number and password used during SMIT course registration.
      </p>

      <div className="auth-input-group">
        <label className="auth-input-label" htmlFor="create-cnic">
          CNIC <span className="auth-required-star">*</span>
        </label>
        <div className={`auth-input-wrap ${errors.cnic ? 'auth-input-wrap-error' : ''}`}>
          <FontAwesomeIcon icon={faIdCard} className="auth-input-icon" />
          <input
            id="create-cnic"
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
        <label className="auth-input-label" htmlFor="create-dob">
          Date of Birth <span className="auth-required-star">*</span>
        </label>
        <div className={`auth-input-wrap ${errors.dob ? 'auth-input-wrap-error' : ''}`}>
          <FontAwesomeIcon icon={faCalendarDays} className="auth-input-icon" />
          <input
            id="create-dob"
            type="date"
            className="auth-input"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>
        {errors.dob && <span className="auth-error-text">{errors.dob}</span>}
      </div>

      <div className="auth-input-group">
        <label className="auth-input-label" htmlFor="create-password">
          Password <span className="auth-required-star">*</span>
        </label>
        <div className={`auth-input-wrap ${errors.password ? 'auth-input-wrap-error' : ''}`}>
          <FontAwesomeIcon icon={faLock} className="auth-input-icon" />
          <input
            id="create-password"
            type={showPassword ? 'text' : 'password'}
            className="auth-input"
            placeholder="Create a password"
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
        <FontAwesomeIcon icon={faUserPlus} /> Submit
      </button>
    </form>
  )
}

export default StudentCreateForm
