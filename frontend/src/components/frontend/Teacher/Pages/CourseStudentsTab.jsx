import { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faChevronLeft, faChevronRight, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import StudentDetailPopup from '../Popups/StudentDetailPopup.jsx'
import Avatar from '../../Media/Avatar.jsx'
import { api } from '../../../../api/client.js'

const PAGE_SIZE = 8

function CourseStudentsTab({ slot }) {
  const [allStudents, setAllStudents] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState(null)

  useEffect(() => {
    api.get(`/students?slot=${slot._id}`).then(setAllStudents).catch(() => {})
  }, [slot._id])

  const filtered = useMemo(
    () => allStudents.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [allStudents, search]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const start = (page - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

  return (
    <div className="course-tab-box">
      <div className="course-detail-search-wrap" style={{ marginBottom: 14 }}>
        <FontAwesomeIcon icon={faMagnifyingGlass} className="course-landing-search-icon" />
        <input
          type="text"
          className="course-landing-search-input"
          placeholder="Search students..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <div className="student-row-head">
        <span>Photo</span>
        <span>Name</span>
        <span>Roll No</span>
        <span>Email</span>
        <span>Status</span>
        <span>Action</span>
      </div>

      {pageItems.map((s) => (
        <div key={s._id} className="student-row">
          <Avatar name={s.name} photoUrl={s.photo} className="student-row-photo" />
          <span className="student-row-name">{s.name}</span>
          <span>{s.roll}</span>
          <span className="student-row-email">{s.email}</span>
          <span className="student-row-status">{s.status}</span>
          <span>
            <FontAwesomeIcon icon={faEye} className="assignment-action-icon" onClick={() => setViewing(s)} title="View" />
          </span>
        </div>
      ))}

      {pageItems.length === 0 && <p className="attendance-no-record">No students in this batch yet.</p>}

      <div className="assignment-pagination-row">
        <span className="assignment-pagination-text">
          Showing {filtered.length === 0 ? 0 : start + 1}-{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length} records
        </span>
        <div className="assignment-pagination-btns">
          <button type="button" className="assignment-page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
            <FontAwesomeIcon icon={faChevronLeft} /> Previous
          </button>
          <button type="button" className="assignment-page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            Next <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>

      {viewing && <StudentDetailPopup student={viewing} slot={slot} onClose={() => setViewing(null)} />}
    </div>
  )
}

export default CourseStudentsTab
