import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey, faXmark, faEnvelope, faShieldHalved, faLock, faEye, faEyeSlash, faCircleCheck, faUserGroup } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../api/client.js'

// Used for Teacher / Sub Admin / Super Admin only - Students don't get a
// forgot-password option per the spec, so `role` is always one of those three.
function ForgotPasswordPopup({ show, onClose, role }) {
  const [step, setStep] = useState('request') // 'request' | 'need-id' | 'verify' | 'done'
  const [email, setEmail] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [idLabel, setIdLabel] = useState('ID')
  const [accountsFound, setAccountsFound] = useState(0)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!show) return null

  const reset = () => {
    setStep('request')
    setEmail('')
    setEmployeeId('')
    setIdLabel('ID')
    setAccountsFound(0)
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setMaskedEmail('')
    setError('')
    setLoading(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // Fires the actual OTP request to the backend - shared by both the plain
  // email step and the "which account is yours?" step below, since the
  // second one is really just a retry of the same call with employeeId added.
  const requestOtp = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password/request', {
        email: email.trim(),
        role,
        ...(employeeId.trim() ? { employeeId: employeeId.trim() } : {}),
      })
      setMaskedEmail(res.maskedEmail || '')
      setStep('verify')
    } catch (err) {
      if (err.code === 'NEED_EMPLOYEE_ID') {
        setIdLabel(err.idLabel || 'ID')
        setAccountsFound(err.accountsFound || 0)
        setStep('need-id')
        return
      }
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestOtp = (e) => {
    e.preventDefault()
    if (!email.trim()) return setError('Please enter your registered email.')
    requestOtp()
  }

  const handleConfirmId = (e) => {
    e.preventDefault()
    setError('')
    if (!employeeId.trim()) return setError(`Please enter your ${idLabel}.`)
    requestOtp()
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    if (!otp.trim()) return setError('Please enter the 6-digit code.')
    if (newPassword.length < 6) return setError('New password must be at least 6 characters.')
    if (newPassword !== confirmPassword) return setError('Passwords do not match.')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password/verify', {
        email: email.trim(),
        role,
        otp: otp.trim(),
        newPassword,
        ...(employeeId.trim() ? { employeeId: employeeId.trim() } : {}),
      })
      setStep('done')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="generic-popup-overlay">
      <div className="generic-popup-card">
        <button className="generic-popup-close" onClick={handleClose} aria-label="Close">
          <FontAwesomeIcon icon={faXmark} />
        </button>

        {step === 'request' && (
          <>
            <div className="generic-popup-icon-wrap">
              <FontAwesomeIcon icon={faKey} className="generic-popup-icon" />
            </div>
            <h3 className="generic-popup-title">Forgot Password</h3>
            <p className="generic-popup-text">
              Enter your registered email. We'll send a 6-digit verification code to that
              email address so you can securely reset your password.
            </p>

            {error && (
              <div className="auth-error-banner">
                <span>{error}</span>
              </div>
            )}

            <form className="generic-popup-form" onSubmit={handleRequestOtp} noValidate>
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="fp-email">Email</label>
                <div className="auth-input-wrap">
                  <FontAwesomeIcon icon={faEnvelope} className="auth-input-icon" />
                  <input
                    id="fp-email"
                    type="email"
                    className="auth-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="generic-popup-btn" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          </>
        )}

        {step === 'need-id' && (
          <>
            <div className="generic-popup-icon-wrap">
              <FontAwesomeIcon icon={faUserGroup} className="generic-popup-icon" />
            </div>
            <h3 className="generic-popup-title">We Found {accountsFound || 'Multiple'} Accounts</h3>
            <p className="generic-popup-text">
              <strong>{email}</strong> is used by {accountsFound} different accounts. To make sure the
              reset code goes to the right one, please enter your <strong>{idLabel}</strong>.
            </p>

            {error && (
              <div className="auth-error-banner">
                <span>{error}</span>
              </div>
            )}

            <form className="generic-popup-form" onSubmit={handleConfirmId} noValidate>
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="fp-employee-id">{idLabel}</label>
                <div className="auth-input-wrap">
                  <FontAwesomeIcon icon={faKey} className="auth-input-icon" />
                  <input
                    id="fp-employee-id"
                    type="text"
                    className="auth-input"
                    placeholder={role === 'teacher' ? 'e.g. TR-001' : role === 'subadmin' ? 'e.g. SA-001' : 'Your ID'}
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <button type="submit" className="generic-popup-btn" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Checking...' : 'Continue'}
              </button>
              <button
                type="button"
                className="generic-popup-btn-outline"
                style={{ width: '100%', marginTop: 10 }}
                onClick={() => { setStep('request'); setEmployeeId(''); setError('') }}
              >
                Use a different email
              </button>
            </form>
          </>
        )}

        {step === 'verify' && (
          <>
            <div className="generic-popup-icon-wrap">
              <FontAwesomeIcon icon={faShieldHalved} className="generic-popup-icon" />
            </div>
            <h3 className="generic-popup-title">Enter Verification Code</h3>
            <p className="generic-popup-text">
              A 6-digit code was sent to {maskedEmail || 'the email on file'}. It expires in 5 minutes.
            </p>

            {error && (
              <div className="auth-error-banner">
                <span>{error}</span>
              </div>
            )}

            <form className="generic-popup-form" onSubmit={handleVerify} noValidate>
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="fp-otp">6-digit code</label>
                <div className="auth-input-wrap">
                  <FontAwesomeIcon icon={faShieldHalved} className="auth-input-icon" />
                  <input
                    id="fp-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="auth-input"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="fp-new-password">New password</label>
                <div className="auth-input-wrap">
                  <FontAwesomeIcon icon={faLock} className="auth-input-icon" />
                  <input
                    id="fp-new-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    className="auth-eye-icon"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="fp-confirm-password">Confirm new password</label>
                <div className="auth-input-wrap">
                  <FontAwesomeIcon icon={faLock} className="auth-input-icon" />
                  <input
                    id="fp-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="generic-popup-btn" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </>
        )}

        {step === 'done' && (
          <>
            <div className="generic-popup-icon-wrap">
              <FontAwesomeIcon icon={faCircleCheck} className="generic-popup-icon" />
            </div>
            <h3 className="generic-popup-title">Password Updated</h3>
            <p className="generic-popup-text">
              Your password has been changed successfully. You can now log in with your new password.
            </p>
            <button className="generic-popup-btn" onClick={handleClose}>
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPopup
