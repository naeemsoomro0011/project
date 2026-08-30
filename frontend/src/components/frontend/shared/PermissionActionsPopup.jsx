import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faShieldHalved, faCircleCheck } from '@fortawesome/free-solid-svg-icons'

// A focused, single-module popup: Super Admin picks exactly which of
// READ / WRITE / UPDATE / EXPORT (whichever the module supports) a Sub
// Admin is allowed to have. Nothing here changes until "Save" is pressed -
// so clicking a module never silently flips permissions on its own anymore.
//
// This popup is always opened from *inside* the Edit/Add Sub Admin card,
// which has its own open/close animation on `transform`. In CSS, any
// ancestor with a `transform` becomes the containing block for descendant
// `position: fixed` elements - so without a portal, this popup would be
// boxed inside that card instead of centered on the real viewport (it
// would render squashed near the top of the card instead of centered on
// screen). Rendering into document.body via a portal sidesteps that
// entirely, the same way it would need to for any popup nested inside
// another popup.
function PermissionActionsPopup({ permission, initialActions, onClose, onSave }) {
  const [selected, setSelected] = useState(() => new Set(initialActions || []))

  if (!permission) return null

  const toggle = (action) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(action)) next.delete(action)
      else next.add(action)
      return next
    })
  }

  const handleSave = () => {
    onSave(permission.key, Array.from(selected))
    onClose()
  }

  return createPortal(
    <div className="generic-popup-overlay">
      <div className="generic-popup-card permission-actions-popup-card">
        <button className="generic-popup-close" onClick={onClose} aria-label="Close">
          <FontAwesomeIcon icon={faXmark} />
        </button>
        <div className="generic-popup-icon-wrap">
          <FontAwesomeIcon icon={faShieldHalved} className="generic-popup-icon" />
        </div>
        <h3 className="generic-popup-title">{permission.label}</h3>
        <p className="generic-popup-text">
          Choose exactly what this Sub Admin can do in this module. Nothing is granted unless you check it below.
        </p>

        <div className="permission-actions-popup-list">
          {permission.actions.map((action) => {
            const checked = selected.has(action)
            return (
              <button
                type="button"
                key={action}
                className={`permission-actions-popup-item ${checked ? 'permission-actions-popup-item-checked' : ''}`}
                onClick={() => toggle(action)}
              >
                <span className={`permission-actions-popup-checkbox ${checked ? 'permission-actions-popup-checkbox-on' : ''}`}>
                  {checked && <FontAwesomeIcon icon={faCircleCheck} />}
                </span>
                <span className="permission-actions-popup-item-label">{action}</span>
              </button>
            )
          })}
        </div>

        <div className="generic-popup-btn-row">
          <button className="generic-popup-btn-outline" onClick={onClose}>Cancel</button>
          <button className="generic-popup-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default PermissionActionsPopup
