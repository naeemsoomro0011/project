import { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faUserPen, faImage, faSpinner, faChalkboardUser, faIdCard } from '@fortawesome/free-solid-svg-icons'
import { genders, qualifications, computerLevels } from '../../../shared/permissionsConfig.js'
import { api } from '../../../../../api/client.js'

function EditStudentPopup({ student, onClose, onSave }) {
  const [form, setForm] = useState({
    name: student.name,
    fatherName: student.fatherName,
    cnic: student.cnic || '',
    fatherCnic: student.fatherCnic || '',
    email: student.email,
    phone: student.phone,
    address: student.address,
    gender: student.gender,
    lastQualification: student.lastQualification,
    computerLevel: student.computerLevel,
    photo: student.photo || '',
    slot: student.slot?._id || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // --- Trainer reassignment -------------------------------------------
  // A trainer isn't a field on the student directly - it's whoever teaches
  // the batch (Slot) the student is sitting in. So "change the trainer"
  // really means "move this student into a batch taught by someone else",
  // for the same course at the same campus. We pull every batch for that
  // course + campus, group them by trainer, and let the admin pick a
  // trainer (and, only if that trainer runs more than one batch here, the
  // specific batch too).
  const [campusSlots, setCampusSlots] = useState([])
  useEffect(() => {
    if (!student.campus?._id) return
    api.get(`/slots?campus=${student.campus._id}`).then(setCampusSlots).catch(() => {})
  }, [student.campus?._id])

  const courseSlots = useMemo(
    () => campusSlots.filter((s) => s.course?._id === student.course?._id),
    [campusSlots, student.course?._id]
  )
  const trainers = useMemo(() => {
    const map = new Map()
    courseSlots.forEach((s) => {
      if (s.teacher?._id) map.set(s.teacher._id, s.teacher)
    })
    return [...map.values()]
  }, [courseSlots])

  const selectedSlot = courseSlots.find((s) => s._id === form.slot)
  const selectedTrainerId = selectedSlot?.teacher?._id || ''
  const batchesForSelectedTrainer = courseSlots.filter((s) => s.teacher?._id === selectedTrainerId)

  const handleTrainerChange = (e) => {
    const teacherId = e.target.value
    const matches = courseSlots.filter((s) => s.teacher?._id === teacherId)
    setForm((f) => ({ ...f, slot: matches[0]?._id || '' }))
  }

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
    if (form.cnic && form.cnic.replace(/\D/g, '').length < 13) {
      setError('CNIC looks too short.')
      return
    }
    setSaving(true)
    try {
      const updated = await api.put(`/students/${student._id}`, form)
      onSave(updated)
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="generic-popup-overlay">
      <div className="edit-profile-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faUserPen} /> Edit Student
          </span>
          <button className="generic-popup-close" onClick={onClose} aria-label="Close">
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
            <label className="auth-input-label">Father Name</label>
            <div className="auth-input-wrap"><input className="auth-input" value={form.fatherName} onChange={set('fatherName')} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label"><FontAwesomeIcon icon={faIdCard} /> CNIC</label>
            <div className="auth-input-wrap"><input className="auth-input" placeholder="42101-1234567-1" value={form.cnic} onChange={set('cnic')} /></div>
            <span className="subadmin-role-hint">Student logs in with this CNIC — changing it changes their login ID too.</span>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label"><FontAwesomeIcon icon={faIdCard} /> Father's CNIC</label>
            <div className="auth-input-wrap"><input className="auth-input" value={form.fatherCnic} onChange={set('fatherCnic')} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Email</label>
            <div className="auth-input-wrap"><input className="auth-input" value={form.email} onChange={set('email')} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Phone</label>
            <div className="auth-input-wrap"><input className="auth-input" value={form.phone} onChange={set('phone')} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Gender</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={form.gender} onChange={set('gender')}>
                {genders.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Last Qualification</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={form.lastQualification} onChange={set('lastQualification')}>
                {qualifications.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Computer Level</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={form.computerLevel} onChange={set('computerLevel')}>
                {computerLevels.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="auth-input-group edit-profile-grid-full">
            <label className="auth-input-label">Address</label>
            <div className="auth-input-wrap"><input className="auth-input" value={form.address} onChange={set('address')} /></div>
          </div>

          <div className="auth-input-group">
            <label className="auth-input-label"><FontAwesomeIcon icon={faChalkboardUser} /> Trainer</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={selectedTrainerId} onChange={handleTrainerChange} disabled={!trainers.length}>
                {!trainers.length && <option value="">No trainers found for this course/campus</option>}
                {trainers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          {batchesForSelectedTrainer.length > 1 && (
            <div className="auth-input-group">
              <label className="auth-input-label">Batch</label>
              <div className="auth-input-wrap">
                <select className="auth-input" value={form.slot} onChange={set('slot')}>
                  {batchesForSelectedTrainer.map((s) => <option key={s._id} value={s._id}>{s.batchLabel}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="auth-input-group edit-profile-grid-full">
            <label className="auth-input-label">Photo</label>
            <label className="feedback-add-image-btn assignment-attach-btn">
              <FontAwesomeIcon icon={uploadingPhoto ? faSpinner : faImage} spin={uploadingPhoto} />
              {uploadingPhoto ? 'Uploading...' : form.photo ? 'Photo selected — change?' : 'Choose New Photo'}
              <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
            </label>
          </div>
        </div>

        <div className="feedback-confirm-btn-row">
          <button className="generic-popup-btn-outline" onClick={onClose}>Back</button>
          <button className="generic-popup-btn" onClick={handleSave} disabled={saving || uploadingPhoto}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditStudentPopup
