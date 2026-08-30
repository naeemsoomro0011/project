import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faLayerGroup, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { genders } from '../../../shared/permissionsConfig.js'
import { api } from '../../../../../api/client.js'

const classTypes = ['Regular', 'Kids', 'Vocational']
const WEEKDAYS = [
  { value: 0, label: 'Sun' }, { value: 1, label: 'Mon' }, { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' }, { value: 4, label: 'Thu' }, { value: 5, label: 'Fri' }, { value: 6, label: 'Sat' },
]

const emptyForm = {
  course: '', trainer: '', scheduleDays: [], startTime: '', endTime: '', classType: 'Regular',
  gender: '', startDate: '', endDate: '', capacity: '', whatsappLink: '',
}

// Course is the only real selector here - City/Campus were removed because
// a Sub Admin can only ever create slots at their own campus (the backend
// assigns it automatically), which is also what fixed this popup's old
// "Create Slot won't click" bug: it was the same fragile City -> Campus ->
// Course cascade used elsewhere in the app, now gone entirely.
function AddSlotPopup({ show, onClose, onCreated }) {
  const [form, setForm] = useState(emptyForm)
  const [courses, setCourses] = useState([])
  const [trainers, setTrainers] = useState([])
  const [created, setCreated] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!show) return
    api.get('/courses').then(setCourses).catch(() => {})
    api.get('/teachers').then(setTrainers).catch(() => {})
  }, [show])

  if (!show) return null

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      scheduleDays: f.scheduleDays.includes(day) ? f.scheduleDays.filter((d) => d !== day) : [...f.scheduleDays, day],
    }))
  }

  const handleClose = () => {
    setForm(emptyForm)
    setCreated(null)
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    setError('')
    const missing = []
    if (!form.course) missing.push('Course')
    if (form.scheduleDays.length === 0) missing.push('at least one Class Day')
    if (!form.startTime) missing.push('Start Time')
    if (!form.endTime) missing.push('End Time')
    if (!form.startDate) missing.push('Start Date')
    if (!form.capacity) missing.push('Capacity')
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(', ')}. (Scroll down inside this box if you don't see a field.)`)
      return
    }
    setLoading(true)
    try {
      const { trainer, ...rest } = form
      const slot = await api.post('/slots', {
        ...rest,
        teacher: trainer,
        capacity: Number(form.capacity),
      })
      setCreated(slot)
    } catch (err) {
      setError(err.message || 'Could not create slot.')
    } finally {
      setLoading(false)
    }
  }

  if (created) {
    return (
      <div className="generic-popup-overlay">
        <div className="generic-popup-card">
          <div className="generic-popup-icon-wrap">
            <FontAwesomeIcon icon={faCircleCheck} className="generic-popup-icon" />
          </div>
          <h3 className="generic-popup-title">Slot Created!</h3>
          <p className="generic-popup-text">
            {created.batchLabel} has been added with registration open.
          </p>
          <button className="generic-popup-btn" onClick={() => { onCreated?.(); handleClose() }}>Okay</button>
        </div>
      </div>
    )
  }

  return (
    <div className="generic-popup-overlay">
      <div className="edit-profile-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faLayerGroup} /> Add Slot
          </span>
          <button type="button" className="generic-popup-close" onClick={handleClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="edit-profile-grid">
          <div className="auth-input-group">
            <label className="auth-input-label">Course</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={form.course} onChange={set('course')}>
                <option value="">Select</option>
                {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <span className="subadmin-role-hint">Batch number (Batch-1, Batch-2...) is assigned automatically for this course.</span>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Trainer (optional)</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={form.trainer} onChange={set('trainer')}>
                <option value="">Unassigned — assign later</option>
                {trainers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="auth-input-group edit-profile-grid-full">
            <label className="auth-input-label">Class Days</label>
            <div className="subadmin-role-chip-row">
              {WEEKDAYS.map((d) => (
                <button
                  type="button"
                  key={d.value}
                  className={`subadmin-role-chip ${form.scheduleDays.includes(d.value) ? 'subadmin-role-chip-active' : ''}`}
                  onClick={() => toggleDay(d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-input-label">Start Time</label>
            <div className="auth-input-wrap">
              <input type="time" className="auth-input" value={form.startTime} onChange={set('startTime')} />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">End Time</label>
            <div className="auth-input-wrap">
              <input type="time" className="auth-input" value={form.endTime} onChange={set('endTime')} />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-input-label">Class Type</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={form.classType} onChange={set('classType')}>
                {classTypes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Gender</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={form.gender} onChange={set('gender')}>
                <option value="">Mixed</option>
                {genders.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Start Date</label>
            <div className="auth-input-wrap">
              <input type="date" className="auth-input" value={form.startDate} onChange={set('startDate')} />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">End Date</label>
            <div className="auth-input-wrap">
              <input type="date" className="auth-input" value={form.endDate} onChange={set('endDate')} />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Capacity (seats)</label>
            <div className="auth-input-wrap">
              <input type="number" min="1" className="auth-input" value={form.capacity} onChange={set('capacity')} />
            </div>
          </div>
          <div className="auth-input-group edit-profile-grid-full">
            <label className="auth-input-label">WhatsApp Group Link</label>
            <div className="auth-input-wrap">
              <input className="auth-input" placeholder="https://chat.whatsapp.com/..." value={form.whatsappLink} onChange={set('whatsappLink')} />
            </div>
          </div>
        </div>

        <div className="feedback-confirm-btn-row">
          <button type="button" className="generic-popup-btn-outline" onClick={handleClose}>Back</button>
          <button type="button" className="generic-popup-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Slot'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddSlotPopup
