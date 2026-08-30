import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faUserPen, faImage, faSpinner, faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../../api/client.js'
import { useAuth } from '../../../../../context/useAuth.js'
import EmailOtpPopup from '../../../Media/EmailOtpPopup.jsx'

function EditSuperAdminProfilePopup({ onClose, onSaved }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    country: user?.country || '', photo: user?.photo || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showEmailOtp, setShowEmailOtp] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

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
      // Email always goes through a separate OTP-confirmed step below.
      const { email, ...rest } = form
      const updated = await api.put('/superadmin/me/profile', rest)
      onSaved(updated)

      const trimmedEmail = email.trim().toLowerCase()
      if (trimmedEmail && trimmedEmail !== (user?.email || '').toLowerCase()) {
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
      const { user: refreshed } = await api.get('/auth/me')
      onSaved(refreshed)
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
          <button type="button" className="generic-popup-close" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="edit-profile-grid">
          <div className="auth-input-group">
            <label className="auth-input-label">Name</label>
            <div className="auth-input-wrap"><input className="auth-input" value={form.name} onChange={set('name')} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Email</label>
            <div className="auth-input-wrap"><input type="email" className="auth-input" value={form.email} onChange={set('email')} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Phone</label>
            <div className="auth-input-wrap"><input className="auth-input" value={form.phone} onChange={set('phone')} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Country</label>
            <div className="auth-input-wrap"><input className="auth-input" value={form.country} onChange={set('country')} /></div>
          </div>
          <div className="auth-input-group edit-profile-grid-full">
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
        </div>

        <p className="subadmin-role-hint">Changing your email requires confirming a code sent to your current email first.</p>

        <div className="feedback-confirm-btn-row">
          <button type="button" className="generic-popup-btn-outline" onClick={onClose}>Back</button>
          <button type="button" className="generic-popup-btn" onClick={handleSave} disabled={saving || uploadingPhoto}>
            {saving ? 'Saving...' : 'Save Changes'}
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

export default EditSuperAdminProfilePopup
