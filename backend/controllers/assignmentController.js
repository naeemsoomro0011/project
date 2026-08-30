import Assignment from '../models/Assignment.js'
import AssignmentSubmission from '../models/AssignmentSubmission.js'
import Slot from '../models/Slot.js'
import { asyncHandler } from '../middleware/errorHandler.js'

// Same fix as the student's Assignments page: a due date on its own means
// midnight, so comparing `now > dueDate` directly marked every submission
// made on the actual due day as "late". This builds the real due moment -
// the specific due time if the teacher set one, otherwise end of that day.
function getDueMoment(assignment) {
  const due = new Date(assignment.dueDate)
  if (assignment.dueTime) {
    const [h, m] = assignment.dueTime.split(':').map(Number)
    due.setHours(h || 0, m || 0, 59, 999)
  } else {
    due.setHours(23, 59, 59, 999)
  }
  return due
}

export const assignmentsForStudentInSlot = asyncHandler(async (req, res) => {
  const { studentId } = req.params
  const { slot } = req.query
  if (!slot) return res.status(400).json({ message: 'A slot is required.' })

  const assignments = await Assignment.find({ slot, isDeleted: false }).sort({ createdAt: -1 })
  const submissions = await AssignmentSubmission.find({ student: studentId, assignment: { $in: assignments.map((a) => a._id) } })
  const subByAssignment = new Map(submissions.map((s) => [String(s.assignment), s]))

  res.json(assignments.map((a) => ({ ...a.toObject(), studentSubmission: subByAssignment.get(String(a._id)) || null })))
})

export const createAssignment = asyncHandler(async (req, res) => {
  const { slot, title, description, type, dueDate, dueTime } = req.body
  if (!slot || !title || !dueDate) {
    return res.status(400).json({ message: 'Slot, title and due date are required.' })
  }
  const slotDoc = await Slot.findById(slot)
  if (!slotDoc) return res.status(404).json({ message: 'Slot not found.' })
  if (String(slotDoc.teacher) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only create assignments for your own batch.' })
  }

  const assignment = await Assignment.create({ teacher: req.user._id, slot, title, description, type, dueDate, dueTime })
  res.status(201).json(assignment)
})

export const listAssignmentsForSlot = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = 8
  const filter = { slot: req.params.slotId, isDeleted: false }

  const [assignments, total] = await Promise.all([
    Assignment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Assignment.countDocuments(filter),
  ])

  res.json({ assignments, total, page, pages: Math.ceil(total / limit) })
})

export const myAssignments = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = 8
  const filter = { slot: req.user.slot, isDeleted: false }

  const [assignments, total] = await Promise.all([
    Assignment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('teacher', 'name'),
    Assignment.countDocuments(filter),
  ])

  const submissions = await AssignmentSubmission.find({
    student: req.user._id,
    assignment: { $in: assignments.map((a) => a._id) },
  })
  const subByAssignment = new Map(submissions.map((s) => [String(s.assignment), s]))

  const withStatus = assignments.map((a) => ({
    ...a.toObject(),
    mySubmission: subByAssignment.get(String(a._id)) || null,
  }))

  res.json({ assignments: withStatus, total, page, pages: Math.ceil(total / limit) })
})

export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
  if (!assignment) return res.status(404).json({ message: 'Assignment not found.' })
  if (String(assignment.teacher) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only edit your own assignments.' })
  }
  const { title, description, type, dueDate, dueTime } = req.body
  if (title) assignment.title = title
  if (description !== undefined) assignment.description = description
  if (type) assignment.type = type
  if (dueDate) assignment.dueDate = dueDate
  if (dueTime !== undefined) assignment.dueTime = dueTime
  await assignment.save()
  res.json(assignment)
})

export const toggleCloseSubmission = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
  if (!assignment) return res.status(404).json({ message: 'Assignment not found.' })
  if (String(assignment.teacher) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only manage your own assignments.' })
  }
  assignment.submissionClosed = !assignment.submissionClosed
  await assignment.save()
  res.json({ submissionClosed: assignment.submissionClosed })
})

export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
  if (!assignment) return res.status(404).json({ message: 'Assignment not found.' })
  if (String(assignment.teacher) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only delete your own assignments.' })
  }
  await AssignmentSubmission.deleteMany({ assignment: assignment._id })
  await Assignment.findByIdAndDelete(assignment._id)
  res.json({ message: 'Assignment deleted.' })
})

export const assignmentSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
  if (!assignment) return res.status(404).json({ message: 'Assignment not found.' })
  const submissions = await AssignmentSubmission.find({ assignment: assignment._id }).populate('student', 'name roll photo')
  const approved = submissions.filter((s) => s.status === 'Approved').length
  const notApproved = submissions.filter((s) => s.status === 'Not Approved').length
  const pending = submissions.filter((s) => s.status === 'Pending').length
  res.json({ submissions, counts: { approved, notApproved, pending, total: submissions.length } })
})

export const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
  if (!assignment) return res.status(404).json({ message: 'Assignment not found.' })
  if (String(assignment.slot) !== String(req.user.slot)) {
    return res.status(403).json({ message: 'This assignment is not for your batch.' })
  }
  if (assignment.submissionClosed) {
    return res.status(400).json({ message: 'The teacher has closed submissions for this assignment.' })
  }

  const { link, notes, image } = req.body
  const now = new Date()
  const isLate = now > getDueMoment(assignment)

  let submission = await AssignmentSubmission.findOne({ assignment: assignment._id, student: req.user._id })
  const isEdited = !!(submission && submission.submittedAt)

  if (submission) {
    submission.link = link
    submission.notes = notes
    submission.image = image
    submission.submittedAt = now
    submission.isLate = isLate
    submission.isEdited = isEdited
    submission.status = 'Pending'
  } else {
    submission = new AssignmentSubmission({
      assignment: assignment._id, student: req.user._id, link, notes, image,
      submittedAt: now, isLate, status: 'Pending',
    })
  }
  await submission.save()
  res.status(201).json(submission)
})

export const setSubmissionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!['Approved', 'Not Approved', 'Pending'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' })
  }
  const submission = await AssignmentSubmission.findById(req.params.id).populate('assignment')
  if (!submission) return res.status(404).json({ message: 'Submission not found.' })
  if (String(submission.assignment.teacher) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only grade submissions for your own assignments.' })
  }
  submission.status = status
  await submission.save()
  res.json(submission)
})
