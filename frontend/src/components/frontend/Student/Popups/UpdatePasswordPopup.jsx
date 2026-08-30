import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faLock, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../api/client.js'

function UpdatePasswordPopup({ show, onClose }) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!show) return null

  const handleClose = () => {
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSaved(false)
    onClose()
  }

  const canApply = oldPassword && newPassword && confirmPassword

  const handleApply = async () => {
    setError('')
    if (newPassword !== confirmPassword) return setError('New passwords do not match.')
    if (newPassword.length < 6) return setError('New password must be at least 6 characters.')
    setLoading(true)
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword })
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Could not change password.')
    } finally {
      setLoading(false)
    }
  }

  if (saved) {
    return (
      <div className="generic-popup-overlay">
        <div className="generic-popup-card">
          <div className="generic-popup-icon-wrap">
            <FontAwesomeIcon icon={faCircleCheck} className="generic-popup-icon" />
          </div>
          <h3 className="generic-popup-title">Password Updated</h3>
          <p className="generic-popup-text">Your password has been changed. Use it next time you log in.</p>
          <button className="generic-popup-btn" onClick={handleClose}>Okay</button>
        </div>
      </div>
    )
  }

  return (
    <div className="generic-popup-overlay">
      <div className="assignment-submit-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faLock} /> Update Password
          </span>
          <button className="generic-popup-close" onClick={handleClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="auth-input-group">
          <label className="auth-input-label">Old Password</label>
          <div className="auth-input-wrap">
            <input type="password" className="auth-input" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
          </div>
        </div>
        <div className="auth-input-group">
          <label className="auth-input-label">New Password</label>
          <div className="auth-input-wrap">
            <input type="password" className="auth-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
        </div>
        <div className="auth-input-group">
          <label className="auth-input-label">Confirm Password</label>
          <div className="auth-input-wrap">
            <input type="password" className="auth-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </div>

        <div className="feedback-confirm-btn-row">
          <button className="generic-popup-btn-outline" onClick={handleClose}>Back</button>
          <button className="generic-popup-btn" disabled={!canApply || loading} onClick={handleApply}>
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpdatePasswordPopup
