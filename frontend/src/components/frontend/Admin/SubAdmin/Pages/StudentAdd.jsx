import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserPlus, faCircleCheck, faImage, faSpinner, faChalkboardUser } from '@fortawesome/free-solid-svg-icons'
import SubAdminTopbar from '../Layout/SubAdminTopbar.jsx'
import { genders, qualifications, computerLevels } from '../../../shared/permissionsConfig.js'
import { api } from '../../../../../api/client.js'
import { useAuth } from '../../../../../context/useAuth.js'

const emptyForm = {
  course: '', slot: '',
  name: '', fatherName: '', email: '', phone: '', cnic: '', fatherCnic: '', fatherPhone: '',
  dob: '', gender: '', address: '', lastQualification: '', computerLevel: '', hasLaptop: '',
  photo: '',
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function StudentAdd() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [saved, setSaved] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [courses, setCourses] = useState([])
  const [slots, setSlots] = useState([])

  useEffect(() => {
    api.get('/courses').then(setCourses).catch(() => {})
    api.get('/slots').then(setSlots).catch(() => {})
  }, [])

  const set = (field) => (e) => {
    const value = e.target.value
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'course') next.slot = '' // batch choices depend on the course
      return next
    })
  }

  // Only batches of the chosen course, still open for registration, with a
  // free seat - and only at this Sub Admin's own campus (the API already
  // scopes /slots that way for a subadmin token).
  const availableSlots = useMemo(
    () => slots.filter((s) => s.course?._id === form.course && s.registrationOpen && s.seatsUsed < s.capacity),
    [slots, form.course]
  )
  const selectedSlot = availableSlots.find((s) => s._id === form.slot)

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const { url } = await api.uploadImage(file)
      setForm((f) => ({ ...f, photo: url }))
    } catch (err) {
      setApiError(err.message || 'Photo upload failed.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const requiredFields = ['course', 'slot', 'name', 'fatherName', 'email', 'phone', 'cnic', 'dob', 'gender']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    const newErrors = {}
    requiredFields.forEach((f) => {
      if (!form[f]) newErrors[f] = 'Required'
    })
    if (form.cnic && form.cnic.replace(/\D/g, '').length < 13) newErrors.cnic = 'CNIC looks too short'
    if (form.email && !form.email.includes('@')) newErrors.email = 'Enter a valid email'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setSubmitting(true)
    try {
      const student = await api.post('/students', {
        ...form,
        hasLaptop: form.hasLaptop === 'yes',
      })
      setSaved(student)
    } catch (err) {
      setApiError(err.message || 'Could not register student.')
    } finally {
      setSubmitting(false)
    }
  }

  if (saved) {
    return (
      <div className="subadmin-page">
        <SubAdminTopbar breadcrumb={['Home', 'Students', 'Add New']} />
        <div className="student-saved-box">
          <FontAwesomeIcon icon={faCircleCheck} className="student-saved-icon" />
          <h3 className="student-saved-heading">Student Registered!</h3>
          <p className="student-saved-text">
            {saved.name} has been saved with roll number <strong>{saved.roll}</strong>. They can now
            create their own login using this CNIC and their date of birth from the Landing page.
          </p>
          <div className="feedback-confirm-btn-row student-saved-btn-row">
            <button className="generic-popup-btn-outline" onClick={() => { setForm(emptyForm); setSaved(null) }}>
              Add Another
            </button>
            <button className="generic-popup-btn" onClick={() => navigate('/admin/subadmin/students')}>
              Back to Students
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="subadmin-page">
      <SubAdminTopbar breadcrumb={['Home', 'Students', 'Add New']} />

      <form className="student-form-box" onSubmit={handleSubmit} noValidate>
        <h4 className="student-form-section-heading">Where will they study?</h4>
        <p className="subadmin-role-hint">Campus: <strong>{user?.campus?.name || user?.city}</strong> (your campus — every student you add is enrolled here)</p>

        <div className="student-form-grid">
          <div className="auth-input-group">
            <label className="auth-input-label">Course <span className="auth-required-star">*</span></label>
            <div className={`auth-input-wrap ${errors.course ? 'auth-input-wrap-error' : ''}`}>
              <select className="auth-input" value={form.course} onChange={set('course')}>
                <option value="">Select</option>
                {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Batch / Slot <span className="auth-required-star">*</span></label>
            <div className={`auth-input-wrap ${errors.slot ? 'auth-input-wrap-error' : ''}`}>
              <select className="auth-input" value={form.slot} onChange={set('slot')} disabled={!form.course}>
                <option value="">Select</option>
                {availableSlots.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.batchLabel} — {s.scheduleDays.map((d) => WEEKDAY_LABELS[d]).join('/')} {s.startTime}-{s.endTime} ({s.capacity - s.seatsUsed} seats left)
                  </option>
                ))}
              </select>
            </div>
            {form.course && availableSlots.length === 0 && (
              <span className="subadmin-role-hint" style={{ color: '#C53030' }}>
                No open batches for this course yet — create one from Administration first.
              </span>
            )}
          </div>
          {selectedSlot && (
            <div className="auth-input-group student-form-grid-full">
              <span className="subadmin-role-hint">
                <FontAwesomeIcon icon={faChalkboardUser} /> Trainer for this batch: <strong>{selectedSlot.teacher?.name}</strong>
              </span>
            </div>
          )}
        </div>

        <h4 className="student-form-section-heading">Student Details</h4>

        {apiError && <div className="auth-error-banner">{apiError}</div>}

        <div className="student-form-grid">
          <div className="auth-input-group">
            <label className="auth-input-label">Full Name <span className="auth-required-star">*</span></label>
            <div className={`auth-input-wrap ${errors.name ? 'auth-input-wrap-error' : ''}`}>
              <input className="auth-input" value={form.name} onChange={set('name')} />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Father Name <span className="auth-required-star">*</span></label>
            <div className={`auth-input-wrap ${errors.fatherName ? 'auth-input-wrap-error' : ''}`}>
              <input className="auth-input" value={form.fatherName} onChange={set('fatherName')} />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Email <span className="auth-required-star">*</span></label>
            <div className={`auth-input-wrap ${errors.email ? 'auth-input-wrap-error' : ''}`}>
              <input type="email" className="auth-input" value={form.email} onChange={set('email')} />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Phone <span className="auth-required-star">*</span></label>
            <div className={`auth-input-wrap ${errors.phone ? 'auth-input-wrap-error' : ''}`}>
              <input className="auth-input" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">CNIC <span className="auth-required-star">*</span></label>
            <div className={`auth-input-wrap ${errors.cnic ? 'auth-input-wrap-error' : ''}`}>
              <input className="auth-input" placeholder="42101-1234567-1" value={form.cnic} onChange={set('cnic')} />
            </div>
            <span className="subadmin-role-hint">The student uses this exact CNIC + their DOB to create their own login later.</span>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Father's CNIC</label>
            <div className="auth-input-wrap">
              <input className="auth-input" value={form.fatherCnic} onChange={set('fatherCnic')} />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Father's Phone</label>
            <div className="auth-input-wrap">
              <input className="auth-input" value={form.fatherPhone} onChange={set('fatherPhone')} />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Date of Birth <span className="auth-required-star">*</span></label>
            <div className={`auth-input-wrap ${errors.dob ? 'auth-input-wrap-error' : ''}`}>
              <input type="date" className="auth-input" value={form.dob} onChange={set('dob')} />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Gender <span className="auth-required-star">*</span></label>
            <div className={`auth-input-wrap ${errors.gender ? 'auth-input-wrap-error' : ''}`}>
              <select className="auth-input" value={form.gender} onChange={set('gender')}>
                <option value="">Select</option>
                {genders.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="auth-input-group student-form-grid-full">
            <label className="auth-input-label">Address</label>
            <div className="auth-input-wrap">
              <input className="auth-input" value={form.address} onChange={set('address')} />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Last Qualification</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={form.lastQualification} onChange={set('lastQualification')}>
                <option value="">Select</option>
                {qualifications.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Computer Level</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={form.computerLevel} onChange={set('computerLevel')}>
                <option value="">Select</option>
                {computerLevels.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Do you have a laptop?</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={form.hasLaptop} onChange={set('hasLaptop')}>
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Student Photo</label>
            <label className="feedback-add-image-btn assignment-attach-btn">
              <FontAwesomeIcon icon={uploadingPhoto ? faSpinner : faImage} spin={uploadingPhoto} />
              {uploadingPhoto ? 'Uploading...' : form.photo ? 'Photo selected — change?' : 'Choose Photo'}
              <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
            </label>
          </div>
        </div>

        <button type="submit" className="auth-btn-primary student-form-submit-btn" disabled={submitting || uploadingPhoto}>
          <FontAwesomeIcon icon={faUserPlus} /> {submitting ? 'Registering...' : 'Register Student'}
        </button>
      </form>
    </div>
  )
}

export default StudentAdd
