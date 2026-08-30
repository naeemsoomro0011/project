import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsRotate, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons'
import StudentTopbar from '../Layout/StudentTopbar.jsx'
import { formatDate } from '../../Media/dateUtils.js'
import { api } from '../../../../api/client.js'

const jazzCashSteps = [
  'Open JazzCash app',
  'Click on More',
  'Go to Education tab',
  'Click Universities',
  'Select Saylani Education from the list',
  'Paste your Voucher ID',
  'Pay your fee',
]

function statusClass(status) {
  return status === 'Paid' ? 'fee-status-paid' : 'voucher-status-pending'
}

function Payment() {
  const { openFeedback } = useOutletContext()
  const [vouchers, setVouchers] = useState([])
  const [showRefreshPopup, setShowRefreshPopup] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    api.get('/vouchers/me').then(setVouchers).catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  const handleRefresh = () => {
    setRefreshing(true)
    api.get('/vouchers/me').then((res) => {
      setVouchers(res)
      setRefreshing(false)
      setShowRefreshPopup(true)
    }).catch(() => setRefreshing(false))
  }

  return (
    <div className="student-page">
      <StudentTopbar breadcrumb={['Home', 'Payment']} onFeedbackClick={openFeedback} />

      <div className="payment-instructions-box">
        <div className="payment-instructions-text">
          <h4 className="payment-instructions-heading">To pay your fee via JazzCash:</h4>
          <ol className="payment-instructions-list">
            {jazzCashSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="payment-video-phone payment-video-embed-wrap">
          <iframe
            className="payment-video-iframe"
            src="https://www.youtube.com/embed/jogZUXqx-8E"
            title="How to pay your fee through JazzCash"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      <div className="payment-refresh-row">
        <button type="button" className="payment-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
          <FontAwesomeIcon icon={faArrowsRotate} spin={refreshing} /> {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="fee-history-box">
        <div className="fee-challan-header fee-challan-header-wide">
          <span>Month</span>
          <span>Amount</span>
          <span>Type</span>
          <span>Due Date</span>
          <span>Voucher ID</span>
          <span>Status</span>
        </div>
        {vouchers.map((v) => (
          <div key={v._id} className="fee-challan-row fee-challan-header-wide">
            <span>{v.month}</span>
            <span>Rs. {v.amount}</span>
            <span>{v.type}</span>
            <span>{formatDate(new Date(v.dueDate))}</span>
            <span>{v.invoiceNo}</span>
            <span className={statusClass(v.status)}>{v.status}</span>
          </div>
        ))}
        {vouchers.length === 0 && <p className="attendance-no-record">No vouchers generated yet — your Sub Admin generates these once a month.</p>}
      </div>

      {showRefreshPopup && (
        <div className="generic-popup-overlay">
          <div className="generic-popup-card">
            <div className="generic-popup-icon-wrap">
              <FontAwesomeIcon icon={faMoneyBillWave} className="generic-popup-icon" />
            </div>
            <h3 className="generic-popup-title">Fee Status Refreshed</h3>
            <p className="generic-popup-text">
              Showing {vouchers.length} voucher{vouchers.length === 1 ? '' : 's'} on file.
            </p>
            <button className="generic-popup-btn" onClick={() => setShowRefreshPopup(false)}>
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payment
