import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faTag } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../../api/client.js'

const statusOptions = ['enrolled', 'dropout', 'completed']

function ChangeStatusPopup({ student, onClose, onSave }) {
  const [status, setStatus] = useState(student?.status || 'enrolled')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!student) return null

  const handleSave = async () => {
    setError('')
    setLoading(true)
    try {
      await api.put(`/students/${student._id}/status`, { status })
      onSave()
      onClose()
    } catch (err) {
      setError(err.message || 'Could not update status.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="generic-popup-overlay">
      <div className="assignment-submit-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faTag} /> Change Status — {student.name}
          </span>
          <button className="generic-popup-close" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="auth-input-group">
          <label className="auth-input-label">New Status</label>
          <div className="auth-input-wrap">
            <select className="auth-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {status === 'dropout' && (
          <p className="subadmin-role-hint" style={{ color: '#C53030' }}>
            Marking as dropout blocks this student's login immediately with a notice on their portal.
          </p>
        )}

        <div className="feedback-confirm-btn-row">
          <button className="generic-popup-btn-outline" onClick={onClose}>Back</button>
          <button className="generic-popup-btn" onClick={handleSave} disabled={loading}>
            {loading ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChangeStatusPopup
