import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faCommentDots } from '@fortawesome/free-solid-svg-icons'

function StudentTopbar({ breadcrumb = [], onFeedbackClick }) {
  return (
    <div className="student-topbar">
      <div className="student-topbar-breadcrumb">
        {breadcrumb.map((item, idx) => (
          <span key={item} className="student-topbar-breadcrumb-item">
            {item}
            {idx < breadcrumb.length - 1 && (
              <FontAwesomeIcon icon={faChevronRight} className="student-topbar-breadcrumb-sep" />
            )}
          </span>
        ))}
      </div>

      <button type="button" className="student-feedback-btn" onClick={onFeedbackClick}>
        <FontAwesomeIcon icon={faCommentDots} /> Feedback
      </button>
    </div>
  )
}

export default StudentTopbar
