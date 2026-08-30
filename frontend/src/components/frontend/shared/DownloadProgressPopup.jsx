import { useEffect, useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCloudArrowDown, faCircleCheck } from '@fortawesome/free-solid-svg-icons'

// Reusable "premium" progress popup for any file download/export (Excel
// export, PDF record, ID card, etc). Pass an async `run` function that
// performs the actual download - this component only owns the animated
// progress UI and success/error states around it.
//
// Rendered only while the parent keeps it mounted (e.g. `{show && <DownloadProgressPopup .../>}`),
// so every open is a fresh instance - no manual state-reset effect needed.
function DownloadProgressPopup({ title = 'Preparing your file...', successTitle = 'Downloaded Successfully!', run, onClose }) {
  const [percent, setPercent] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  // Guards against the download firing twice - React 18 StrictMode (dev only)
  // intentionally mounts/runs effects twice, which would otherwise trigger
  // two real file downloads (export/PDF) for a single click.
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    // Smooth animated progress while the real request is in flight - most
    // of these files generate near-instantly server-side, so a literal
    // byte-progress readout would jump straight to 100% and not feel like
    // a real premium loader.
    const tick = setInterval(() => {
      setPercent((p) => (p < 90 ? p + Math.random() * 12 : p))
    }, 150)

    Promise.resolve()
      .then(run)
      .then(() => {
        clearInterval(tick)
        setPercent(100)
        setTimeout(() => setDone(true), 300)
      })
      .catch((err) => {
        clearInterval(tick)
        setError(err.message || 'Download failed.')
      })

    return () => clearInterval(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="generic-popup-overlay">
      <div className="generic-popup-card">
        {error ? (
          <>
            <div className="generic-popup-icon-wrap generic-popup-icon-wrap-danger">
              <FontAwesomeIcon icon={faCloudArrowDown} className="generic-popup-icon" />
            </div>
            <h3 className="generic-popup-title">Download Failed</h3>
            <div className="auth-error-banner">{error}</div>
            <button className="generic-popup-btn" onClick={onClose}>Close</button>
          </>
        ) : !done ? (
          <>
            <div className="generic-popup-icon-wrap"><FontAwesomeIcon icon={faCloudArrowDown} className="generic-popup-icon" /></div>
            <h3 className="generic-popup-title">{title}</h3>
            <div className="download-progress-track">
              <div className="download-progress-fill" style={{ width: `${Math.min(percent, 100)}%` }}></div>
            </div>
            <p className="download-progress-percent">{Math.round(Math.min(percent, 100))}%</p>
          </>
        ) : (
          <>
            <div className="generic-popup-icon-wrap"><FontAwesomeIcon icon={faCircleCheck} className="generic-popup-icon" /></div>
            <h3 className="generic-popup-title">{successTitle}</h3>
            <button className="generic-popup-btn" onClick={onClose}>Done</button>
          </>
        )}
      </div>
    </div>
  )
}

export default DownloadProgressPopup
