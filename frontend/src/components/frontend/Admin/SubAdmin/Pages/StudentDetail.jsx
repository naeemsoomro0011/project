import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { formatDate } from '../../../Media/dateUtils.js'
import {
  faUser, faGraduationCap, faAddressCard, faBookOpen, faClockRotateLeft,
  faFilePdf, faPenToSquare, faMoneyBillWave, faPlus, faArrowLeft,
} from '@fortawesome/free-solid-svg-icons'
import SubAdminTopbar from '../Layout/SubAdminTopbar.jsx'
import Avatar from '../../../Media/Avatar.jsx'
import EditStudentPopup from '../Popups/EditStudentPopup.jsx'
import { hasPermission } from '../data/subAdminData.js'
import { api } from '../../../../../api/client.js'

const tabs = [
  { id: 'personal', label: 'Personal', icon: faUser },
  { id: 'education', label: 'Education', icon: faGraduationCap },
  { id: 'contact', label: 'Contact', icon: faAddressCard },
  { id: 'courses', label: 'Courses', icon: faBookOpen },
]

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function statusClass(status) {
  if (status === 'Paid') return 'fee-status-paid'
  if (status === 'Pending') return 'voucher-status-pending'
  return 'voucher-status-none'
}

function StudentDetail() {
  const { studentId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [student, setStudent] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('personal')
  const [showEdit, setShowEdit] = useState(!!location.state?.openEdit)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [vouchers, setVouchers] = useState([])
  const [voucherAmount, setVoucherAmount] = useState('')

  const load = useCallback(() => {
    api.get(`/students/${studentId}`).then(setStudent).catch(() => setNotFound(true))
    api.get(`/vouchers/student/${studentId}`).then(setVouchers).catch(() => {})
  }, [studentId])

  useEffect(() => { load() }, [load])

  if (notFound) {
    return (
      <div className="subadmin-page">
        <SubAdminTopbar breadcrumb={['Home', 'Students', 'Not Found']} />
        <p>Student not found.</p>
        <button type="button" className="auth-btn-secondary" onClick={() => navigate('/admin/subadmin/students')} style={{ maxWidth: 220 }}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Students
        </button>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="subadmin-page">
        <SubAdminTopbar breadcrumb={['Home', 'Students', '...']} />
        <p className="subadmin-chart-title">Loading...</p>
      </div>
    )
  }

  const handleGenerateVoucher = async () => {
    setError('')
    if (!voucherAmount || Number(voucherAmount) <= 0) return setError('Enter a valid voucher amount.')
    try {
      await api.post(`/vouchers/generate/${student._id}`, { amount: Number(voucherAmount) })
      setVoucherAmount('')
      const list = await api.get(`/vouchers/student/${studentId}`)
      setVouchers(list)
    } catch (err) {
      setError(err.message || 'Could not generate voucher.')
    }
  }

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true)
    try {
      await api.download(`/pdf/student/${student._id}`, `${student.roll}-audit.pdf`)
    } catch (err) {
      setError(err.message || 'Download failed.')
    } finally {
      setGeneratingPdf(false)
    }
  }

  return (
    <div className="subadmin-page">
      <SubAdminTopbar breadcrumb={['Home', 'Students', student.name]} />

      <div className="student-detail-header">
        <Avatar name={student.name} photoUrl={student.photo} className="student-detail-avatar" />
        <div className="student-detail-header-text">
          <h2 className="student-detail-name">{student.name}</h2>
          <p className="student-detail-roll">Roll: {student.roll} &nbsp;|&nbsp; {student.course?.name} ({student.slot?.batchLabel})</p>
        </div>
        <div className="student-detail-header-actions">
          {hasPermission('STUDENT', 'UPDATE') && (
            <button type="button" className="subadmin-toolbar-btn" onClick={() => setShowEdit(true)}>
              <FontAwesomeIcon icon={faPenToSquare} /> Edit
            </button>
          )}
          <button type="button" className="subadmin-toolbar-btn subadmin-toolbar-btn-primary" onClick={handleDownloadPdf} disabled={generatingPdf}>
            <FontAwesomeIcon icon={faFilePdf} /> {generatingPdf ? 'Preparing...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {error && <div className="auth-error-banner">{error}</div>}

      <div className="course-detail-tab-row">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`course-detail-tab-btn ${activeTab === tab.id ? 'course-detail-tab-btn-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <FontAwesomeIcon icon={tab.icon} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="course-tab-box">
        {activeTab === 'personal' && (
          <div className="student-detail-info-grid">
            <p><strong>Full Name:</strong> {student.name}</p>
            <p><strong>Father Name:</strong> {student.fatherName}</p>
            <p><strong>CNIC:</strong> {student.cnic}</p>
            <p><strong>Father's CNIC:</strong> {student.fatherCnic}</p>
            <p><strong>Date of Birth:</strong> {new Date(student.dob).toDateString()}</p>
            <p><strong>Gender:</strong> {student.gender}</p>
            <p><strong>Account Created:</strong> {student.accountCreated ? 'Yes' : 'Not yet — student hasn\'t signed in'}</p>
          </div>
        )}

        {activeTab === 'education' && (
          <div className="student-detail-info-grid">
            <p><strong>Last Qualification:</strong> {student.lastQualification}</p>
            <p><strong>Computer Level:</strong> {student.computerLevel}</p>
            <p><strong>Has Laptop:</strong> {student.hasLaptop ? 'Yes' : 'No'}</p>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="student-detail-info-grid">
            <p><strong>Email:</strong> {student.email}</p>
            <p><strong>Phone:</strong> {student.phone}</p>
            <p><strong>Father's Phone:</strong> {student.fatherPhone}</p>
            <p><strong>Address:</strong> {student.address}</p>
            <p><strong>City:</strong> {student.city}</p>
            <p><strong>Campus:</strong> {student.campus?.name}</p>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="voucher-table">
            <div className="voucher-table-head student-courses-head">
              <span>Course</span>
              <span>Batch</span>
              <span>Campus</span>
              <span>Schedule</span>
              <span>Status</span>
            </div>
            <div className="voucher-table-row student-courses-head">
              <span>{student.course?.name}</span>
              <span>{student.slot?.batchLabel}</span>
              <span>{student.campus?.name}</span>
              <span>{(student.slot?.scheduleDays || []).map((d) => WEEKDAY_LABELS[d]).join('/')} {student.slot?.startTime}-{student.slot?.endTime}</span>
              <span className="student-status-chip student-status-good">{student.status}</span>
            </div>
          </div>
        )}
      </div>

      <h4 className="student-form-section-heading">
        <FontAwesomeIcon icon={faClockRotateLeft} /> History
      </h4>
      <div className="course-tab-box student-history-box">
        {student.history.map((h, idx) => (
          <p key={idx} className="student-history-line">
            <strong>{new Date(h.date).toLocaleString()}:</strong> {h.change} <span className="student-history-by">— by {h.by}</span>
          </p>
        ))}
        {student.history.length === 0 && <p className="attendance-no-record">No history yet.</p>}
      </div>

      <h4 className="student-form-section-heading">
        <FontAwesomeIcon icon={faMoneyBillWave} /> Fees &amp; Vouchers
      </h4>
      <div className="voucher-table course-tab-box">
        <div className="voucher-table-head">
          <span>Invoice #</span>
          <span>Type</span>
          <span>Month</span>
          <span>Due Date</span>
          <span>Amount</span>
          <span>Status</span>
        </div>
        {vouchers.map((v) => (
          <div key={v._id} className="voucher-table-row">
            <span>{v.invoiceNo}</span>
            <span>{v.type}</span>
            <span>{v.month}</span>
            <span>{formatDate(new Date(v.dueDate))}</span>
            <span>Rs. {v.amount}</span>
            <span className={statusClass(v.status)}>{v.status}</span>
          </div>
        ))}
        {vouchers.length === 0 && <p className="attendance-no-record">No vouchers yet.</p>}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12 }}>
          <input
            type="number"
            min="0"
            className="auth-input"
            style={{ maxWidth: 180 }}
            placeholder="Amount (Rs.)"
            value={voucherAmount}
            onChange={(e) => setVoucherAmount(e.target.value)}
          />
          <button type="button" className="course-tab-new-btn student-generate-voucher-btn" onClick={handleGenerateVoucher}>
            <FontAwesomeIcon icon={faPlus} /> Generate Voucher
          </button>
        </div>
      </div>

      {showEdit && (
        <EditStudentPopup
          student={student}
          onClose={() => setShowEdit(false)}
          onSave={(updated) => setStudent((s) => ({ ...s, ...updated }))}
        />
      )}
    </div>
  )
}

export default StudentDetail
