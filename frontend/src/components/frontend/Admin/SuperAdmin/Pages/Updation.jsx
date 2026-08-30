import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsRotate, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import SuperAdminTopbar from '../Layout/SuperAdminTopbar.jsx'
import { api } from '../../../../../api/client.js'

const statusOptions = ['enrolled', 'completed', 'dropout']

// A real bulk-operations tool: change many students' status at once by roll
// number, instead of opening each one individually from the Students page.
function Updation() {
  const [rollText, setRollText] = useState('')
  const [status, setStatus] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    const rolls = rollText.split(',').map((r) => r.trim()).filter(Boolean)
    if (rolls.length === 0 || !status) return setError('Enter roll numbers and pick a status.')

    setLoading(true)
    let updated = 0
    const notFound = []
    for (const roll of rolls) {
      try {
        const student = await api.get(`/students/by-roll/${roll}`)
        await api.put(`/students/${student._id}/status`, { status })
        updated++
      } catch {
        notFound.push(roll)
      }
    }
    setResult({ updated, notFound })
    setLoading(false)
  }

  return (
    <div className="superadmin-page">
      <SuperAdminTopbar breadcrumb={['Home', 'Updation']} />

      <p className="subadmin-role-hint" style={{ marginBottom: 14 }}>
        <FontAwesomeIcon icon={faCircleInfo} /> Bulk-update multiple students' status at once by roll number —
        handy at the end of a batch when several students finish or drop out together.
      </p>

      {error && <div className="auth-error-banner">{error}</div>}

      <form className="updation-form-box" onSubmit={handleUpdate}>
        <div className="auth-input-group">
          <label className="auth-input-label">Roll Numbers</label>
          <textarea
            className="feedback-textarea updation-textarea"
            rows={6}
            placeholder="Roll numbers example: 100011,100012,100013"
            value={rollText}
            onChange={(e) => setRollText(e.target.value)}
          ></textarea>
        </div>

        <div className="auth-input-group">
          <label className="auth-input-label">Set Status</label>
          <div className="auth-input-wrap">
            <select className="auth-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Select status</option>
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" className="auth-btn-primary updation-submit-btn" disabled={!status || !rollText.trim() || loading}>
          <FontAwesomeIcon icon={faArrowsRotate} /> {loading ? 'Updating...' : 'Update'}
        </button>

        <p className="updation-helper-text">
          Use this link for comma separated values: <a href="https://arraythis.com" target="_blank" rel="noreferrer">Text to Array Converter</a>
        </p>
      </form>

      {result && (
        <div className="updation-result-box">
          <p><strong>{result.updated}</strong> student(s) updated to status "{status}".</p>
          {result.notFound.length > 0 && (
            <p className="updation-result-warning">Not found: {result.notFound.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default Updation
