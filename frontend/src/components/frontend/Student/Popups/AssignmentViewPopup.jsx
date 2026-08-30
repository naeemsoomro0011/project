import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faFileLines, faPaperclip } from '@fortawesome/free-solid-svg-icons'
import { formatDate, formatTime } from '../../Media/dateUtils.js'

function AssignmentViewPopup({ assignment, onClose }) {
  const [enlarged, setEnlarged] = useState(false)
  if (!assignment) return null

  const sub = assignment.mySubmission
  const displayStatus = sub ? (sub.isLate && sub.status === 'Pending' ? 'Late' : sub.status) : 'Not Submitted'

  return (
    <div className="generic-popup-overlay">
      <div className="assignment-view-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faFileLines} /> Assignment Information
          </span>
          <button className="generic-popup-close" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="assignment-view-section">
          <h4 className="assignment-view-title">{assignment.title}</h4>
          <div className="assignment-view-meta-row">
            <span>Due: {formatDate(new Date(assignment.dueDate))}{assignment.dueTime ? ` at ${formatTime(assignment.dueTime)}` : ''}</span>
            <span className={`assignment-grade-chip assignment-grade-${displayStatus.replace(/\s+/g, '-').toLowerCase()}`}>
              {displayStatus}
            </span>
          </div>
          <p className="assignment-view-description">{assignment.description}</p>
        </div>

        {sub && sub.submittedAt && (
          <div className="assignment-view-section">
            <h5 className="assignment-view-subheading">
              <FontAwesomeIcon icon={faPaperclip} /> Submission Details
            </h5>
            <p className="assignment-view-label">Submitted on</p>
            <p className="assignment-view-value">{new Date(sub.submittedAt).toLocaleString()}</p>

            <p className="assignment-view-label">Submission Link</p>
            <div className="assignment-view-link-box">{sub.link || '-'}</div>

            {sub.image && (
              <img
                src={sub.image}
                alt="Submission attachment"
                className="assignment-view-image"
                onClick={() => setEnlarged(true)}
              />
            )}

            <p className="assignment-view-label">Submission Notes</p>
            <div className="assignment-view-notes-box">{sub.notes || '-'}</div>
          </div>
        )}

        <div className="assignment-view-footer">
          <button type="button" className="generic-popup-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {enlarged && sub?.image && (
        <div className="image-enlarge-overlay" onClick={() => setEnlarged(false)}>
          <img src={sub.image} alt="Submission enlarged" className="image-enlarge-img" />
        </div>
      )}
    </div>
  )
}

export default AssignmentViewPopup
