import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faUpload, faPaperclip, faCircleCheck, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../api/client.js'

// mode: 'submit' or 'edit'
function AssignmentSubmitPopup({ assignment, mode = 'submit', onClose, onDone }) {
  const existing = assignment?.mySubmission
  const [link, setLink] = useState(mode === 'edit' ? existing?.link || '' : '')
  const [imageUrl, setImageUrl] = useState(mode === 'edit' ? existing?.image || '' : '')
  const [fileName, setFileName] = useState('')
  const [description, setDescription] = useState(mode === 'edit' ? existing?.notes || '' : '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!assignment) return null

  const canSubmit = link.trim().length > 0 && description.trim().length > 0

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const { url } = await api.uploadImage(file)
      setImageUrl(url)
      setFileName(file.name)
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setError('')
    try {
      await api.post(`/assignments/${assignment._id}/submit`, { link, notes: description, image: imageUrl })
      setDone(true)
    } catch (err) {
      setError(err.message || 'Could not submit.')
    }
  }

  if (done) {
    return (
      <div className="generic-popup-overlay">
        <div className="waiting-popup-card">
          <FontAwesomeIcon icon={faCircleCheck} className="assignment-done-icon" />
          <p className="waiting-popup-label">{mode === 'edit' ? 'Updated!' : 'Submitted!'}</p>
          <div className="waiting-popup-track">
            <div
              className="waiting-popup-fill"
              style={{ animationDuration: '1000ms' }}
              onAnimationEnd={() => onDone && onDone()}
            ></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="generic-popup-overlay">
      <div className="assignment-submit-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faPaperclip} /> {mode === 'edit' ? 'Edit Assignment' : 'Submit Assignment'}
          </span>
          <button className="generic-popup-close" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="auth-input-group">
          <label className="auth-input-label">GitHub / Project Link</label>
          <div className="auth-input-wrap">
            <input
              type="text"
              className="auth-input"
              placeholder="https://github.com/your-repo"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
        </div>

        <div className="auth-input-group">
          <label className="auth-input-label">Attachment</label>
          <label className="feedback-add-image-btn assignment-attach-btn">
            <FontAwesomeIcon icon={uploading ? faSpinner : faUpload} spin={uploading} /> {uploading ? 'Uploading...' : fileName || (imageUrl ? 'Image attached — change?' : 'Choose Image')}
            <input type="file" accept="image/*" hidden onChange={handleFileChange} />
          </label>
        </div>

        <div className="auth-input-group">
          <label className="auth-input-label">Description</label>
          <textarea
            className="feedback-textarea"
            rows={3}
            placeholder="Write a short description of your submission"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <div className="feedback-confirm-btn-row">
          <button className="generic-popup-btn-outline" onClick={onClose}>
            Back
          </button>
          <button className="generic-popup-btn" disabled={!canSubmit || uploading} onClick={handleSubmit}>
            {mode === 'edit' ? 'Save' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssignmentSubmitPopup
