import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faTriangleExclamation, faChalkboardUser, faUserSlash, faUserGroup } from '@fortawesome/free-solid-svg-icons'
import { genders } from '../../../shared/permissionsConfig.js'
import { api } from '../../../../../api/client.js'
import { useAlert } from '../../../../../context/AlertContext.jsx'

const emptyReplacement = { name: '', email: '', phone: '', gender: '', password: '', hourlyRate: '' }

// First shows a choice: just Remove the trainer (their batches are left
// unassigned, to be picked up later), or Replace them (collects a new
// trainer's details, exactly like before - every batch they teach moves to
// the new trainer immediately). Which one happens is entirely up to the
// admin, not forced.
function DeleteTrainerPopup({ trainer, onClose, onDeleted }) {
  const { confirmAction, success, error: alertError } = useAlert()
  const [step, setStep] = useState('choice') // 'choice' | 'replace'
  const [replacement, setReplacement] = useState(emptyReplacement)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!trainer) return null

  const set = (field) => (e) => setReplacement({ ...replacement, [field]: e.target.value })

  const handleClose = () => {
    setStep('choice')
    setReplacement(emptyReplacement)
    setError('')
    onClose()
  }

  const handleRemoveOnly = async () => {
    const ok = await confirmAction({
      title: `Remove ${trainer.name}?`,
      message: `${trainer.name} will be removed and their batches will be left without a trainer until you assign a new one. This can't be undone.`,
      confirmText: 'Yes, remove',
    })
    if (!ok) return

    setLoading(true)
    try {
      const res = await api.delete(`/teachers/${trainer._id}`, { mode: 'remove' })
      success(res.message, 'Trainer Removed')
      onDeleted?.()
      handleClose()
    } catch (err) {
      alertError(err.message || 'Could not remove this trainer.')
    } finally {
      setLoading(false)
    }
  }

  const handleReplace = async () => {
    setError('')
    if (!replacement.name.trim() || !replacement.email.trim() || !replacement.phone.trim() || !replacement.password) {
      setError('The replacement trainer needs a name, email, phone and password.')
      return
    }
    setLoading(true)
    try {
      const res = await api.delete(`/teachers/${trainer._id}`, { mode: 'replace', replacement })
      success(res.message, 'Trainer Replaced')
      onDeleted?.()
      handleClose()
    } catch (err) {
      setError(err.message || 'Could not remove this trainer.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'choice') {
    return (
      <div className="generic-popup-overlay">
        <div className="assignment-submit-card">
          <div className="assignment-view-top">
            <span className="assignment-view-top-heading">
              <FontAwesomeIcon icon={faTriangleExclamation} /> Remove {trainer.name}?
            </span>
            <button className="generic-popup-close" onClick={handleClose} aria-label="Close">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          <p className="generic-popup-text" style={{ textAlign: 'left' }}>
            Choose how you'd like to remove {trainer.name}. Their current batches will either be
            left unassigned, or moved straight to a new trainer - whichever you pick below.
          </p>

          <div className="feedback-confirm-btn-row" style={{ flexDirection: 'column', gap: 10 }}>
            <button type="button" className="generic-popup-btn-danger" onClick={handleRemoveOnly} disabled={loading} style={{ width: '100%' }}>
              <FontAwesomeIcon icon={faUserSlash} /> Just Remove
            </button>
            <button type="button" className="auth-btn-primary" onClick={() => setStep('replace')} disabled={loading} style={{ width: '100%' }}>
              <FontAwesomeIcon icon={faUserGroup} /> Remove &amp; Replace
            </button>
            <button className="generic-popup-btn-outline" onClick={handleClose} style={{ width: '100%' }}>Cancel</button>
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
            <FontAwesomeIcon icon={faTriangleExclamation} /> Remove {trainer.name}?
          </span>
          <button className="generic-popup-close" onClick={handleClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <p className="generic-popup-text" style={{ textAlign: 'left' }}>
          All of {trainer.name}'s current batches need a trainer. Enter a replacement below —
          every batch they teach will move to the new trainer immediately.
        </p>

        {error && <div className="auth-error-banner">{error}</div>}

        <h4 className="student-form-section-heading">
          <FontAwesomeIcon icon={faChalkboardUser} /> Replacement Trainer
        </h4>

        <div className="edit-profile-grid">
          <div className="auth-input-group">
            <label className="auth-input-label">Full Name</label>
            <div className="auth-input-wrap"><input className="auth-input" value={replacement.name} onChange={set('name')} autoComplete="off" /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Email</label>
            <div className="auth-input-wrap"><input type="email" className="auth-input" value={replacement.email} onChange={set('email')} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Phone</label>
            <div className="auth-input-wrap"><input className="auth-input" value={replacement.phone} onChange={set('phone')} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Gender</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={replacement.gender} onChange={set('gender')}>
                <option value="">Select</option>
                {genders.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Temporary Password</label>
            <div className="auth-input-wrap"><input type="password" className="auth-input" value={replacement.password} onChange={set('password')} autoComplete="new-password" /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Hourly Rate (Rs.)</label>
            <div className="auth-input-wrap"><input type="number" min="0" className="auth-input" value={replacement.hourlyRate} onChange={set('hourlyRate')} /></div>
          </div>
        </div>

        <div className="feedback-confirm-btn-row">
          <button className="generic-popup-btn-outline" onClick={() => setStep('choice')}>Back</button>
          <button className="generic-popup-btn-danger" onClick={handleReplace} disabled={loading}>
            {loading ? 'Removing...' : 'Remove & Replace'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteTrainerPopup
