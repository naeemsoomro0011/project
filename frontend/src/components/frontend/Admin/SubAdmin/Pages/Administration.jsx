import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faLockOpen, faLock, faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import SubAdminTopbar from '../Layout/SubAdminTopbar.jsx'
import AddSlotPopup from '../Popups/AddSlotPopup.jsx'
import EditSlotPopup from '../Popups/EditSlotPopup.jsx'
import { hasPermission } from '../data/subAdminData.js'
import { api } from '../../../../../api/client.js'
import { useAlert } from '../../../../../context/AlertContext.jsx'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function Administration() {
  const { confirmAction, success } = useAlert()
  const [slots, setSlots] = useState([])
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(() => {
    api.get('/slots').then(setSlots).catch((err) => setError(err.message || 'Could not load slots.'))
  }, [])

  useEffect(() => { load() }, [load])

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
    <div className="subadmin-page">
      <SubAdminTopbar breadcrumb={['Home', 'Administration']} />

      <div className="course-tab-header-row">
        <h4 className="course-tab-heading">Slots (Class Groups)</h4>
        {hasPermission('SLOT', 'WRITE') && (
          <button type="button" className="course-tab-new-btn" onClick={() => setShowAdd(true)}>
            <FontAwesomeIcon icon={faPlus} /> Add Slot
          </button>
        )}
      </div>

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
            <p className="slot-card-line"><strong>Campus:</strong> {slot.campus?.name}</p>
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

            {slot.registrationLockedBySuperAdmin && (
              <p className="subadmin-role-hint" style={{ color: '#C9A227' }}>Super Admin controls this slot's registration.</p>
            )}

            <div className="slot-card-actions-row">
              {hasPermission('SLOT', 'UPDATE') && (
                <button type="button" className="slot-toggle-btn" onClick={() => toggleRegistration(slot)}>
                  <FontAwesomeIcon icon={slot.registrationOpen ? faLock : faLockOpen} />
                  {slot.registrationOpen ? ' Close' : ' Open'}
                </button>
              )}
              {hasPermission('SLOT', 'UPDATE') && (
                <button type="button" className="slot-toggle-btn" onClick={() => setEditing(slot)}>
                  <FontAwesomeIcon icon={faPenToSquare} /> Edit
                </button>
              )}
              {hasPermission('SLOT', 'WRITE') && (
                <button type="button" className="slot-toggle-btn slot-toggle-btn-danger" onClick={() => handleDelete(slot)}>
                  <FontAwesomeIcon icon={faTrashCan} /> Delete
                </button>
              )}
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
