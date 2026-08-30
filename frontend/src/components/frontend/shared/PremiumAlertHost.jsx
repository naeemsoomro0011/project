import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck, faCircleExclamation, faTriangleExclamation, faCircleInfo, faXmark,
} from '@fortawesome/free-solid-svg-icons'

const ICONS = {
  success: faCircleCheck,
  error: faCircleExclamation,
  warning: faTriangleExclamation,
  info: faCircleInfo,
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => clearTimeout(t)
  }, [toast, onDismiss])

  return (
    <div className={`premium-toast premium-toast-${toast.type}`} role="status">
      <span className="premium-toast-icon-wrap">
        <FontAwesomeIcon icon={ICONS[toast.type] || faCircleInfo} />
      </span>
      <div className="premium-toast-body">
        {toast.title && <p className="premium-toast-title">{toast.title}</p>}
        {toast.message && <p className="premium-toast-message">{toast.message}</p>}
      </div>
      <button type="button" className="premium-toast-close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
        <FontAwesomeIcon icon={faXmark} />
      </button>
      <span className="premium-toast-progress" style={{ animationDuration: `${toast.duration}ms` }} />
    </div>
  )
}

function ConfirmDialog({ dialog, onResolve }) {
  if (!dialog) return null
  return (
    <div className="premium-confirm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onResolve(false) }}>
      <div className="premium-confirm-card">
        <span className={`premium-confirm-icon-wrap ${dialog.danger ? 'premium-confirm-icon-wrap-danger' : ''}`}>
          <FontAwesomeIcon icon={dialog.danger ? faTriangleExclamation : faCircleInfo} />
        </span>
        <h3 className="premium-confirm-title">{dialog.title}</h3>
        <p className="premium-confirm-message">{dialog.message}</p>
        <div className="premium-confirm-actions">
          <button type="button" className="premium-confirm-btn premium-confirm-btn-cancel" onClick={() => onResolve(false)}>
            {dialog.cancelText}
          </button>
          <button
            type="button"
            className={`premium-confirm-btn ${dialog.danger ? 'premium-confirm-btn-danger' : 'premium-confirm-btn-primary'}`}
            onClick={() => onResolve(true)}
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Rendered once at the app root via AlertProvider. Uses a portal so it
// always sits above every page's own markup/z-index stack.
function PremiumAlertHost({ toasts, onDismissToast, dialog, onResolveDialog }) {
  return createPortal(
    <>
      <div className="premium-toast-stack">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={onDismissToast} />
        ))}
      </div>
      <ConfirmDialog dialog={dialog} onResolve={onResolveDialog} />
    </>,
    document.body
  )
}

export default PremiumAlertHost
