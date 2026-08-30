import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faMoneyBillWave, faPlus, faCheck } from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../../api/client.js'
import { formatDate } from '../../../Media/dateUtils.js'

function statusClass(status) {
  return status === 'Paid' ? 'fee-status-paid' : 'voucher-status-pending'
}

function PaymentsPopup({ student, onClose }) {
  const [vouchers, setVouchers] = useState([])
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)

  const load = useCallback(() => {
    if (!student) return
    api.get(`/vouchers/student/${student._id}`).then(setVouchers).catch(() => {})
  }, [student])

  useEffect(() => { load() }, [load])

  if (!student) return null

  const handleGenerate = async () => {
    setError('')
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount.')
    setGenerating(true)
    try {
      await api.post(`/vouchers/generate/${student._id}`, { amount: Number(amount) })
      setAmount('')
      load()
    } catch (err) {
      setError(err.message || 'Could not generate voucher.')
    } finally {
      setGenerating(false)
    }
  }

  const markPaid = async (voucherId) => {
    try {
      await api.put(`/vouchers/${voucherId}/status`, { status: 'Paid' })
      load()
    } catch (err) {
      setError(err.message || 'Could not update voucher.')
    }
  }

  return (
    <div className="generic-popup-overlay">
      <div className="submissions-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={faMoneyBillWave} /> Fees &amp; Vouchers — {student.name}
          </span>
          <button className="generic-popup-close" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="voucher-table">
          <div className="voucher-table-head">
            <span>Invoice #</span>
            <span>Type</span>
            <span>Month</span>
            <span>Due Date</span>
            <span>Amount</span>
            <span>Status</span>
            <span></span>
          </div>
          {vouchers.map((v) => (
            <div key={v._id} className="voucher-table-row">
              <span>{v.invoiceNo}</span>
              <span>{v.type}</span>
              <span>{v.month}</span>
              <span>{formatDate(new Date(v.dueDate))}</span>
              <span>Rs. {v.amount}</span>
              <span className={statusClass(v.status)}>{v.status}</span>
              <span>
                {v.status !== 'Paid' && (
                  <button type="button" className="generic-popup-close" style={{ position: 'static', color: '#1E7A34' }} onClick={() => markPaid(v._id)} title="Mark Paid">
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                )}
              </span>
            </div>
          ))}
          {vouchers.length === 0 && <p className="attendance-no-record">No vouchers generated yet.</p>}
        </div>

        <p className="voucher-note">
          Note: students pay outside the system (e.g. through JazzCash). This panel only records
          the voucher and whether it has been paid.
        </p>

        <div className="edit-profile-grid" style={{ marginTop: 12 }}>
          <div className="auth-input-group">
            <label className="auth-input-label">Amount for new voucher (Rs.)</label>
            <div className="auth-input-wrap">
              <input type="number" min="0" className="auth-input" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="feedback-confirm-btn-row">
          <button className="generic-popup-btn-outline" onClick={onClose}>Close</button>
          <button className="generic-popup-btn" onClick={handleGenerate} disabled={generating}>
            <FontAwesomeIcon icon={faPlus} /> {generating ? 'Generating...' : 'Generate Voucher'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentsPopup
