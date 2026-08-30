import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faSchool, faCircleCheck, faUserTie } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../../api/client.js'

const emptyForm = { name: '', city: '', address: '', capacityOfStudents: '' }

// After a campus is created, Super Admin gets the option to immediately add
// its Sub Admin (a campus should never sit without one) - onCreated() bubbles
// the new campus up so the parent page can open SubAdminPopup pre-scoped to it.
// Passing `editing` (a campus object) switches the popup into edit mode instead.
function CampusPopup({ show, onClose, onCreated, onUpdated, existingCities = [], editing = null }) {
  const isEdit = Boolean(editing)
  const [form, setForm] = useState(emptyForm)
  const [created, setCreated] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name || '',
        city: editing.city || '',
        address: editing.address || '',
        capacityOfStudents: editing.capacityOfStudents ?? '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [editing])

  if (!show) return null

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleClose = () => {
    setForm(emptyForm)
    setCreated(null)
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.name.trim() || !form.city.trim()) {
      setError('Campus name and city are required.')
      return
    }
    setLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        capacityOfStudents: form.capacityOfStudents ? Number(form.capacityOfStudents) : 0,
      }
      if (isEdit) {
        const campus = await api.put(`/campuses/${editing._id}`, payload)
        onUpdated?.(campus)
        handleClose()
      } else {
        const campus = await api.post('/campuses', payload)
        setCreated(campus)
      }
    } catch (err) {
      setError(err.message || `Could not ${isEdit ? 'update' : 'create'} campus.`)
    } finally {
      setLoading(false)
    }
  }

  if (created && !isEdit) {
    return (
      <div className="generic-popup-overlay">
        <div className="generic-popup-card">
          <div className="generic-popup-icon-wrap">
            <FontAwesomeIcon icon={faCircleCheck} className="generic-popup-icon" />
          </div>
          <h3 className="generic-popup-title">Campus Added!</h3>
          <p className="generic-popup-text">
            {created.name} has been added to {created.city}. Every campus needs a Sub Admin —
            add one now, or skip and do it later from the Sub Admins page.
          </p>
          <div className="generic-popup-btn-row">
            <button className="generic-popup-btn-outline" onClick={handleClose}>Skip for now</button>
            <button className="generic-popup-btn" onClick={() => { onCreated?.(created); handleClose() }}>
              <FontAwesomeIcon icon={faUserTie} /> Add Sub Admin
            </button>
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
            <FontAwesomeIcon icon={faSchool} /> {isEdit ? 'Edit Campus' : 'Add Campus'}
          </span>
          <button className="generic-popup-close" onClick={handleClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="auth-input-group">
          <label className="auth-input-label">Campus Name</label>
          <div className="auth-input-wrap"><input className="auth-input" placeholder="Titan Multan Campus" value={form.name} onChange={set('name')} /></div>
        </div>
        <div className="auth-input-group">
          <label className="auth-input-label">City</label>
          <div className="auth-input-wrap">
            <input
              className="auth-input"
              list="campus-city-list"
              placeholder="Select or type a new city"
              value={form.city}
              onChange={set('city')}
            />
            <datalist id="campus-city-list">
              {existingCities.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>
        <div className="auth-input-group">
          <label className="auth-input-label">Address</label>
          <div className="auth-input-wrap"><input className="auth-input" value={form.address} onChange={set('address')} /></div>
        </div>
        <div className="auth-input-group">
          <label className="auth-input-label">Capacity (students)</label>
          <div className="auth-input-wrap"><input type="number" min="0" className="auth-input" value={form.capacityOfStudents} onChange={set('capacityOfStudents')} /></div>
        </div>

        <div className="feedback-confirm-btn-row">
          <button className="generic-popup-btn-outline" onClick={handleClose}>Back</button>
          <button className="generic-popup-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Campus')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CampusPopup
