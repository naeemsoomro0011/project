import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faUserLock, faUserCheck } from '@fortawesome/free-solid-svg-icons'

function SubAdminStatusPopup({ subAdmin, onClose, onConfirm }) {
  if (!subAdmin) return null
  const toActive = subAdmin.status !== 'active'

  return (
    <div className="generic-popup-overlay">
      <div className="assignment-submit-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={toActive ? faUserCheck : faUserLock} /> {toActive ? 'Activate' : 'Suspend'} Account
          </span>
          <button className="generic-popup-close" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <p className="generic-popup-text" style={{ textAlign: 'left' }}>
          {toActive
            ? `${subAdmin.name} will regain access to their Sub Admin account and all of their assigned permissions immediately.`
            : `${subAdmin.name} will lose access to their Sub Admin account right away. Their permissions stay saved, so re-activating later restores them exactly as they were.`}
        </p>

        <div className="feedback-confirm-btn-row">
          <button className="generic-popup-btn-outline" onClick={onClose}>Cancel</button>
          <button
            className={toActive ? 'generic-popup-btn' : 'generic-popup-btn-danger'}
            onClick={() => { onConfirm(subAdmin._id, toActive ? 'active' : 'suspended'); onClose() }}
          >
            {toActive ? 'Activate Account' : 'Suspend Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SubAdminStatusPopup
