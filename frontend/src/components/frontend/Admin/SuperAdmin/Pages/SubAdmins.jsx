import { useState, useMemo, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass, faPlus, faPenToSquare, faUserLock, faUserCheck, faUserShield,
  faShieldHalved, faTrashCan,
} from '@fortawesome/free-solid-svg-icons'
import SuperAdminTopbar from '../Layout/SuperAdminTopbar.jsx'
import Avatar from '../../../Media/Avatar.jsx'
import SubAdminPopup from '../Popups/SubAdminPopup.jsx'
import SubAdminStatusPopup from '../Popups/SubAdminStatusPopup.jsx'
import DeleteSubAdminPopup from '../Popups/DeleteSubAdminPopup.jsx'
import { api } from '../../../../../api/client.js'

function SubAdmins() {
  const [allSubAdmins, setAllSubAdmins] = useState([])
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const load = useCallback(() => {
    api.get('/subadmins').then(setAllSubAdmins).catch((err) => setError(err.message || 'Could not load Sub Admins.'))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    if (!search.trim()) return allSubAdmins
    const q = search.trim().toLowerCase()
    return allSubAdmins.filter((a) =>
      a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) ||
      (a.employeeId || '').toLowerCase().includes(q) ||
      (a.campus?.name || '').toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
    )
  }, [allSubAdmins, search])

  const handleStatusChange = async (id) => {
    try {
      await api.put(`/subadmins/${id}/suspend`)
      load()
    } catch (err) {
      setError(err.message || 'Could not update status.')
    }
  }

  return (
    <div className="superadmin-page">
      <SuperAdminTopbar breadcrumb={['Home', 'Sub Admins']} />

      {error && <div className="auth-error-banner">{error}</div>}
      {toast && <div className="auth-success-banner">{toast}</div>}

      <div className="students-toolbar">
        <div className="course-landing-search-wrap students-search-wrap">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="course-landing-search-icon" />
          <input
            type="text"
            className="course-landing-search-input"
            placeholder="Search by name, email, campus or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button type="button" className="subadmin-toolbar-btn subadmin-toolbar-btn-primary" onClick={() => setShowAdd(true)}>
          <FontAwesomeIcon icon={faPlus} /> Add Sub Admin
        </button>
      </div>

      <div className="superadmin-subadmin-grid">
        {filtered.map((a) => (
          <div key={a._id} className={`superadmin-subadmin-card ${a.status === 'suspended' ? 'superadmin-subadmin-card-suspended' : ''}`}>
            <div className="superadmin-subadmin-card-top">
              <Avatar name={a.name} photoUrl={a.photo} className="superadmin-subadmin-avatar" />
              <div className="superadmin-subadmin-card-heading">
                <h5 className="superadmin-subadmin-name">{a.name}</h5>
                <span className="superadmin-subadmin-email">{a.email}</span>
                {a.employeeId && <span className="superadmin-subadmin-email">ID: {a.employeeId}</span>}
              </div>
              <span className={`superadmin-subadmin-status-chip ${a.status === 'active' ? 'superadmin-subadmin-status-active' : 'superadmin-subadmin-status-suspended'}`}>
                {a.status}
              </span>
            </div>

            <div className="superadmin-subadmin-card-body">
              <span className="superadmin-subadmin-role-badge">
                <FontAwesomeIcon icon={faUserShield} /> {a.role}
              </span>
              <p className="superadmin-subadmin-campus-line">{a.campus?.name}, {a.campus?.city}</p>
              <p className="superadmin-subadmin-perm-line">
                <FontAwesomeIcon icon={faShieldHalved} /> {a.permissionKeys.length} permission modules enabled
              </p>
            </div>

            <div className="superadmin-subadmin-card-actions">
              <button type="button" className="subadmin-toolbar-btn superadmin-subadmin-action-btn" onClick={() => setEditing(a)}>
                <FontAwesomeIcon icon={faPenToSquare} /> Edit
              </button>
              <button
                type="button"
                className={`subadmin-toolbar-btn superadmin-subadmin-action-btn ${a.status === 'active' ? 'superadmin-subadmin-suspend-btn' : 'superadmin-subadmin-activate-btn'}`}
                onClick={() => setStatusTarget(a)}
              >
                <FontAwesomeIcon icon={a.status === 'active' ? faUserLock : faUserCheck} />
                {a.status === 'active' ? ' Suspend' : ' Activate'}
              </button>
              <button type="button" className="subadmin-toolbar-btn superadmin-subadmin-action-btn superadmin-subadmin-suspend-btn" onClick={() => setDeleteTarget(a)}>
                <FontAwesomeIcon icon={faTrashCan} /> Remove
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && <p className="attendance-no-record">No sub admins match your search.</p>}
      </div>

      {showAdd && <SubAdminPopup key="add" initial={null} onClose={() => setShowAdd(false)} onSaved={load} />}
      {editing && <SubAdminPopup key={editing._id} initial={editing} onClose={() => setEditing(null)} onSaved={load} />}

      <SubAdminStatusPopup subAdmin={statusTarget} onClose={() => setStatusTarget(null)} onConfirm={handleStatusChange} />

      <DeleteSubAdminPopup
        subAdmin={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={(message) => { setToast(message); load(); setTimeout(() => setToast(''), 6000) }}
      />
    </div>
  )
}

export default SubAdmins
