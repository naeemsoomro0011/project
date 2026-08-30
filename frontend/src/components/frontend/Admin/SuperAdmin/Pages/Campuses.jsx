import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus, faSchool, faUserGraduate, faChalkboardUser, faLayerGroup, faCity,
  faPenToSquare, faTrashCan,
} from '@fortawesome/free-solid-svg-icons'
import SuperAdminTopbar from '../Layout/SuperAdminTopbar.jsx'
import CampusPopup from '../Popups/CampusPopup.jsx'
import DeleteCampusPopup from '../Popups/DeleteCampusPopup.jsx'
import SubAdminPopup from '../Popups/SubAdminPopup.jsx'
import { api } from '../../../../../api/client.js'

function Campuses() {
  const [campuses, setCampuses] = useState([])
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // campus object being edited, or null
  const [deleteTarget, setDeleteTarget] = useState(null) // campus object being deleted, or null
  const [addSubAdminFor, setAddSubAdminFor] = useState(null) // campus object, or null

  const load = useCallback(() => {
    api.get('/campuses').then(setCampuses).catch((err) => setError(err.message || 'Could not load campuses.'))
  }, [])

  useEffect(() => { load() }, [load])

  const existingCities = [...new Set(campuses.map((c) => c.city))]

  const flashToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 6000)
  }

  return (
    <div className="superadmin-page">
      <SuperAdminTopbar breadcrumb={['Home', 'Campuses']} />

      <div className="course-tab-header-row">
        <h4 className="course-tab-heading">
          <FontAwesomeIcon icon={faCity} /> Campuses ({campuses.length})
        </h4>
        <button type="button" className="course-tab-new-btn" onClick={() => setShowAdd(true)}>
          <FontAwesomeIcon icon={faPlus} /> Add Campus
        </button>
      </div>

      {error && <div className="auth-error-banner">{error}</div>}
      {toast && <div className="auth-success-banner">{toast}</div>}

      <div className="superadmin-campus-grid">
        {campuses.map((c) => (
          <div key={c._id} className="superadmin-campus-card">
            <div className="superadmin-campus-card-top">
              <span className="superadmin-campus-icon-wrap">
                <FontAwesomeIcon icon={faSchool} />
              </span>
              <div>
                <h5 className="superadmin-campus-name">{c.name}</h5>
                <span className="superadmin-campus-city">{c.city}, Pakistan</span>
              </div>
            </div>

            <div className="superadmin-campus-stat-row">
              <span className="superadmin-campus-stat">
                <FontAwesomeIcon icon={faUserGraduate} /> {c.studentsCount} Students
              </span>
              <span className="superadmin-campus-stat">
                <FontAwesomeIcon icon={faChalkboardUser} /> {c.trainersCount} Trainers
              </span>
              <span className="superadmin-campus-stat">
                <FontAwesomeIcon icon={faLayerGroup} /> {c.slotsCount} Slots
              </span>
              <span className="superadmin-campus-stat">
                <FontAwesomeIcon icon={faUserGraduate} /> {c.staffCount} Staff
              </span>
            </div>

            {c.staffCount === 0 && (
              <button type="button" className="course-tab-new-btn superadmin-campus-add-subadmin-btn" onClick={() => setAddSubAdminFor(c)}>
                <FontAwesomeIcon icon={faPlus} /> Add Sub Admin
              </button>
            )}

            <div className="superadmin-campus-card-actions">
              <button type="button" className="subadmin-toolbar-btn superadmin-subadmin-action-btn" onClick={() => setEditTarget(c)}>
                <FontAwesomeIcon icon={faPenToSquare} /> Edit
              </button>
              <button
                type="button"
                className="subadmin-toolbar-btn superadmin-subadmin-action-btn superadmin-subadmin-suspend-btn"
                onClick={() => setDeleteTarget(c)}
              >
                <FontAwesomeIcon icon={faTrashCan} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <CampusPopup
        show={showAdd}
        existingCities={existingCities}
        onClose={() => setShowAdd(false)}
        onCreated={(campus) => { load(); setAddSubAdminFor(campus) }}
      />

      <CampusPopup
        show={Boolean(editTarget)}
        editing={editTarget}
        existingCities={existingCities}
        onClose={() => setEditTarget(null)}
        onUpdated={() => { load(); flashToast('Campus updated successfully.') }}
      />

      <DeleteCampusPopup
        campus={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={(message) => { load(); flashToast(message) }}
      />

      {addSubAdminFor && (
        <SubAdminPopup
          presetCampus={addSubAdminFor}
          onClose={() => setAddSubAdminFor(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}

export default Campuses
