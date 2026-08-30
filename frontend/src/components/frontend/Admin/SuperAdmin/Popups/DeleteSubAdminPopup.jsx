import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faTriangleExclamation, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../../api/client.js'

// A single, clear confirmation - no replacement Sub Admin required anymore.
// It's entirely Super Admin's call whether a campus keeps a Sub Admin or not;
// they can always add a new one later from this same page.
function DeleteSubAdminPopup({ subAdmin, onClose, onDeleted }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!subAdmin) return null

  const handleClose = () => {
    setError('')
    onClose()
  }

  const handleConfirm = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.delete(`/subadmins/${subAdmin._id}`)
      onDeleted?.(res.message)
      handleClose()
    } catch (err) {
      setError(err.message || 'Could not remove this Sub Admin.')
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
        <div className="generic-popup-icon-wrap generic-popup-icon-wrap-danger">
          <FontAwesomeIcon icon={faTriangleExclamation} className="generic-popup-icon" />
        </div>
        <h3 className="generic-popup-title">Remove {subAdmin.name}?</h3>
        <p className="generic-popup-text">
          This will permanently remove their account and access to {subAdmin.campus?.name || 'their campus'}.
          This action can't be undone. Are you sure you want to continue?
        </p>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="generic-popup-btn-row">
          <button className="generic-popup-btn-outline" onClick={handleClose} disabled={loading}>Cancel</button>
          <button className="generic-popup-btn-danger" onClick={handleConfirm} disabled={loading}>
            <FontAwesomeIcon icon={faTrashCan} /> {loading ? 'Removing...' : 'Yes, Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteSubAdminPopup
