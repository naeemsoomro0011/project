import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faChartLine } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../api/client.js'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function CompareProgressPopup({ show, slot, onClose }) {
  const [others, setOthers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!show || !slot) return
    api.get(`/slots/compare/${slot.course._id}?excludeSlot=${slot._id}`).then(setOthers).catch((err) => setError(err.message || 'Could not load comparison.'))
  }, [show, slot])

  if (!show) return null

  return (
    <div className="generic-popup-overlay">
      <div className="compare-progress-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faChartLine} /> Other Batches of {slot.course?.name}
          </span>
          <button className="generic-popup-close" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="compare-progress-row">
          {others.map((t) => {
            const percent = t.total ? Math.round((t.covered / t.total) * 100) : 0
            return (
              <div key={t._id} className="compare-progress-box">
                <div className="compare-progress-box-top">
                  <span className="compare-progress-name">{t.teacherName}</span>
                  <span className="compare-progress-percent">{percent}%</span>
                </div>
                <p className="compare-progress-slot">{t.campusName} — {t.batchLabel}</p>
                <p className="compare-progress-slot">{t.scheduleDays.map((d) => WEEKDAY_LABELS[d]).join('/')} {t.startTime}-{t.endTime}</p>
                <p className="compare-progress-covered-label">Covered Topics</p>
                <div className="compare-progress-covered-row">
                  <span>{t.covered}/{t.total}</span>
                </div>
                <div className="course-card-progress-track">
                  <div className="course-card-progress-fill" style={{ width: `${percent}%` }}></div>
                </div>
              </div>
            )
          })}

          {others.length === 0 && !error && (
            <p className="attendance-no-record">No other batches of this course yet — you're the only one teaching it.</p>
          )}
        </div>

        <div className="assignment-view-footer">
          <button type="button" className="generic-popup-btn" onClick={onClose}>
            Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default CompareProgressPopup
