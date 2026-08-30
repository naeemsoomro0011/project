import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBug, faLightbulb, faCommentDots, faXmark, faImage,
  faPaperPlane, faCircleCheck, faSpinner,
} from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../api/client.js'

const feedbackTypes = [
  { id: 'Bug', label: 'Bug', icon: faBug },
  { id: 'Idea', label: 'Idea', icon: faLightbulb },
  { id: 'Other', label: 'Other', icon: faCommentDots },
]

// step: 'form' -> 'confirm' -> 'thanks'
function FeedbackPopup({ show, onClose }) {
  const [step, setStep] = useState('form')
  const [type, setType] = useState('Bug')
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageName, setImageName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  if (!show) return null

  const handleClose = () => {
    setStep('form')
    setType('Bug')
    setText('')
    setImageUrl('')
    setImageName('')
    setError('')
    onClose()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const { url } = await api.uploadImage(file)
      setImageUrl(url)
      setImageName(file.name)
    } catch (err) {
      setError(err.message || 'Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const canSend = text.trim().length > 0

  const handleConfirm = async () => {
    setSending(true)
    setError('')
    try {
      await api.post('/feedback', { type, message: text, image: imageUrl })
      setStep('thanks')
    } catch (err) {
      setError(err.message || 'Could not send feedback.')
      setStep('form')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="generic-popup-overlay">
      {step === 'form' && (
        <div className="feedback-popup-card">
          <button className="generic-popup-close" onClick={handleClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
          <h3 className="feedback-popup-title">Share Your Feedback</h3>
          <p className="feedback-popup-subtext">
            Let us know if we could do anything to improve your learning experience. Your input
            genuinely helps us make the course better for everyone.
          </p>

          <p className="feedback-popup-label">Select Type</p>
          <div className="feedback-type-row">
            {feedbackTypes.map((ft) => (
              <button
                key={ft.id}
                type="button"
                className={`feedback-type-btn ${type === ft.id ? 'feedback-type-btn-active' : ''}`}
                onClick={() => setType(ft.id)}
              >
                <FontAwesomeIcon icon={ft.icon} /> {ft.label}
              </button>
            ))}
          </div>

          <textarea
            className="feedback-textarea"
            placeholder="Your Feedback"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>

          <p className="feedback-popup-label">Reference Image</p>
          <div className="feedback-file-row">
            <span className="feedback-file-name">
              {imageName || 'No file chosen'}
            </span>
            <label className="feedback-add-image-btn">
              <FontAwesomeIcon icon={uploading ? faSpinner : faImage} spin={uploading} /> {uploading ? 'Uploading...' : '+Add Image'}
              <input type="file" accept="image/*" hidden onChange={handleFileChange} />
            </label>
          </div>

          {error && <div className="auth-error-banner">{error}</div>}

          <button
            type="button"
            className="feedback-send-btn"
            disabled={!canSend || uploading}
            onClick={() => canSend && setStep('confirm')}
          >
            <FontAwesomeIcon icon={faPaperPlane} /> Send Feedback
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="generic-popup-card">
          <h3 className="generic-popup-title">Confirm Your Feedback</h3>
          <p className="feedback-confirm-line">
            <strong>Type:</strong> {feedbackTypes.find((f) => f.id === type)?.label}
          </p>
          <p className="feedback-confirm-line"><strong>Message:</strong> {text}</p>
          <p className="feedback-confirm-line">
            <strong>Image:</strong> {imageName || 'None'}
          </p>
          {error && <div className="auth-error-banner">{error}</div>}
          <div className="feedback-confirm-btn-row">
            <button className="generic-popup-btn-outline" onClick={() => setStep('form')}>
              Back
            </button>
            <button className="generic-popup-btn" disabled={sending} onClick={handleConfirm}>
              {sending ? 'Sending...' : 'Confirm'}
            </button>
          </div>
        </div>
      )}

      {step === 'thanks' && (
        <div className="generic-popup-card">
          <div className="generic-popup-icon-wrap">
            <FontAwesomeIcon icon={faCircleCheck} className="generic-popup-icon" />
          </div>
          <h3 className="generic-popup-title">Thank You!</h3>
          <p className="generic-popup-text">
            Your feedback means a lot to us. We'll review it and use it to make your learning
            experience even better.
          </p>
          <button className="generic-popup-btn" onClick={handleClose}>
            Back to Page
          </button>
        </div>
      )}
    </div>
  )
}

export default FeedbackPopup
