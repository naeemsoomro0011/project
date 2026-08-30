import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'

function TeacherTopbar({ breadcrumb = [] }) {
  return (
    <div className="teacher-topbar">
      <div className="teacher-topbar-breadcrumb">
        {breadcrumb.map((item, idx) => (
          <span key={item} className="teacher-topbar-breadcrumb-item">
            {item}
            {idx < breadcrumb.length - 1 && (
              <FontAwesomeIcon icon={faChevronRight} className="teacher-topbar-breadcrumb-sep" />
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

export default TeacherTopbar
