import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faLockOpen, faLock, faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import SuperAdminTopbar from '../Layout/SuperAdminTopbar.jsx'
import AddSlotPopup from '../Popups/AddSlotPopup.jsx'
import EditSlotPopup from '../Popups/EditSlotPopup.jsx'
import { api } from '../../../../../api/client.js'
import { useAlert } from '../../../../../context/AlertContext.jsx'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// All-campus version of Sub Admin's Administration page - same slot cards
// and actions, plus a Campus filter since results span every campus, and
// Super Admin can always open/close registration regardless of who locked it.
function Administration() {
  const { confirmAction, success } = useAlert()
  const [slots, setSlots] = useState([])
  const [campuses, setCampuses] = useState([])
  const [campusFilter, setCampusFilter] = useState('')
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(() => {
    const params = campusFilter ? `?campus=${campusFilter}` : ''
    api.get(`/slots${params}`).then(setSlots).catch((err) => setError(err.message || 'Could not load slots.'))
  }, [campusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { api.get('/campuses').then(setCampuses).catch(() => {}) }, [])

  const toggleRegistration = async (slot) => {
    setError('')
    try {
      await api.put(`/slots/${slot._id}/registration`)
      load()
    } catch (err) {
      setError(err.message || 'Could not change registration.')
    }
  }

  const handleDelete = async (slot) => {
    const ok = await confirmAction({
      title: 'Delete this batch?',
      message: `Delete ${slot.batchLabel} (${slot.course?.name})? Enrolled students will be blocked from logging in until reassigned. This can't be undone.`,
      confirmText: 'Yes, delete it',
    })
    if (!ok) return
    try {
      await api.delete(`/slots/${slot._id}`)
      success(`${slot.batchLabel} has been deleted.`, 'Batch Deleted')
      load()
    } catch (err) {
      setError(err.message || 'Could not delete slot.')
    }
  }

  return (
    <div className="superadmin-page">
      <SuperAdminTopbar breadcrumb={['Home', 'Administration']} />

      <div className="course-tab-header-row">
        <h4 className="course-tab-heading">Slots (Class Groups) — {slots.length}</h4>
        <button type="button" className="course-tab-new-btn" onClick={() => setShowAdd(true)}>
          <FontAwesomeIcon icon={faPlus} /> Add Slot
        </button>
      </div>

      <select className="auth-input subadmin-toolbar-btn" style={{ maxWidth: 220, marginBottom: 14 }} value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)}>
        <option value="">All Campuses</option>
        {campuses.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.city})</option>)}
      </select>

      {error && <div className="auth-error-banner">{error}</div>}

      <div className="slots-grid">
        {slots.map((slot) => (
          <div key={slot._id} className="slot-card">
            <div className="slot-card-header">
              <h5 className="slot-card-course">{slot.course?.name} — {slot.batchLabel}</h5>
              <span className={`slot-card-registration-chip ${slot.registrationOpen ? 'slot-open' : 'slot-closed'}`}>
                <FontAwesomeIcon icon={slot.registrationOpen ? faLockOpen : faLock} /> {slot.registrationOpen ? 'Open' : 'Closed'}
              </span>
            </div>
            <p className="slot-card-line"><strong>Schedule:</strong> {slot.scheduleDays.map((d) => WEEKDAY_LABELS[d]).join('/')} {slot.startTime}-{slot.endTime}</p>
            <p className="slot-card-line"><strong>Trainer:</strong> {slot.teacher?.name || 'Unassigned'}</p>
            <p className="slot-card-line"><strong>Campus:</strong> {slot.campus?.name} ({slot.campus?.city})</p>
            <p className="slot-card-line"><strong>Type:</strong> {slot.classType} &nbsp;|&nbsp; <strong>Gender:</strong> {slot.gender}</p>
            <p className="slot-card-line"><strong>Start Date:</strong> {new Date(slot.startDate).toLocaleDateString()}{slot.endDate ? ` – ${new Date(slot.endDate).toLocaleDateString()}` : ''}</p>

            <div className="slot-card-seats-row">
              <span>Seats: {slot.seatsUsed}/{slot.capacity}</span>
              <div className="course-card-progress-track slot-card-seats-track">
                <div
                  className="course-card-progress-fill"
                  style={{ width: `${Math.min(100, Math.round((slot.seatsUsed / slot.capacity) * 100))}%` }}
                ></div>
              </div>
            </div>

            <div className="slot-card-actions-row">
              <button type="button" className="slot-toggle-btn" onClick={() => toggleRegistration(slot)}>
                <FontAwesomeIcon icon={slot.registrationOpen ? faLock : faLockOpen} />
                {slot.registrationOpen ? ' Close' : ' Open'}
              </button>
              <button type="button" className="slot-toggle-btn" onClick={() => setEditing(slot)}>
                <FontAwesomeIcon icon={faPenToSquare} /> Edit
              </button>
              <button type="button" className="slot-toggle-btn slot-toggle-btn-danger" onClick={() => handleDelete(slot)}>
                <FontAwesomeIcon icon={faTrashCan} /> Delete
              </button>
            </div>
          </div>
        ))}

        {slots.length === 0 && <p className="attendance-no-record">No slots yet — add your first batch above.</p>}
      </div>

      <AddSlotPopup show={showAdd} onClose={() => setShowAdd(false)} onCreated={load} />
      {editing && <EditSlotPopup slot={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  )
}

export default Administration
