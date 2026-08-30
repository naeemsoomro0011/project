import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faChalkboardUser, faCircleCheck, faImage, faSpinner, faIdBadge } from '@fortawesome/free-solid-svg-icons'
import { genders } from '../../../shared/permissionsConfig.js'
import { api } from '../../../../../api/client.js'
import EmailOtpPopup from '../../../Media/EmailOtpPopup.jsx'

const emptyForm = {
  campus: '', employeeId: '', name: '', gender: '', designation: '', bio: '', phone: '',
  email: '', hourlyRate: '', password: '', photo: '',
}

// Same as Sub Admin's Add Trainer, plus a Campus selector since Super Admin
// can add a trainer to any campus, not just one.
// Doubles as the Edit Trainer popup: pass `initial` with the trainer record
// to edit it in place, or leave it out to add a new one.
function AddTrainerPopup({ show, initial, onClose, onSaved }) {
  const [form, setForm] = useState(() => (initial
    ? {
      campus: initial.campus?._id || initial.campus || '',
      employeeId: initial.employeeId || '', name: initial.name, gender: initial.gender,
      designation: initial.designation || '', bio: initial.bio || '', phone: initial.phone,
      email: initial.email, hourlyRate: initial.hourlyRate || '', password: '', photo: initial.photo || '',
    }
    : emptyForm))
  const [campuses, setCampuses] = useState([])
  const [created, setCreated] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showEmailOtp, setShowEmailOtp] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  useEffect(() => {
    if (show) api.get('/campuses').then(setCampuses).catch(() => {})
  }, [show])

  if (!show) return null

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    setError('')
    try {
      const { url } = await api.uploadImage(file)
      setForm((f) => ({ ...f, photo: url }))
    } catch (err) {
      setError(err.message || 'Photo upload failed.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleClose = () => {
    setForm(emptyForm)
    setCreated(null)
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.campus || !form.employeeId.trim() || !form.name.trim() || !form.email.trim() || !form.phone.trim() || (!initial && !form.password)) {
      setError(`Campus, Trainer ID, name, email, phone${initial ? '' : ' and password'} are required.`)
      return
    }
    setLoading(true)
    try {
      const trimmedEmail = form.email.trim().toLowerCase()
      const basePayload = {
        employeeId: form.employeeId.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        designation: form.designation,
        bio: form.bio,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : 0,
        photo: form.photo,
        ...(form.password ? { password: form.password } : {}),
      }

      if (!initial) {
        // New trainer - email is set directly at creation, no OTP needed yet.
        const teacher = await api.post('/teachers', { ...basePayload, email: trimmedEmail, campus: form.campus })
        setCreated(teacher)
        return
      }

      // Editing an existing trainer - email never travels in this call.
      // If it changed, it's confirmed separately via OTP sent to the
      // trainer's CURRENT email before it actually applies.
      const teacher = await api.put(`/teachers/${initial._id}`, basePayload)
      if (trimmedEmail && trimmedEmail !== initial.email.toLowerCase()) {
        setPendingEmail(trimmedEmail)
        setShowEmailOtp(true)
        return
      }
      setCreated(teacher)
    } catch (err) {
      setError(err.message || 'Could not save trainer.')
    } finally {
      setLoading(false)
    }
  }

  const refreshAfterEmailChange = async () => {
    setLoading(true)
    try {
      const teacher = await api.get(`/teachers/${initial._id}`)
      setCreated(teacher)
    } catch (err) {
      setError(err.message || 'Email was changed, but the latest details could not be reloaded.')
    } finally {
      setLoading(false)
      setShowEmailOtp(false)
    }
  }

  if (created) {
    return (
      <div className="generic-popup-overlay">
        <div className="generic-popup-card">
          <div className="generic-popup-icon-wrap">
            <FontAwesomeIcon icon={faCircleCheck} className="generic-popup-icon" />
          </div>
          <h3 className="generic-popup-title">{initial ? 'Trainer Updated!' : 'Trainer Added!'}</h3>
          <p className="generic-popup-text">
            {initial
              ? `${created.name}'s details have been saved.`
              : <>{created.name} can now log in with their email and password. Their Trainer ID is <strong>{created.employeeId}</strong>.</>}
          </p>
          <button className="generic-popup-btn" onClick={() => { onSaved?.(); handleClose() }}>Okay</button>
        </div>
      </div>
    )
  }

  if (showEmailOtp) {
    return (
      <EmailOtpPopup
        show={showEmailOtp}
        newEmail={pendingEmail}
        subjectLabel="this trainer's"
        onRequest={() => api.post(`/teachers/${initial._id}/email-change/request`, { newEmail: pendingEmail })}
        onVerify={(otp) => api.post(`/teachers/${initial._id}/email-change/verify`, { otp })}
        onDone={refreshAfterEmailChange}
        onClose={() => setShowEmailOtp(false)}
      />
    )
  }

  return (
    <div className="generic-popup-overlay">
      <div className="edit-profile-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faChalkboardUser} /> {initial ? 'Edit Trainer' : 'Add Trainer'}
          </span>
          <button className="generic-popup-close" onClick={handleClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="edit-profile-grid">
          <div className="auth-input-group edit-profile-grid-full">
            <label className="auth-input-label">Campus</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={form.campus} onChange={set('campus')} disabled={!!initial}>
                <option value="">Select</option>
                {campuses.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.city})</option>)}
              </select>
            </div>
            {initial && <span className="subadmin-role-hint">Campus can't be changed after creation.</span>}
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label"><FontAwesomeIcon icon={faIdBadge} /> Trainer ID</label>
            <div className="auth-input-wrap"><input className="auth-input" placeholder="e.g. TR-001" value={form.employeeId} onChange={set('employeeId')} /></div>
            <span className="subadmin-role-hint">Must be unique — this is what identifies the trainer now, not their phone number.</span>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Name</label>
            <div className="auth-input-wrap"><input className="auth-input" value={form.name} onChange={set('name')} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Gender</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={form.gender} onChange={set('gender')}>
                <option value="">Select</option>
                {genders.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Phone</label>
            <div className="auth-input-wrap"><input className="auth-input" value={form.phone} onChange={set('phone')} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Email</label>
            <div className="auth-input-wrap"><input type="email" className="auth-input" value={form.email} onChange={set('email')} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Designation</label>
            <div className="auth-input-wrap"><input className="auth-input" placeholder="Full Stack Web Developer" value={form.designation} onChange={set('designation')} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Hourly Rate (Rs.)</label>
            <div className="auth-input-wrap"><input type="number" min="0" className="auth-input" value={form.hourlyRate} onChange={set('hourlyRate')} /></div>
          </div>
          <div className="auth-input-group edit-profile-grid-full">
            <label className="auth-input-label">{initial ? 'Reset Password (optional)' : 'Temporary Password'}</label>
            <div className="auth-input-wrap"><input type="password" className="auth-input" placeholder={initial ? 'Leave blank to keep current' : ''} value={form.password} onChange={set('password')} /></div>
          </div>
          <div className="auth-input-group edit-profile-grid-full">
            <label className="auth-input-label">Bio</label>
            <textarea className="feedback-textarea" rows={2} value={form.bio} onChange={set('bio')}></textarea>
          </div>
          <div className="auth-input-group edit-profile-grid-full">
            <label className="auth-input-label">Photo</label>
            <label className="feedback-add-image-btn assignment-attach-btn">
              <FontAwesomeIcon icon={uploadingPhoto ? faSpinner : faImage} spin={uploadingPhoto} />
              {uploadingPhoto ? 'Uploading...' : form.photo ? 'Photo selected — change?' : 'Choose Photo'}
              <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
            </label>
          </div>
        </div>

        {!initial && (
          <p className="subadmin-role-hint">
            The selected campus needs at least one Slot created before a Trainer can be added to it.
          </p>
        )}

        <div className="feedback-confirm-btn-row">
          <button className="generic-popup-btn-outline" onClick={handleClose}>Back</button>
          <button className="generic-popup-btn" onClick={handleSubmit} disabled={loading || uploadingPhoto}>
            {loading ? 'Saving...' : initial ? 'Save Changes' : 'Add Trainer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddTrainerPopup
