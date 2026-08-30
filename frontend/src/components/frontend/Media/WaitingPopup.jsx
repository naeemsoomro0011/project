/**
 * WaitingPopup
 * Shows a rotating loader + a progress bar that fills over `durationMs`
 * using a pure CSS animation (no React state needed). When the bar
 * finishes filling, `onComplete` fires (e.g. to navigate).
 *
 * Props:
 *  - show: boolean - whether the popup is visible
 *  - label: string - text shown above the loader (e.g. "Logging in...")
 *  - durationMs: number - how long the progress bar takes to fill
 *  - onComplete: function - called once the bar finishes filling
 */
function WaitingPopup({ show, label = 'Waiting...', durationMs = 5000, onComplete }) {
  if (!show) return null

  return (
    <div className="waiting-popup-overlay">
      <div className="waiting-popup-card">
        <div className="waiting-popup-spinner"></div>
        <p className="waiting-popup-label">{label}</p>
        <div className="waiting-popup-track">
          <div
            className="waiting-popup-fill"
            style={{ animationDuration: `${durationMs}ms` }}
            onAnimationEnd={() => onComplete && onComplete()}
          ></div>
        </div>
      </div>
    </div>
  )
}

export default WaitingPopup
