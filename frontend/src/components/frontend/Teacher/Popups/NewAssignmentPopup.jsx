import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faFileCirclePlus, faCircleCheck, faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../api/client.js'

const types = ['Homework', 'Project', 'Lab Task', 'Reading', 'No Type']

// Passing `initial` (an existing assignment) switches this into edit mode -
// same form, PUTs to /assignments/:id instead of POSTing a new one.
function NewAssignmentPopup({ show, slotId, initial = null, onClose, onCreated }) {
  const isEdit = Boolean(initial)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('Homework')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [description, setDescription] = useState('')
  const [created, setCreated] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initial) {
      setTitle(initial.title || '')
      setType(initial.type || 'Homework')
      setDueDate(initial.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 10) : '')
      setDueTime(initial.dueTime || '')
      setDescription(initial.description || '')
    }
  }, [initial])

  if (!show) return null

  const canCreate = title.trim() && dueDate.trim() && description.trim()

  const handleClose = () => {
    setTitle('')
    setType('Homework')
    setDueDate('')
    setDueTime('')
    setDescription('')
    setCreated(false)
    setError('')
    onClose()
  }

  const handleCreate = async () => {
    setError('')
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/assignments/${initial._id}`, { title, type, dueDate, dueTime, description })
        onCreated?.()
        handleClose()
      } else {
        await api.post('/assignments', { slot: slotId, title, type, dueDate, dueTime, description })
        setCreated(true)
      }
    } catch (err) {
      setError(err.message || `Could not ${isEdit ? 'update' : 'create'} assignment.`)
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
          <h3 className="generic-popup-title">Created!</h3>
          <p className="generic-popup-text">
            Your assignment is now visible to every student in this batch.
          </p>
          <div className="feedback-confirm-btn-row">
            <button className="generic-popup-btn" onClick={() => { onCreated?.(); handleClose() }}>Done</button>
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
            <FontAwesomeIcon icon={isEdit ? faPenToSquare : faFileCirclePlus} /> {isEdit ? 'Edit Assignment' : 'New Assignment'}
          </span>
          <button className="generic-popup-close" onClick={handleClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="auth-input-group">
          <label className="auth-input-label">Assignment Name</label>
          <div className="auth-input-wrap">
            <input className="auth-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. CSS Grid Test" />
          </div>
        </div>

        <div className="edit-profile-grid">
          <div className="auth-input-group">
            <label className="auth-input-label">Type</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={type} onChange={(e) => setType(e.target.value)}>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Due Date</label>
            <div className="auth-input-wrap">
              <input type="date" className="auth-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Due Time</label>
            <div className="auth-input-wrap">
              <input type="time" className="auth-input" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="auth-input-group">
          <label className="auth-input-label">Description</label>
          <textarea
            className="feedback-textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what students need to submit"
          ></textarea>
        </div>

        <div className="feedback-confirm-btn-row">
          <button className="generic-popup-btn-outline" onClick={handleClose}>Back</button>
          <button className="generic-popup-btn" disabled={!canCreate || loading} onClick={handleCreate}>
            {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewAssignmentPopup
