import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark, faFileCircleQuestion, faCircleCheck, faPlus, faTrashCan, faCheck, faPenToSquare,
} from '@fortawesome/free-solid-svg-icons'
import { api } from '../../../../api/client.js'

function newQuestion() {
  return {
    _localId: crypto.randomUUID(),
    text: '',
    options: [
      { _localId: crypto.randomUUID(), text: '' },
      { _localId: crypto.randomUUID(), text: '' },
      { _localId: crypto.randomUUID(), text: '' },
      { _localId: crypto.randomUUID(), text: '' },
    ],
    correctIndexes: [],
  }
}

// Converts a quiz document loaded from the API (as returned by
// listQuizzesForSlot, which includes full questions/options/
// correctOptionIndexes) into this popup's local editable shape.
function questionsFromQuiz(quiz) {
  if (!quiz?.questions?.length) return [newQuestion()]
  return quiz.questions.map((q) => ({
    _localId: q._id || crypto.randomUUID(),
    text: q.text,
    options: q.options.map((o) => ({ _localId: o._id || crypto.randomUUID(), text: o.text })),
    correctIndexes: q.correctOptionIndexes || [],
  }))
}

// Teacher builds one question at a time (text + options + which single
// option is correct), rather than a rigid "enter a number and get that
// many blank boxes" flow - more forgiving to use and just as fast.
// Passing `initial` (an existing quiz) switches this into edit mode.
function CreateQuizPopup({ show, slotId, initial = null, onClose, onCreated }) {
  const isEdit = Boolean(initial)
  const [title, setTitle] = useState('')
  const [totalMarks, setTotalMarks] = useState('')
  const [timerMinutes, setTimerMinutes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [questions, setQuestions] = useState([newQuestion()])
  const [created, setCreated] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initial) {
      setTitle(initial.title || '')
      setTotalMarks(initial.totalMarks ?? '')
      setTimerMinutes(initial.timerMinutes ?? '')
      setDueDate(initial.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 10) : '')
      setDueTime(initial.dueTime || '')
      setQuestions(questionsFromQuiz(initial))
    }
  }, [initial])

  if (!show) return null

  const addQuestion = () => setQuestions([...questions, newQuestion()])
  const removeQuestion = (id) => setQuestions(questions.filter((q) => q._localId !== id))
  const setQuestionText = (id, text) => setQuestions(questions.map((q) => (q._localId === id ? { ...q, text } : q)))

  const addOption = (qId) => setQuestions(questions.map((q) => (
    q._localId === qId ? { ...q, options: [...q.options, { _localId: crypto.randomUUID(), text: '' }] } : q
  )))
  const removeOption = (qId, optId) => setQuestions(questions.map((q) => (
    q._localId === qId ? { ...q, options: q.options.filter((o) => o._localId !== optId), correctIndexes: [] } : q
  )))
  const setOptionText = (qId, optId, text) => setQuestions(questions.map((q) => (
    q._localId === qId ? { ...q, options: q.options.map((o) => (o._localId === optId ? { ...o, text } : o)) } : q
  )))
  // A teacher can mark more than one option as correct on a question (e.g.
  // "A, B and D are all acceptable answers") - so this toggles an option
  // in/out of the correct set rather than replacing it. The student side
  // still only ever lets them pick one option; they're correct if that one
  // pick lands on any option the teacher marked correct here.
  const setCorrect = (qId, optIndex) => setQuestions(questions.map((q) => (
    q._localId === qId
      ? {
          ...q,
          correctIndexes: q.correctIndexes.includes(optIndex)
            ? q.correctIndexes.filter((i) => i !== optIndex)
            : [...q.correctIndexes, optIndex],
        }
      : q
  )))

  const handleClose = () => {
    setTitle(''); setTotalMarks(''); setTimerMinutes(''); setDueDate(''); setDueTime('')
    setQuestions([newQuestion()]); setCreated(false); setError('')
    onClose()
  }

  const handleCreate = async () => {
    setError('')
    if (!title.trim() || !totalMarks || !timerMinutes || !dueDate) {
      return setError('Quiz name, total marks, timer and due date are all required.')
    }
    for (const q of questions) {
      if (!q.text.trim()) return setError('Every question needs text.')
      if (q.options.some((o) => !o.text.trim())) return setError(`"${q.text}" has an empty option.`)
      if (q.correctIndexes.length === 0) return setError(`Mark at least one correct option for "${q.text}".`)
    }

    setLoading(true)
    try {
      const payload = {
        slot: slotId,
        title,
        totalMarks: Number(totalMarks),
        timerMinutes: Number(timerMinutes),
        dueDate,
        dueTime,
        questions: questions.map((q) => ({
          text: q.text,
          options: q.options.map((o) => ({ text: o.text })),
          correctOptionIndexes: q.correctIndexes,
        })),
      }
      if (isEdit) {
        await api.put(`/quizzes/${initial._id}`, payload)
        onCreated?.()
        handleClose()
      } else {
        await api.post('/quizzes', payload)
        setCreated(true)
      }
    } catch (err) {
      setError(err.message || `Could not ${isEdit ? 'update' : 'create'} quiz.`)
    } finally {
      setLoading(false)
    }
  }

  if (created && !isEdit) {
    return (
      <div className="generic-popup-overlay">
        <div className="generic-popup-card">
          <div className="generic-popup-icon-wrap">
            <FontAwesomeIcon icon={faCircleCheck} className="generic-popup-icon" />
          </div>
          <h3 className="generic-popup-title">Quiz Created!</h3>
          <p className="generic-popup-text">{title} is now live for every student in this batch.</p>
          <button className="generic-popup-btn" onClick={() => { onCreated?.(); handleClose() }}>Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="generic-popup-overlay">
      <div className="quiz-builder-card">
        <div className="assignment-view-top">
          <span className="assignment-view-top-heading">
            <FontAwesomeIcon icon={isEdit ? faPenToSquare : faFileCircleQuestion} /> {isEdit ? 'Edit Quiz' : 'Create Quiz'}
          </span>
          <button type="button" className="generic-popup-close" onClick={handleClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="edit-profile-grid">
          <div className="auth-input-group edit-profile-grid-full">
            <label className="auth-input-label">Quiz Name</label>
            <div className="auth-input-wrap"><input className="auth-input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Total Marks</label>
            <div className="auth-input-wrap"><input type="number" min="1" className="auth-input" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Timer (minutes)</label>
            <div className="auth-input-wrap"><input type="number" min="1" className="auth-input" value={timerMinutes} onChange={(e) => setTimerMinutes(e.target.value)} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Due Date</label>
            <div className="auth-input-wrap"><input type="date" className="auth-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Due Time</label>
            <div className="auth-input-wrap"><input type="time" className="auth-input" value={dueTime} onChange={(e) => setDueTime(e.target.value)} /></div>
          </div>
        </div>

        <h4 className="student-form-section-heading">Questions ({questions.length})</h4>

        {questions.map((q, qIdx) => (
          <div key={q._localId} className="quiz-question-box">
            <div className="quiz-question-box-head">
              <span className="quiz-question-number">Q{qIdx + 1}</span>
              <input
                className="auth-input"
                placeholder="Question text"
                value={q.text}
                onChange={(e) => setQuestionText(q._localId, e.target.value)}
              />
              {questions.length > 1 && (
                <button type="button" className="generic-popup-close" style={{ position: 'static' }} onClick={() => removeQuestion(q._localId)}>
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
              )}
            </div>

            {q.options.map((opt, optIdx) => (
              <div key={opt._localId} className="quiz-option-row">
                <button
                  type="button"
                  className={`quiz-option-correct-toggle ${q.correctIndexes.includes(optIdx) ? 'quiz-option-correct-toggle-on' : ''}`}
                  onClick={() => setCorrect(q._localId, optIdx)}
                  title="Mark as the correct answer"
                  aria-pressed={q.correctIndexes.includes(optIdx)}
                >
                  <FontAwesomeIcon icon={faCheck} />
                </button>
                <span className="quiz-option-letter">{String.fromCharCode(65 + optIdx)}</span>
                <input
                  className="auth-input"
                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                  value={opt.text}
                  onChange={(e) => setOptionText(q._localId, opt._localId, e.target.value)}
                />
                {q.options.length > 2 && (
                  <button type="button" className="generic-popup-close" style={{ position: 'static' }} onClick={() => removeOption(q._localId, opt._localId)}>
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="subadmin-toolbar-btn" onClick={() => addOption(q._localId)}>
              <FontAwesomeIcon icon={faPlus} /> Add Option
            </button>
          </div>
        ))}

        <button type="button" className="course-tab-new-btn" style={{ marginTop: 4 }} onClick={addQuestion}>
          <FontAwesomeIcon icon={faPlus} /> Add Question
        </button>

        <div className="feedback-confirm-btn-row" style={{ marginTop: 20 }}>
          <button type="button" className="generic-popup-btn-outline" onClick={handleClose}>Back</button>
          <button type="button" className="generic-popup-btn" disabled={loading} onClick={handleCreate}>
            {loading ? 'Creating...' : 'Create Quiz'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateQuizPopup
