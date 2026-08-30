import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass, faFilter, faFileExport, faPlus, faEye, faTag,
  faPenToSquare, faPaperPlane, faDownload, faChevronLeft, faChevronRight, faFilePdf, faTrashCan,
} from '@fortawesome/free-solid-svg-icons'
import SuperAdminTopbar from '../Layout/SuperAdminTopbar.jsx'
import FiltersPopup from '../Popups/FiltersPopup.jsx'
import ChangeStatusPopup from '../Popups/ChangeStatusPopup.jsx'
import PaymentsPopup from '../Popups/PaymentsPopup.jsx'
import DownloadProgressPopup from '../../../shared/DownloadProgressPopup.jsx'
import { api } from '../../../../../api/client.js'
import { useAlert } from '../../../../../context/AlertContext.jsx'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

function statusChipClass(status) {
  if (status === 'enrolled' || status === 'completed') return 'student-status-good'
  return 'student-status-bad'
}
function paymentChipClass(status) {
  if (status === 'Paid') return 'student-payment-good'
  if (status === 'Pending') return 'student-payment-pending'
  return 'student-payment-none'
}

// Same page as Sub Admin's Students, minus the single-campus lock - Super
// Admin sees every campus at once (with a Campus column + filter to narrow
// down), everything else - search, filters, export, add, edit, PDF - works
// exactly the same way against the same API.
function Students() {
  const navigate = useNavigate()
  const { confirmAction, success, error: alertError } = useAlert()
  const [allStudents, setAllStudents] = useState([])
  const [campuses, setCampuses] = useState([])
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [campusFilter, setCampusFilter] = useState('')
  const [appliedFilters, setAppliedFilters] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusTarget, setStatusTarget] = useState(null)
  const [paymentsTarget, setPaymentsTarget] = useState(null)
  const [exportPopup, setExportPopup] = useState(false)
  const [downloadListPopup, setDownloadListPopup] = useState(false)
  const [downloadTarget, setDownloadTarget] = useState(null) // student being downloaded

  const load = useCallback(() => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (campusFilter) params.set('campus', campusFilter)
    api.get(`/students?${params}`).then(setAllStudents).catch((err) => setError(err.message || 'Could not load students.'))
  }, [search, campusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { api.get('/campuses').then(setCampuses).catch(() => {}) }, [])

  const filtered = useMemo(() => {
    let list = allStudents
    if (appliedFilters) {
      const f = appliedFilters
      if (f.course) list = list.filter((s) => s.course?._id === f.course)
      if (f.status) list = list.filter((s) => s.status === f.status)
      if (f.paymentStatus) list = list.filter((s) => s.paymentStatus === f.paymentStatus)
      if (f.gender) list = list.filter((s) => s.gender === f.gender)
      if (f.laptop) list = list.filter((s) => (f.laptop === 'yes' ? s.hasLaptop : !s.hasLaptop))
    }
    return list
  }, [allStudents, appliedFilters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const start = (page - 1) * pageSize
  const pageItems = filtered.slice(start, start + pageSize)

  const handleExport = () => setExportPopup(true)

  const handleDownloadRecord = (student) => setDownloadTarget(student)

  const handleDeleteStudent = async (student) => {
    const ok = await confirmAction({
      title: `Delete ${student.name}?`,
      message: `This permanently deletes ${student.name}'s (Roll ${student.roll}) record - they will no longer be able to log in, and they'll be removed from their course/campus. This can't be undone.`,
      confirmText: 'Yes, delete',
    })
    if (!ok) return
    try {
      await api.delete(`/students/${student._id}`)
      success(`${student.name}'s record has been deleted.`, 'Student Deleted')
      load()
    } catch (err) {
      alertError(err.message || 'Could not delete this student.')
    }
  }

  return (
    <div className="superadmin-page">
      <SuperAdminTopbar breadcrumb={['Home', 'Students']} />

      {error && <div className="auth-error-banner">{error}</div>}

      <div className="students-toolbar">
        <div className="course-landing-search-wrap students-search-wrap">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="course-landing-search-icon" />
          <input
            type="text"
            className="course-landing-search-input"
            placeholder="Search by name, roll, CNIC or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <select className="auth-input subadmin-toolbar-btn" style={{ maxWidth: 200 }} value={campusFilter} onChange={(e) => { setCampusFilter(e.target.value); setPage(1) }}>
          <option value="">All Campuses</option>
          {campuses.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.city})</option>)}
        </select>

        <button type="button" className="subadmin-toolbar-btn" onClick={() => setShowFilters(true)}>
          <FontAwesomeIcon icon={faFilter} /> Filters
        </button>

        <button type="button" className="subadmin-toolbar-btn" onClick={handleExport}>
          <FontAwesomeIcon icon={faFileExport} /> Export
        </button>

        <button type="button" className="subadmin-toolbar-btn subadmin-toolbar-btn-primary" onClick={() => setDownloadListPopup(true)}>
          <FontAwesomeIcon icon={faFilePdf} /> Download PDF
        </button>

        <button type="button" className="subadmin-toolbar-btn subadmin-toolbar-btn-primary" onClick={() => navigate('/admin/superadmin/students/add')}>
          <FontAwesomeIcon icon={faPlus} /> Add New
        </button>
      </div>

      <div className="students-table-box">
        <div className="students-table-head superadmin-students-table-head">
          <span>Roll No</span>
          <span>Student Name</span>
          <span>CNIC</span>
          <span>Course</span>
          <span>Campus</span>
          <span>Status</span>
          <span>Payment</span>
          <span>Action</span>
        </div>

        {pageItems.map((s) => (
          <div key={s._id} className="students-table-row superadmin-students-table-head">
            <span className="students-row-roll">{s.roll}</span>
            <span className="students-row-name">{s.name}</span>
            <span>{s.cnic}</span>
            <span className="students-row-course">{s.course?.name}</span>
            <span>{s.campus?.name}</span>
            <span className={`student-status-chip ${statusChipClass(s.status)}`}>{s.status}</span>
            <span className={`student-payment-chip ${paymentChipClass(s.paymentStatus)}`}>{s.paymentStatus}</span>
            <span className="students-row-actions">
              <FontAwesomeIcon icon={faEye} className="assignment-action-icon" title="View" onClick={() => navigate(`/admin/superadmin/students/${s._id}`)} />
              <FontAwesomeIcon icon={faTag} className="assignment-action-icon" title="Change Status" onClick={() => setStatusTarget(s)} />
              <FontAwesomeIcon icon={faPenToSquare} className="assignment-action-icon" title="Edit" onClick={() => navigate(`/admin/superadmin/students/${s._id}`, { state: { openEdit: true } })} />
              <FontAwesomeIcon icon={faPaperPlane} className="assignment-action-icon" title="Payments" onClick={() => setPaymentsTarget(s)} />
              <FontAwesomeIcon
                icon={faDownload}
                className="assignment-action-icon"
                title="Download Record"
                onClick={() => handleDownloadRecord(s)}
                style={{ opacity: downloadTarget?._id === s._id ? 0.5 : 1 }}
              />
              <FontAwesomeIcon
                icon={faTrashCan}
                className="assignment-action-icon"
                title="Delete Student"
                onClick={() => handleDeleteStudent(s)}
              />
            </span>
          </div>
        ))}

        {pageItems.length === 0 && <p className="attendance-no-record">No students match your search/filters.</p>}

        <div className="students-pagination-row">
          <span className="assignment-pagination-text">
            {filtered.length === 0 ? '0' : `${start + 1}-${Math.min(start + pageSize, filtered.length)}`} of {filtered.length} items
          </span>
          <div className="assignment-pagination-btns">
            <button type="button" className="assignment-page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <span className="students-page-number">{page}</span>
            <button type="button" className="assignment-page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
            <select
              className="students-page-size-select"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
            >
              {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
        </div>
      </div>

      <FiltersPopup show={showFilters} onClose={() => setShowFilters(false)} onApply={(f) => { setAppliedFilters(f); setPage(1) }} />

      {statusTarget && (
        <ChangeStatusPopup student={statusTarget} onClose={() => setStatusTarget(null)} onSave={load} />
      )}

      {paymentsTarget && (
        <PaymentsPopup student={paymentsTarget} onClose={() => setPaymentsTarget(null)} />
      )}

      {exportPopup && (
        <DownloadProgressPopup
          title="Preparing your export..."
          successTitle="Students Exported Successfully!"
          run={() => api.download(
            campusFilter ? `/export/students?campus=${campusFilter}` : '/export/students',
            'students-export.xlsx'
          )}
          onClose={() => setExportPopup(false)}
        />
      )}

      {downloadListPopup && (
        <DownloadProgressPopup
          title="Preparing students PDF..."
          successTitle="Students List Downloaded Successfully!"
          run={() => api.download(
            campusFilter ? `/pdf/students?campus=${campusFilter}` : '/pdf/students',
            'students-list.pdf'
          )}
          onClose={() => setDownloadListPopup(false)}
        />
      )}

      {downloadTarget && (
        <DownloadProgressPopup
          title="Preparing student record..."
          successTitle="Record Downloaded Successfully!"
          run={() => api.download(`/pdf/student/${downloadTarget._id}`, `${downloadTarget.roll}-audit.pdf`)}
          onClose={() => setDownloadTarget(null)}
        />
      )}
    </div>
  )
}

export default Students
