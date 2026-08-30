import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faTriangleExclamation, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../../api/client.js'

// Backend refuses to delete a campus that still has students, trainers or
// sub admins attached (409) - that message is surfaced here so Super Admin
// knows exactly what to reassign/remove first, instead of a generic failure.
function DeleteCampusPopup({ campus, onClose, onDeleted }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!campus) return null

  const handleClose = () => {
    setError('')
    onClose()
  }

  const handleConfirm = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.delete(`/campuses/${campus._id}`)
      onDeleted?.(res.message || `${campus.name} has been deleted.`)
      handleClose()
    } catch (err) {
      setError(err.message || 'Could not delete this campus.')
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
        <h3 className="generic-popup-title">Delete {campus.name}?</h3>
        <p className="generic-popup-text">
          This will permanently remove this campus from {campus.city}. This action can't be undone.
          Are you sure you want to continue?
        </p>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="generic-popup-btn-row">
          <button className="generic-popup-btn-outline" onClick={handleClose} disabled={loading}>Cancel</button>
          <button className="generic-popup-btn-danger" onClick={handleConfirm} disabled={loading}>
            <FontAwesomeIcon icon={faTrashCan} /> {loading ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteCampusPopup
