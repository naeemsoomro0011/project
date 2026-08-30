import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faFlag, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../api/client.js'

function RequestCorrectionPopup({ show, onClose }) {
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!show) return null

  const handleClose = () => {
    setDate('')
    setReason('')
    setSent(false)
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    setError('')
    if (!date || !reason.trim()) return setError('Date and reason are both required.')
    setLoading(true)
    try {
      await api.post('/teacher-attendance/requests', { date, reason })
      setSent(true)
    } catch (err) {
      setError(err.message || 'Could not submit request.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="generic-popup-overlay">
        <div className="generic-popup-card">
          <div className="generic-popup-icon-wrap">
            <FontAwesomeIcon icon={faCircleCheck} className="generic-popup-icon" />
          </div>
          <h3 className="generic-popup-title">Request Sent</h3>
          <p className="generic-popup-text">Your Sub Admin will review it and update your attendance if approved.</p>
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
            <FontAwesomeIcon icon={faFlag} /> Attendance Correction Request
          </span>
          <button className="generic-popup-close" onClick={handleClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="auth-input-group">
          <label className="auth-input-label">Date</label>
          <div className="auth-input-wrap"><input type="date" className="auth-input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <div className="auth-input-group">
          <label className="auth-input-label">Reason</label>
          <textarea className="feedback-textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain what needs correcting"></textarea>
        </div>

        <div className="feedback-confirm-btn-row">
          <button className="generic-popup-btn-outline" onClick={handleClose}>Back</button>
          <button className="generic-popup-btn" disabled={loading} onClick={handleSubmit}>
            {loading ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RequestCorrectionPopup
