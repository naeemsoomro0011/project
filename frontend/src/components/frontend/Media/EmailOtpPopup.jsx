import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShieldHalved, faXmark, faCircleCheck, faRotateRight } from '@fortawesome/free-solid-svg-icons'

/**
 * Generic "confirm this email change with a code" popup.
 *
 * Used everywhere an email address is being changed across Titan Portal:
 * - A Student / Trainer / Sub Admin / Super Admin changing their OWN email.
 * - A Super Admin (or Sub Admin) changing a Trainer's / Sub Admin's email
 *   on their behalf.
 *
 * The parent is responsible for the actual API calls (they differ by role
 * / self vs admin-initiated) - this component just drives the two-step UX:
 * send code -> enter code -> done.
 *
 * Props:
 *  - show: boolean
 *  - newEmail: string - the email being confirmed (shown for context)
 *  - subjectLabel: string - e.g. "your", "this trainer's", "this Sub Admin's"
 *  - onRequest: async () => { maskedEmail } - triggers sending the code
 *  - onVerify: async (otp) => void - confirms the code; throw on failure
 *  - onDone: () => void - called after the user closes the success screen
 *  - onClose: () => void - called when the popup is dismissed early
 */
function EmailOtpPopup({ show, newEmail, subjectLabel = 'your', onRequest, onVerify, onDone, onClose }) {
  const [phase, setPhase] = useState('sending') // 'sending' | 'verify' | 'done'
  const [otp, setOtp] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  // Sends the confirmation code. Defined as a plain async function
  // (function declaration, so it's hoisted) and always called from inside
  // an effect or an event handler - never invoked synchronously at the top
  // level of the effect body itself.
  async function sendCode(cancelledRef, { resetToSending = false } = {}) {
    if (resetToSending) {
      setPhase('sending')
      setOtp('')
    }
    setError('')
    try {
      const res = await onRequest()
      if (cancelledRef?.current) return
      setMaskedEmail(res?.maskedEmail || '')
      setPhase('verify')
    } catch (err) {
      if (cancelledRef?.current) return
      setError(err.message || 'Could not send the confirmation code.')
      setPhase('verify')
    }
  }

  useEffect(() => {
    if (!show) return
    const cancelledRef = { current: false }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the initial "send code" request on open
    sendCode(cancelledRef, { resetToSending: true })
    return () => { cancelledRef.current = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  if (!show) return null

  const handleResend = async () => {
    setResending(true)
    await sendCode()
    setResending(false)
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit code.')
      return
    }
    setLoading(true)
    try {
      await onVerify(otp.trim())
      setPhase('done')
    } catch (err) {
      setError(err.message || 'Invalid or expired code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="generic-popup-overlay">
      <div className="generic-popup-card">
        <button className="generic-popup-close" onClick={onClose} aria-label="Close">
          <FontAwesomeIcon icon={faXmark} />
        </button>

        {phase === 'sending' && (
          <>
            <div className="generic-popup-icon-wrap">
              <FontAwesomeIcon icon={faShieldHalved} className="generic-popup-icon" />
            </div>
            <h3 className="generic-popup-title">Sending Confirmation Code…</h3>
            <p className="generic-popup-text">Please wait a moment.</p>
          </>
        )}

        {phase === 'verify' && (
          <>
            <div className="generic-popup-icon-wrap">
              <FontAwesomeIcon icon={faShieldHalved} className="generic-popup-icon" />
            </div>
            <h3 className="generic-popup-title">Confirm Email Change</h3>
            <p className="generic-popup-text">
              A 6-digit code was sent to {subjectLabel} current email{maskedEmail ? ` (${maskedEmail})` : ''}.
              Enter it below to confirm changing the email to <strong>{newEmail}</strong>. It expires in 10 minutes.
            </p>

            {error && (
              <div className="auth-error-banner">
                <span>{error}</span>
              </div>
            )}

            <form className="generic-popup-form" onSubmit={handleVerify} noValidate>
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="ec-otp">6-digit code</label>
                <div className="auth-input-wrap">
                  <FontAwesomeIcon icon={faShieldHalved} className="auth-input-icon" />
                  <input
                    id="ec-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="auth-input"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" className="generic-popup-btn" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Confirming...' : 'Confirm Email Change'}
              </button>
              <button
                type="button"
                className="generic-popup-btn-outline"
                style={{ width: '100%', marginTop: 10 }}
                onClick={handleResend}
                disabled={resending}
              >
                <FontAwesomeIcon icon={faRotateRight} spin={resending} /> {resending ? 'Resending...' : 'Resend Code'}
              </button>
            </form>
          </>
        )}

        {phase === 'done' && (
          <>
            <div className="generic-popup-icon-wrap">
              <FontAwesomeIcon icon={faCircleCheck} className="generic-popup-icon" />
            </div>
            <h3 className="generic-popup-title">Email Updated</h3>
            <p className="generic-popup-text">
              The email has been changed to <strong>{newEmail}</strong> successfully.
            </p>
            <button className="generic-popup-btn" onClick={onDone}>Okay</button>
          </>
        )}
      </div>
    </div>
  )
}

export default EmailOtpPopup
