import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'

function SuperAdminTopbar({ breadcrumb = [] }) {
  return (
    <div className="superadmin-topbar">
      <div className="superadmin-topbar-breadcrumb">
        {breadcrumb.map((item, idx) => (
          <span key={item} className="superadmin-topbar-breadcrumb-item">
            {item}
            {idx < breadcrumb.length - 1 && (
              <FontAwesomeIcon icon={faChevronRight} className="superadmin-topbar-breadcrumb-sep" />
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

export default SuperAdminTopbar
