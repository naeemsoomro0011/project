import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../../api/client.js'

const WEEKDAYS = [
  { value: 0, label: 'Sun' }, { value: 1, label: 'Mon' }, { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' }, { value: 4, label: 'Thu' }, { value: 5, label: 'Fri' }, { value: 6, label: 'Sat' },
]

function EditSlotPopup({ slot, onClose, onSaved }) {
  const [capacity, setCapacity] = useState(slot?.capacity || 0)
  const [scheduleDays, setScheduleDays] = useState(slot?.scheduleDays || [])
  const [startTime, setStartTime] = useState(slot?.startTime || '')
  const [endTime, setEndTime] = useState(slot?.endTime || '')
  const [teacher, setTeacher] = useState(slot?.teacher?._id || '')
  const [trainers, setTrainers] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!slot?.campus?._id) return
    api.get(`/teachers?campus=${slot.campus._id}`).then(setTrainers).catch(() => {})
  }, [slot?.campus?._id])

  if (!slot) return null

  const toggleDay = (day) => {
    setScheduleDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      await api.put(`/slots/${slot._id}`, { capacity: Number(capacity), scheduleDays, startTime, endTime, teacher: teacher || null })
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="generic-popup-overlay">
      <div className="assignment-submit-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faPenToSquare} /> Edit {slot.batchLabel}
          </span>
          <button type="button" className="generic-popup-close" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="auth-input-group">
          <label className="auth-input-label">Trainer</label>
          <div className="auth-input-wrap">
            <select className="auth-input" value={teacher} onChange={(e) => setTeacher(e.target.value)}>
              <option value="">Unassigned</option>
              {trainers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          {!teacher && <span className="subadmin-role-hint">This slot has no trainer assigned yet — pick one when ready.</span>}
        </div>

        <div className="auth-input-group">
          <label className="auth-input-label">Capacity (seats)</label>
          <div className="auth-input-wrap">
            <input type="number" min={slot.seatsUsed || 0} className="auth-input" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
          <span className="subadmin-role-hint">{slot.seatsUsed} seat(s) already used — can't go lower than that.</span>
        </div>

        <div className="auth-input-group">
          <label className="auth-input-label">Class Days</label>
          <div className="subadmin-role-chip-row">
            {WEEKDAYS.map((d) => (
              <button
                type="button"
                key={d.value}
                className={`subadmin-role-chip ${scheduleDays.includes(d.value) ? 'subadmin-role-chip-active' : ''}`}
                onClick={() => toggleDay(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="edit-profile-grid">
          <div className="auth-input-group">
            <label className="auth-input-label">Start Time</label>
            <div className="auth-input-wrap"><input type="time" className="auth-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">End Time</label>
            <div className="auth-input-wrap"><input type="time" className="auth-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
          </div>
        </div>

        <div className="feedback-confirm-btn-row">
          <button type="button" className="generic-popup-btn-outline" onClick={onClose}>Cancel</button>
          <button type="button" className="generic-popup-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditSlotPopup
