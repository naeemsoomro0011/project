import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faFilter } from '@fortawesome/free-solid-svg-icons'
import { genders } from '../../../shared/permissionsConfig.js'
import { api } from '../../../../../api/client.js'

const defaultFilters = { course: '', status: '', paymentStatus: '', gender: '', laptop: '' }
const statusOptions = ['enrolled', 'dropout', 'completed']
const paymentStatusOptions = ['Paid', 'Pending', 'Not Generated']

// Country/City/Campus filters were removed - a Sub Admin only ever sees
// their own single campus, so those were always going to be "Any" anyway.
function FiltersPopup({ show, onClose, onApply }) {
  const [filters, setFilters] = useState(defaultFilters)
  const [courses, setCourses] = useState([])

  useEffect(() => {
    if (show) api.get('/courses').then(setCourses).catch(() => {})
  }, [show])

  if (!show) return null

  const set = (field) => (e) => setFilters({ ...filters, [field]: e.target.value })

  return (
    <div className="generic-popup-overlay">
      <div className="filters-popup-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faFilter} /> Filters
          </span>
          <button className="generic-popup-close" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="filters-grid">
          <div className="auth-input-group">
            <label className="auth-input-label">Course</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={filters.course} onChange={set('course')}>
                <option value="">Any</option>
                {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-input-label">Status</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={filters.status} onChange={set('status')}>
                <option value="">Any</option>
                {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-input-label">Payment Status</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={filters.paymentStatus} onChange={set('paymentStatus')}>
                <option value="">Any</option>
                {paymentStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-input-label">Gender</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={filters.gender} onChange={set('gender')}>
                <option value="">Any</option>
                {genders.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-input-label">Has Laptop</label>
            <div className="auth-input-wrap">
              <select className="auth-input" value={filters.laptop} onChange={set('laptop')}>
                <option value="">Any</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>

        <div className="feedback-confirm-btn-row">
          <button className="generic-popup-btn-outline" onClick={() => { setFilters(defaultFilters); onApply(null); onClose() }}>Clear</button>
          <button className="generic-popup-btn" onClick={() => { onApply(filters); onClose() }}>Apply Filters</button>
        </div>
      </div>
    </div>
  )
}

export default FiltersPopup
