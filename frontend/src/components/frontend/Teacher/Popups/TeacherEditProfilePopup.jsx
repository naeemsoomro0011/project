import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faUserPen, faImage, faSpinner, faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../api/client.js'
import EmailOtpPopup from '../../Media/EmailOtpPopup.jsx'

function TeacherEditProfilePopup({ show, info, onClose, onSave }) {
  const [form, setForm] = useState({
    name: info.name, phone: info.phone, email: info.email, bio: info.bio || '',
    designation: info.designation || '', photo: info.photo || '',
    linkUrl: info.socialLinks?.[0]?.url || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showEmailOtp, setShowEmailOtp] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  if (!show) return null

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const { url } = await api.uploadImage(file)
      setForm((f) => ({ ...f, photo: url }))
    } catch (err) {
      setError(err.message || 'Photo upload failed.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      // Email always goes through a separate OTP-confirmed step below - a
      // code has to be confirmed on the current email before it changes.
      const updated = await api.put('/teachers/me/profile', {
        name: form.name,
        phone: form.phone,
        bio: form.bio,
        designation: form.designation,
        photo: form.photo,
        socialLinks: form.linkUrl ? [{ platform: 'Link', url: form.linkUrl }] : [],
      })
      onSave(updated)

      const trimmedEmail = form.email.trim().toLowerCase()
      if (trimmedEmail && trimmedEmail !== info.email.toLowerCase()) {
        setPendingEmail(trimmedEmail)
        setShowEmailOtp(true)
        return
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  const refreshAfterEmailChange = async () => {
    try {
      const { user } = await api.get('/auth/me')
      onSave(user)
    } catch {
      // Non-fatal - the parent already has the other saved fields.
    }
    setShowEmailOtp(false)
    onClose()
  }

  return (
    <div className="generic-popup-overlay">
      <div className="edit-profile-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faUserPen} /> Edit Profile
          </span>
          <button className="generic-popup-close" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="auth-input-group">
          <label className="auth-input-label">Name</label>
          <div className="auth-input-wrap"><input className="auth-input" value={form.name} onChange={handleChange('name')} /></div>
        </div>
        <div className="auth-input-group">
          <label className="auth-input-label">Number</label>
          <div className="auth-input-wrap"><input className="auth-input" value={form.phone} onChange={handleChange('phone')} /></div>
        </div>
        <div className="auth-input-group">
          <label className="auth-input-label">Email</label>
          <div className="auth-input-wrap"><input className="auth-input" value={form.email} onChange={handleChange('email')} /></div>
        </div>
        <div className="auth-input-group">
          <label className="auth-input-label">Designation</label>
          <div className="auth-input-wrap"><input className="auth-input" placeholder="Full Stack Web Developer" value={form.designation} onChange={handleChange('designation')} /></div>
        </div>
        <div className="auth-input-group">
          <label className="auth-input-label">Social Link</label>
          <div className="auth-input-wrap">
            <input className="auth-input" placeholder="https://linkedin.com/in/your-profile" value={form.linkUrl} onChange={handleChange('linkUrl')} />
          </div>
        </div>
        <div className="auth-input-group">
          <label className="auth-input-label">Bio</label>
          <textarea className="feedback-textarea" rows={3} value={form.bio} onChange={handleChange('bio')} placeholder="Tell students a little about yourself"></textarea>
        </div>
        <div className="auth-input-group">
          <label className="auth-input-label">Photo</label>
          <div className="edit-profile-photo-row">
            <label className="feedback-add-image-btn assignment-attach-btn">
              <FontAwesomeIcon icon={uploadingPhoto ? faSpinner : faImage} spin={uploadingPhoto} />
              {uploadingPhoto ? 'Uploading...' : form.photo ? 'Photo selected — change?' : 'Choose Photo'}
              <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
            </label>
            <button
              type="button"
              className="photo-reset-btn"
              disabled={!form.photo || uploadingPhoto}
              onClick={() => setForm((f) => ({ ...f, photo: '' }))}
            >
              <FontAwesomeIcon icon={faRotateLeft} /> Use Default Photo
            </button>
          </div>
        </div>

        <div className="feedback-confirm-btn-row">
          <button className="generic-popup-btn-outline" onClick={onClose}>Back</button>
          <button className="generic-popup-btn" disabled={saving || uploadingPhoto} onClick={handleSave}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <EmailOtpPopup
        show={showEmailOtp}
        newEmail={pendingEmail}
        subjectLabel="your"
        onRequest={() => api.post('/auth/email-change/request', { newEmail: pendingEmail })}
        onVerify={(otp) => api.post('/auth/email-change/verify', { otp })}
        onDone={refreshAfterEmailChange}
        onClose={() => setShowEmailOtp(false)}
      />
    </div>
  )
}

export default TeacherEditProfilePopup
