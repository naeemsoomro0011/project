import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen, faPlus, faTrashCan, faChevronDown, faPenToSquare, faXmark,
  faFloppyDisk, faLayerGroup,
} from '@fortawesome/free-solid-svg-icons'
import SuperAdminTopbar from '../Layout/SuperAdminTopbar.jsx'
import { api } from '../../../../../api/client.js'
import { useAlert } from '../../../../../context/AlertContext.jsx'

function emptyModule() {
  return { _localId: crypto.randomUUID(), title: '', topics: [] }
}
function emptyTopic() {
  return { _localId: crypto.randomUUID(), title: '' }
}

// Editing a course's syllabus inline (accordion-style), so Super Admin can
// add/rename/remove modules and topics without leaving the page. Nothing is
// saved to the database until "Save Syllabus" is pressed.
function CourseEditor({ course, onClose, onSaved }) {
  const [name, setName] = useState(course.name)
  const [description, setDescription] = useState(course.description || '')
  const [modules, setModules] = useState(() =>
    (course.syllabus || []).map((m) => ({ ...m, _localId: m._id || crypto.randomUUID(), topics: m.topics.map((t) => ({ ...t, _localId: t._id || crypto.randomUUID() })) }))
  )
  const [openModules, setOpenModules] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggleModule = (id) => setOpenModules((p) => ({ ...p, [id]: !p[id] }))

  const addModule = () => {
    const m = emptyModule()
    setModules([...modules, m])
    setOpenModules((p) => ({ ...p, [m._localId]: true }))
  }
  const removeModule = (id) => setModules(modules.filter((m) => m._localId !== id))
  const renameModule = (id, title) => setModules(modules.map((m) => (m._localId === id ? { ...m, title } : m)))

  const addTopic = (moduleId) => {
    setModules(modules.map((m) => (m._localId === moduleId ? { ...m, topics: [...m.topics, emptyTopic()] } : m)))
  }
  const removeTopic = (moduleId, topicId) => {
    setModules(modules.map((m) => (m._localId === moduleId ? { ...m, topics: m.topics.filter((t) => t._localId !== topicId) } : m)))
  }
  const renameTopic = (moduleId, topicId, title) => {
    setModules(modules.map((m) => (m._localId === moduleId
      ? { ...m, topics: m.topics.map((t) => (t._localId === topicId ? { ...t, title } : t)) }
      : m)))
  }

  const handleSave = async () => {
    setError('')
    if (!name.trim()) return setError('Course name is required.')
    for (const m of modules) {
      if (!m.title.trim()) return setError('Every module needs a title.')
      for (const t of m.topics) {
        if (!t.title.trim()) return setError(`Every topic in "${m.title}" needs a title.`)
      }
    }
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        description,
        // Preserve each module/topic's existing _id when saving. Sending
        // only { title } here for everything - as this used to do - made
        // Mongo mint a brand-new _id for every module and topic on every
        // save, even ones whose title never changed. That silently
        // orphaned every batch's already-completed-topic records (they
        // reference the old moduleId/topicId), which is exactly why
        // progress broke right after a Syllabus edit. Newly added modules/
        // topics have no real `_id` yet (only a local UUID for React's
        // `key`), so they correctly get a fresh one from Mongo as before.
        syllabus: modules.map((m) => ({
          ...(m._id ? { _id: m._id } : {}),
          title: m.title.trim(),
          topics: m.topics.map((t) => ({
            ...(t._id ? { _id: t._id } : {}),
            title: t.title.trim(),
          })),
        })),
      }
      if (course._id) await api.put(`/courses/${course._id}`, payload)
      else await api.post('/courses', payload)
      onSaved()
    } catch (err) {
      setError(err.message || 'Could not save course.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="course-tab-box" style={{ marginBottom: 20 }}>
      <div className="course-tab-header-row">
        <h4 className="course-tab-heading">
          <FontAwesomeIcon icon={faBookOpen} /> {course._id ? 'Edit Course' : 'New Course'}
        </h4>
        <button type="button" className="generic-popup-close" style={{ position: 'static' }} onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      {error && <div className="auth-error-banner">{error}</div>}

      <div className="edit-profile-grid">
        <div className="auth-input-group edit-profile-grid-full">
          <label className="auth-input-label">Course Name</label>
          <div className="auth-input-wrap"><input className="auth-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        </div>
        <div className="auth-input-group edit-profile-grid-full">
          <label className="auth-input-label">Description</label>
          <div className="auth-input-wrap"><input className="auth-input" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        </div>
      </div>

      <h4 className="student-form-section-heading">
        <FontAwesomeIcon icon={faLayerGroup} /> Syllabus (Modules &amp; Topics)
      </h4>

      {modules.map((m) => (
        <div key={m._localId} className="progress-module-box">
          <div className="progress-module-header" style={{ cursor: 'default' }}>
            <span className="progress-module-title" style={{ flex: 1 }}>
              <button type="button" className="generic-popup-close" style={{ position: 'static' }} onClick={() => toggleModule(m._localId)}>
                <FontAwesomeIcon icon={faChevronDown} className={openModules[m._localId] ? 'progress-module-arrow-open' : ''} />
              </button>
              <input
                className="auth-input"
                style={{ maxWidth: 320 }}
                placeholder="Module title (e.g. Frontend Development)"
                value={m.title}
                onChange={(e) => renameModule(m._localId, e.target.value)}
              />
              <span className="progress-module-topics-count">{m.topics.length} topic(s)</span>
            </span>
            <button type="button" className="generic-popup-btn-outline" onClick={() => removeModule(m._localId)}>
              <FontAwesomeIcon icon={faTrashCan} />
            </button>
          </div>

          {openModules[m._localId] && (
            <div className="progress-module-body">
              {m.topics.map((t) => (
                <div key={t._localId} className="progress-topic-row">
                  <input
                    className="auth-input"
                    placeholder="Topic title"
                    value={t.title}
                    onChange={(e) => renameTopic(m._localId, t._localId, e.target.value)}
                  />
                  <button type="button" className="generic-popup-close" style={{ position: 'static' }} onClick={() => removeTopic(m._localId, t._localId)}>
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              ))}
              <button type="button" className="subadmin-toolbar-btn" onClick={() => addTopic(m._localId)}>
                <FontAwesomeIcon icon={faPlus} /> Add Topic
              </button>
            </div>
          )}
        </div>
      ))}

      <button type="button" className="course-tab-new-btn" style={{ marginTop: 10 }} onClick={addModule}>
        <FontAwesomeIcon icon={faPlus} /> Add Module
      </button>

      <div className="feedback-confirm-btn-row" style={{ marginTop: 20 }}>
        <button className="generic-popup-btn-outline" onClick={onClose}>Cancel</button>
        <button className="generic-popup-btn" onClick={handleSave} disabled={saving}>
          <FontAwesomeIcon icon={faFloppyDisk} /> {saving ? 'Saving...' : 'Save Syllabus'}
        </button>
      </div>
    </div>
  )
}

function Courses() {
  const { confirmAction, success } = useAlert()
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // course object being edited, or a blank {} for "new"

  const load = useCallback(() => {
    api.get('/courses').then(setCourses).catch((err) => setError(err.message || 'Could not load courses.'))
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (course) => {
    const ok = await confirmAction({
      title: 'Delete this course?',
      message: `Delete "${course.name}"? This cannot be undone.`,
      confirmText: 'Yes, delete it',
    })
    if (!ok) return
    try {
      await api.delete(`/courses/${course._id}`)
      success(`${course.name} deleted.`, 'Course Deleted')
      load()
    } catch (err) {
      setError(err.message || 'Could not delete course.')
    }
  }

  return (
    <div className="superadmin-page">
      <SuperAdminTopbar breadcrumb={['Home', 'Courses']} />

      <div className="course-tab-header-row">
        <h4 className="course-tab-heading">
          <FontAwesomeIcon icon={faBookOpen} /> Courses ({courses.length})
        </h4>
        {!editing && (
          <button type="button" className="course-tab-new-btn" onClick={() => setEditing({ name: '', description: '', syllabus: [] })}>
            <FontAwesomeIcon icon={faPlus} /> Add Course
          </button>
        )}
      </div>

      {error && <div className="auth-error-banner">{error}</div>}


      {editing && (
        <CourseEditor
          course={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); setToast('Course saved.'); setTimeout(() => setToast(''), 5000) }}
        />
      )}

      <div className="superadmin-campus-grid">
        {courses.map((c) => {
          const topicCount = (c.syllabus || []).reduce((s, m) => s + m.topics.length, 0)
          return (
            <div key={c._id} className="superadmin-campus-card">
              <div className="superadmin-campus-card-top">
                <span className="superadmin-campus-icon-wrap">
                  <FontAwesomeIcon icon={faBookOpen} />
                </span>
                <div>
                  <h5 className="superadmin-campus-name">{c.name}</h5>
                  <span className="superadmin-campus-city">{c.description || 'No description yet'}</span>
                </div>
              </div>

              <div className="superadmin-campus-stat-row">
                <span className="superadmin-campus-stat">
                  <FontAwesomeIcon icon={faLayerGroup} /> {(c.syllabus || []).length} Modules
                </span>
                <span className="superadmin-campus-stat">
                  <FontAwesomeIcon icon={faBookOpen} /> {topicCount} Topics
                </span>
              </div>

              <div className="superadmin-subadmin-card-actions" style={{ marginTop: 14 }}>
                <button type="button" className="subadmin-toolbar-btn superadmin-subadmin-action-btn" onClick={() => setEditing(c)}>
                  <FontAwesomeIcon icon={faPenToSquare} /> Edit
                </button>
                <button type="button" className="subadmin-toolbar-btn superadmin-subadmin-action-btn superadmin-subadmin-suspend-btn" onClick={() => handleDelete(c)}>
                  <FontAwesomeIcon icon={faTrashCan} /> Delete
                </button>
              </div>
            </div>
          )
        })}

        {courses.length === 0 && !editing && <p className="attendance-no-record">No courses yet — add your first one above.</p>}
      </div>
    </div>
  )
}

export default Courses
