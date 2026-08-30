import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faUserShield, faCircleCheck, faImage, faWandMagicSparkles, faSpinner } from '@fortawesome/free-solid-svg-icons'
import {
  permissions, permissionActionsOrder, genders, roleTemplates, roleTemplatePermissions, subAdminPermissionKeys,
} from '../../../shared/permissionsConfig.js'
import PermissionActionsPopup from '../../../shared/PermissionActionsPopup.jsx'
import { api } from '../../../../../api/client.js'
import EmailOtpPopup from '../../../Media/EmailOtpPopup.jsx'

const emptyForm = { name: '', email: '', phone: '', employeeId: '', gender: '', role: 'Campus Manager', campus: '', password: '', photo: '' }

// One popup handles both "Add Sub Admin" and "Edit Sub Admin" - which mode
// it's in depends on whether an `initial` record was passed in.
// `presetCampus` locks the campus selector when arriving straight from
// "Campus created -> Add Sub Admin now".
function SubAdminPopup({ initial, presetCampus, onClose, onSaved }) {
  const [form, setForm] = useState(() => (initial
    ? {
      name: initial.name, email: initial.email, phone: initial.phone,
      employeeId: initial.employeeId || '',
      gender: initial.gender, role: initial.role,
      campus: initial.campus?._id || initial.campus || '',
      password: '', photo: initial.photo || '',
    }
    : { ...emptyForm, campus: presetCampus?._id || '' }))
  const [permissionKeys, setPermissionKeys] = useState(() => (
    initial ? (initial.permissionKeys || []) : (roleTemplatePermissions['Campus Manager'] || [])
  ))
  // Per-module action grants. For a brand-new Sub Admin these start empty
  // until Super Admin picks actions per module. For an existing record
  // saved before this feature existed, fall back to "every action the
  // module supports" for any key it already had enabled, so nothing that
  // used to work silently breaks.
  const [permissionActions, setPermissionActions] = useState(() => {
    if (initial?.permissionActions && Object.keys(initial.permissionActions).length > 0) {
      return { ...initial.permissionActions }
    }
    if (initial) {
      const fallback = {}
      for (const key of initial.permissionKeys || []) {
        const perm = permissions.find((p) => p.key === key)
        if (perm) fallback[key] = [...perm.actions]
      }
      return fallback
    }
    const initialActions = {}
    for (const key of roleTemplatePermissions['Campus Manager'] || []) {
      const perm = permissions.find((p) => p.key === key)
      if (perm) initialActions[key] = [...perm.actions]
    }
    return initialActions
  })
  const [editingPermission, setEditingPermission] = useState(null)
  const [campuses, setCampuses] = useState(presetCampus ? [presetCampus] : [])
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showEmailOtp, setShowEmailOtp] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  useEffect(() => {
    if (presetCampus) return
    api.get('/campuses').then(setCampuses).catch(() => {})
  }, [presetCampus])

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const applyRoleTemplate = (role) => {
    setForm({ ...form, role })
    const keys = roleTemplatePermissions[role] || []
    setPermissionKeys(keys)
    const actions = {}
    for (const key of keys) {
      const perm = permissions.find((p) => p.key === key)
      if (perm) actions[key] = [...perm.actions]
    }
    setPermissionActions(actions)
  }

  // Clicking a module never flips anything by itself anymore - it opens a
  // popup where Super Admin explicitly picks which actions to grant. Saving
  // with zero actions checked turns the whole module off; picking at least
  // one turns it on with exactly those actions.
  const handlePermissionSave = (key, selectedActions) => {
    setPermissionActions((prev) => ({ ...prev, [key]: selectedActions }))
    setPermissionKeys((prev) => {
      const has = prev.includes(key)
      if (selectedActions.length === 0) return prev.filter((k) => k !== key)
      if (!has) return [...prev, key]
      return prev
    })
  }

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
    setPermissionKeys([])
    setPermissionActions({})
    setEditingPermission(null)
    setSaved(false)
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.employeeId.trim() || !form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.campus) {
      setError('Sub Admin ID, name, email, phone and campus are required.')
      return
    }
    if (!initial && !form.password) {
      setError('A temporary password is required for a new Sub Admin.')
      return
    }
    setLoading(true)
    try {
      const trimmedEmail = form.email.trim().toLowerCase()
      const basePayload = {
        name: form.name.trim(), phone: form.phone.trim(),
        employeeId: form.employeeId.trim(),
        gender: form.gender, role: form.role, photo: form.photo, permissionKeys, permissionActions,
        ...(form.password ? { password: form.password } : {}),
      }

      if (!initial) {
        // New Sub Admin - email is set directly at creation, no OTP needed yet.
        await api.post('/subadmins', { ...basePayload, email: trimmedEmail, campus: form.campus })
        setSaved(true)
        return
      }

      // Editing an existing Sub Admin - email never travels in this call.
      // If it changed, it's confirmed separately via OTP sent to the
      // Sub Admin's CURRENT email before it actually applies.
      await api.put(`/subadmins/${initial._id}`, basePayload)
      if (trimmedEmail && trimmedEmail !== initial.email.toLowerCase()) {
        setPendingEmail(trimmedEmail)
        setShowEmailOtp(true)
        return
      }
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Could not save Sub Admin.')
    } finally {
      setLoading(false)
    }
  }

  const finishAfterEmailChange = () => {
    setShowEmailOtp(false)
    setSaved(true)
  }

  if (saved) {
    return (
      <div className="generic-popup-overlay">
        <div className="generic-popup-card">
          <div className="generic-popup-icon-wrap">
            <FontAwesomeIcon icon={faCircleCheck} className="generic-popup-icon" />
          </div>
          <h3 className="generic-popup-title">{initial ? 'Sub Admin Updated!' : 'Sub Admin Created!'}</h3>
          <p className="generic-popup-text">
            {form.name} now has {permissionKeys.length} permission module{permissionKeys.length === 1 ? '' : 's'} enabled.
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
        subjectLabel="this Sub Admin's"
        onRequest={() => api.post(`/subadmins/${initial._id}/email-change/request`, { newEmail: pendingEmail })}
        onVerify={(otp) => api.post(`/subadmins/${initial._id}/email-change/verify`, { otp })}
        onDone={finishAfterEmailChange}
        onClose={() => setShowEmailOtp(false)}
      />
    )
  }

  return (
    <div className="generic-popup-overlay">
      <div className="edit-profile-card subadmin-popup-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faUserShield} /> {initial ? 'Edit Sub Admin' : 'Add Sub Admin'}
          </span>
          <button className="generic-popup-close" onClick={handleClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="edit-profile-grid">
          <div className="auth-input-group">
            <label className="auth-input-label">Sub Admin ID</label>
            <div className="auth-input-wrap"><input className="auth-input" placeholder="e.g. SA-001" value={form.employeeId} onChange={set('employeeId')} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Full Name</label>
            <div className="auth-input-wrap"><input className="auth-input" value={form.name} onChange={set('name')} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Email</label>
            <div className="auth-input-wrap"><input type="email" className="auth-input" value={form.email} onChange={set('email')} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Phone</label>
            <div className="auth-input-wrap"><input className="auth-input" value={form.phone} onChange={set('phone')} /></div>
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
          <div className="auth-input-group edit-profile-grid-full">
            <label className="auth-input-label">Campus</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={form.campus} onChange={set('campus')} disabled={!!initial || !!presetCampus}>
                <option value="">Select a campus</option>
                {campuses.map((c) => <option key={c._id} value={c._id}>{c.name} — {c.city}</option>)}
              </select>
            </div>
            {initial && <span className="subadmin-role-hint">Campus can't be changed after creation.</span>}
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">{initial ? 'Reset Password (optional)' : 'Temporary Password'}</label>
            <div className="auth-input-wrap"><input type="password" className="auth-input" placeholder={initial ? 'Leave blank to keep current' : ''} value={form.password} onChange={set('password')} /></div>
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

        <h4 className="student-form-section-heading subadmin-role-heading">
          <FontAwesomeIcon icon={faWandMagicSparkles} /> Role Template
        </h4>
        <div className="subadmin-role-chip-row">
          {roleTemplates.map((role) => (
            <button
              type="button"
              key={role}
              className={`subadmin-role-chip ${form.role === role ? 'subadmin-role-chip-active' : ''}`}
              onClick={() => applyRoleTemplate(role)}
            >
              {role}
            </button>
          ))}
        </div>
        <p className="subadmin-role-hint">
          Picking a role fills in a sensible starting set of permissions below — fine-tune anything before saving.
        </p>

        <h4 className="student-form-section-heading">
          <FontAwesomeIcon icon={faUserShield} /> Permissions
        </h4>
        <div className="subadmin-permission-matrix">
          <div className="subadmin-permission-matrix-head">
            <span>Module</span>
            {permissionActionsOrder.map((a) => <span key={a} className="subadmin-permission-matrix-action-head">{a}</span>)}
          </div>
          {permissions.filter((p) => subAdminPermissionKeys.includes(p.key)).map((p) => {
            const enabled = permissionKeys.includes(p.key)
            const grantedActions = permissionActions[p.key] || []
            return (
              <div
                key={p.key}
                className={`subadmin-permission-matrix-row ${enabled ? 'subadmin-permission-matrix-row-enabled' : ''}`}
                onClick={() => setEditingPermission(p)}
              >
                <button type="button" className="subadmin-permission-matrix-label" onClick={(e) => { e.stopPropagation(); setEditingPermission(p) }}>
                  <span className={`subadmin-permission-toggle ${enabled ? 'subadmin-permission-toggle-on' : ''}`}></span>
                  {p.label}
                </button>
                {permissionActionsOrder.map((a) => (
                  <span key={a} className={`subadmin-permission-matrix-cell ${enabled && grantedActions.includes(a) ? 'subadmin-permission-matrix-cell-on' : ''}`}>
                    {enabled && grantedActions.includes(a) ? <FontAwesomeIcon icon={faCircleCheck} /> : '—'}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
        <p className="subadmin-role-hint">
          Click any module to choose exactly which of READ / WRITE / UPDATE / EXPORT it should have — nothing changes until you save it.
        </p>

        {editingPermission && (
          <PermissionActionsPopup
            permission={editingPermission}
            initialActions={permissionActions[editingPermission.key] || []}
            onClose={() => setEditingPermission(null)}
            onSave={handlePermissionSave}
          />
        )}

        <div className="feedback-confirm-btn-row">
          <button className="generic-popup-btn-outline" onClick={handleClose}>Back</button>
          <button className="generic-popup-btn" onClick={handleSubmit} disabled={loading || uploadingPhoto}>
            {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Sub Admin'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SubAdminPopup
