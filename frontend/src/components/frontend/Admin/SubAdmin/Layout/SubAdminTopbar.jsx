import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'

function SubAdminTopbar({ breadcrumb = [] }) {
  return (
    <div className="subadmin-topbar">
      <div className="subadmin-topbar-breadcrumb">
        {breadcrumb.map((item, idx) => (
          <span key={item} className="subadmin-topbar-breadcrumb-item">
            {item}
            {idx < breadcrumb.length - 1 && (
              <FontAwesomeIcon icon={faChevronRight} className="subadmin-topbar-breadcrumb-sep" />
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

export default SubAdminTopbar
