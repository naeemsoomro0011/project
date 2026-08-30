import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDay, faCheckDouble } from '@fortawesome/free-solid-svg-icons'
import SuperAdminTopbar from '../Layout/SuperAdminTopbar.jsx'
import { api } from '../../../../../api/client.js'

function AttendanceMulti() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [rollText, setRollText] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError('')
    const rolls = rollText.split(',').map((r) => r.trim()).filter(Boolean)
    if (rolls.length === 0) return setError('Enter at least one roll number.')
    setLoading(true)
    try {
      const res = await api.post('/attendance/mark-multiple', { rollNumbers: rolls, date, status: 'Present' })
      const marked = res.results.filter((r) => r.ok).length
      const notFound = res.results.filter((r) => !r.ok)
      setResult({ total: rolls.length, marked, notFound })
    } catch (err) {
      setError(err.message || 'Could not update attendance.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="superadmin-page">
      <SuperAdminTopbar breadcrumb={['Home', 'Attendance', 'Multi Attendance']} />

      {error && <div className="auth-error-banner">{error}</div>}

      <form className="updation-form-box" onSubmit={handleUpdate}>
        <div className="auth-input-group">
          <label className="auth-input-label">
            <FontAwesomeIcon icon={faCalendarDay} /> Date
          </label>
          <div className="auth-input-wrap">
            <input type="date" className="auth-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="auth-input-group">
          <label className="auth-input-label">Roll Numbers</label>
          <textarea
            className="feedback-textarea updation-textarea"
            rows={6}
            placeholder="Roll numbers example: 100011, 100012, 100013"
            value={rollText}
            onChange={(e) => setRollText(e.target.value)}
          ></textarea>
        </div>

        <button type="submit" className="auth-btn-primary updation-submit-btn" disabled={loading}>
          <FontAwesomeIcon icon={faCheckDouble} /> {loading ? 'Updating...' : 'Update'}
        </button>

        <p className="updation-helper-text">
          Use this link for comma separated values: <a href="https://arraythis.com" target="_blank" rel="noreferrer">arraythis.com</a>
        </p>
      </form>

      {result && (
        <div className="updation-result-box">
          <p><strong>{result.marked}</strong> students marked present for {date}.</p>
          {result.notFound.length > 0 && (
            <p className="updation-result-warning">
              Roll number(s) not found: {result.notFound.map((r) => r.roll).join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default AttendanceMulti
