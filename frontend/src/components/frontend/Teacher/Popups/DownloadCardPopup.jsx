import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faIdCard, faCircleCheck, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../api/client.js'

// Rendered only while the parent keeps it mounted (e.g. `{show && <DownloadCardPopup .../>}`),
// so every time it opens it's a fresh instance - no manual state-reset effect needed.
function DownloadCardPopup({ teacherId, filename, onClose }) {
  const [percent, setPercent] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  // Guards against the download firing twice - React 18 StrictMode (dev only)
  // intentionally mounts/runs effects twice, which would otherwise trigger
  // two real file downloads for a single click.
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    // Smooth animated progress bar while the real PDF request is in flight -
    // the file itself is tiny so a literal byte-progress readout would jump
    // straight to 100% and not feel like the "premium" loader that was asked for.
    const tick = setInterval(() => {
      setPercent((p) => (p < 90 ? p + Math.random() * 12 : p))
    }, 150)

    api.download(`/pdf/teacher/${teacherId}`, filename)
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
  }, [teacherId, filename])

  return (
    <div className="generic-popup-overlay">
      <div className="generic-popup-card">
        {error ? (
          <>
            <div className="generic-popup-icon-wrap"><FontAwesomeIcon icon={faIdCard} className="generic-popup-icon" /></div>
            <h3 className="generic-popup-title">Download Failed</h3>
            <div className="auth-error-banner">{error}</div>
            <button className="generic-popup-btn" onClick={onClose}>Close</button>
          </>
        ) : !done ? (
          <>
            <div className="generic-popup-icon-wrap"><FontAwesomeIcon icon={faIdCard} className="generic-popup-icon" /></div>
            <h3 className="generic-popup-title">Preparing your ID card...</h3>
            <div className="download-progress-track">
              <div className="download-progress-fill" style={{ width: `${Math.min(percent, 100)}%` }}></div>
            </div>
            <p className="download-progress-percent">{Math.round(Math.min(percent, 100))}%</p>
          </>
        ) : (
          <>
            <div className="generic-popup-icon-wrap"><FontAwesomeIcon icon={faCircleCheck} className="generic-popup-icon" /></div>
            <h3 className="generic-popup-title">Card Downloaded Successfully!</h3>
            <button className="generic-popup-btn" onClick={onClose}>
              <FontAwesomeIcon icon={faArrowLeft} /> Back
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default DownloadCardPopup
