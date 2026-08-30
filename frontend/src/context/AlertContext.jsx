import { createContext, useCallback, useContext, useRef, useState } from 'react'
import PremiumAlertHost from '../components/frontend/shared/PremiumAlertHost.jsx'

const AlertContext = createContext(null)

let idSeq = 1

// Central "sweet alert" style system for the whole portal - one provider at
// the root renders every toast/confirm/dialog on top of everything else, so
// any page or popup can just call useAlert() instead of window.alert /
// window.confirm or a one-off inline banner.
export function AlertProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [dialog, setDialog] = useState(null) // { type: 'confirm'|'info', ...opts, resolve }
  const resolverRef = useRef(null)

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback((opts) => {
    const id = idSeq++
    const toast = {
      id,
      type: opts.type || 'info', // success | error | warning | info
      title: opts.title || '',
      message: opts.message || '',
      duration: opts.duration ?? 4200,
    }
    setToasts((prev) => [...prev, toast])
    return id
  }, [])

  const success = useCallback((message, title = 'Success!') => notify({ type: 'success', title, message }), [notify])
  const error = useCallback((message, title = 'Something went wrong') => notify({ type: 'error', title, message, duration: 5500 }), [notify])
  const warning = useCallback((message, title = 'Heads up') => notify({ type: 'warning', title, message }), [notify])
  const info = useCallback((message, title = 'Info') => notify({ type: 'info', title, message }), [notify])

  // Promise-based confirm dialog - replaces window.confirm(...) with a
  // branded, animated modal. Resolves true/false depending on the button
  // the person taps.
  const confirmAction = useCallback((opts) => {
    const options = typeof opts === 'string' ? { message: opts } : opts
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setDialog({
        title: options.title || 'Please confirm',
        message: options.message || 'Are you sure?',
        confirmText: options.confirmText || 'Yes, continue',
        cancelText: options.cancelText || 'Cancel',
        danger: options.danger !== false, // default true: most confirms here are destructive
      })
    })
  }, [])

  const resolveDialog = useCallback((value) => {
    setDialog(null)
    if (resolverRef.current) {
      resolverRef.current(value)
      resolverRef.current = null
    }
  }, [])

  return (
    <AlertContext.Provider value={{ success, error, warning, info, confirmAction }}>
      {children}
      <PremiumAlertHost
        toasts={toasts}
        onDismissToast={dismissToast}
        dialog={dialog}
        onResolveDialog={resolveDialog}
      />
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const ctx = useContext(AlertContext)
  if (!ctx) {
    // Safe no-op fallback so a stray usage outside the provider never
    // crashes the app - it just quietly falls back to a console log.
    return {
      success: (m) => console.log('[alert:success]', m),
      error: (m) => console.error('[alert:error]', m),
      warning: (m) => console.warn('[alert:warning]', m),
      info: (m) => console.log('[alert:info]', m),
      confirmAction: (opts) => Promise.resolve(window.confirm(typeof opts === 'string' ? opts : opts?.message)),
    }
  }
  return ctx
}
