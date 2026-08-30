import { useState, useEffect, useCallback, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEye, faIdBadge, faTrashCan, faPenToSquare, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import SubAdminTopbar from '../Layout/SubAdminTopbar.jsx'
import Avatar from '../../../Media/Avatar.jsx'
import RowMenu from '../../../shared/RowMenu.jsx'
import AddTrainerPopup from '../Popups/AddTrainerPopup.jsx'
import TrainerDetailPopup from '../Popups/TrainerDetailPopup.jsx'
import DeleteTrainerPopup from '../Popups/DeleteTrainerPopup.jsx'
import { hasPermission } from '../data/subAdminData.js'
import { api } from '../../../../../api/client.js'

function Trainers() {
  const [trainers, setTrainers] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(() => {
    api.get('/teachers').then(setTrainers).catch((err) => setError(err.message || 'Could not load trainers.'))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    if (!search.trim()) return trainers
    const q = search.trim().toLowerCase()
    return trainers.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      (t.employeeId || '').toLowerCase().includes(q) ||
      (t.designation || '').toLowerCase().includes(q) ||
      (t.campus?.name || '').toLowerCase().includes(q)
    )
  }, [trainers, search])

  return (
    <div className="subadmin-page">
      <SubAdminTopbar breadcrumb={['Home', 'Trainers']} />

      <div className="course-tab-header-row">
        <h4 className="course-tab-heading">Trainers ({trainers.length})</h4>
        {hasPermission('TRAINER', 'WRITE') && (
          <button type="button" className="course-tab-new-btn" onClick={() => setShowAdd(true)}>
            <FontAwesomeIcon icon={faPlus} /> Add Trainer
          </button>
        )}
      </div>

      <div className="students-toolbar" style={{ marginBottom: 14 }}>
        <div className="course-landing-search-wrap students-search-wrap">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="course-landing-search-icon" />
          <input
            type="text"
            className="course-landing-search-input"
            placeholder="Search by name, ID or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="auth-error-banner">{error}</div>}
      {toast && <div className="auth-success-banner">{toast}</div>}

      <div className="course-tab-box">
        <div className="student-row-head trainers-row-head">
          <span>Photo</span>
          <span>Name</span>
          <span>Email</span>
          <span><FontAwesomeIcon icon={faIdBadge} /> Employee ID</span>
          <span>Campus</span>
          <span>Action</span>
        </div>

        {filtered.map((t) => (
          <div key={t._id} className="student-row trainers-row">
            <Avatar name={t.name} photoUrl={t.photo} className="student-row-photo" />
            <span className="student-row-name">{t.name}</span>
            <span className="student-row-email">{t.email}</span>
            <span>{t.employeeId}</span>
            <span className="students-row-course">{t.campus?.name}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <FontAwesomeIcon icon={faEye} className="assignment-action-icon" title="View" onClick={() => setViewing(t)} />
              <RowMenu items={[
                ...(hasPermission('TRAINER', 'UPDATE') ? [{ label: 'Edit Trainer', icon: faPenToSquare, onClick: () => setEditing(t) }] : []),
                { label: 'Delete Trainer', icon: faTrashCan, danger: true, onClick: () => setDeleting(t) },
              ]} />
            </span>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="attendance-no-record">{search.trim() ? 'No trainers match your search.' : 'No trainers yet at your campus.'}</p>
        )}
      </div>

      <AddTrainerPopup show={showAdd} onClose={() => setShowAdd(false)} onSaved={load} />
      {editing && <AddTrainerPopup show initial={editing} onClose={() => setEditing(null)} onSaved={load} />}
      {viewing && <TrainerDetailPopup trainer={viewing} onClose={() => setViewing(null)} />}
      <DeleteTrainerPopup
        trainer={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => load()}
      />
    </div>
  )
}

export default Trainers
