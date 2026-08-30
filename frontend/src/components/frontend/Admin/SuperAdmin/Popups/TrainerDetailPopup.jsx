import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faChalkboardUser } from '@fortawesome/free-solid-svg-icons'
import Avatar from '../../../Media/Avatar.jsx'

function TrainerDetailPopup({ trainer, onClose }) {
  if (!trainer) return null

  return (
    <div className="generic-popup-overlay">
      <div className="assignment-view-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faChalkboardUser} /> Trainer Details
          </span>
          <button className="generic-popup-close" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="trainer-detail-top">
          <Avatar name={trainer.name} photoUrl={trainer.photo} className="trainer-detail-avatar" />
          <div>
            <h4 className="trainer-detail-name">{trainer.name}</h4>
            <p className="trainer-detail-urdu">{trainer.designation}</p>
          </div>
        </div>

        <div className="student-detail-info-grid">
          <p><strong>Email:</strong> {trainer.email}</p>
          <p><strong>Phone:</strong> {trainer.phone}</p>
          <p><strong>Employee ID:</strong> {trainer.employeeId}</p>
          <p><strong>Hourly Rate:</strong> Rs. {trainer.hourlyRate}</p>
          <p><strong>Campus:</strong> {trainer.campus?.name}, {trainer.campus?.city}</p>
          <p><strong>Status:</strong> {trainer.status}</p>
        </div>

        <p className="assignment-view-label">Bio</p>
        <div className="assignment-view-notes-box">{trainer.bio || 'No bio added yet.'}</div>

        <div className="assignment-view-footer">
          <button type="button" className="generic-popup-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default TrainerDetailPopup
