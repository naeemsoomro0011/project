import Feedback from '../models/Feedback.js'
import { asyncHandler } from '../middleware/errorHandler.js'

export const createFeedback = asyncHandler(async (req, res) => {
  const { type, message, image } = req.body
  if (!type || !message) return res.status(400).json({ message: 'Feedback type and message are required.' })
  const feedback = await Feedback.create({ student: req.user._id, campus: req.user.campus, type, message, image })
  res.status(201).json(feedback)
})

// Only feedback the *current role* hasn't read yet is returned - a Sub
// Admin opening a card only marks it read for Sub Admins (readBySubAdmin),
// so the same feedback still shows up once for Super Admin (readBySuperAdmin)
// and vice versa - each role gets its own independent "seen it" list.
export const listFeedback = asyncHandler(async (req, res) => {
  const filter = req.role === 'subadmin' ? { readBySubAdmin: false } : { readBySuperAdmin: false }
  if (req.role === 'subadmin') filter.campus = req.user.campus
  const feedback = await Feedback.find(filter)
    .populate('student', 'name email roll course photo')
    .populate({ path: 'student', populate: { path: 'course', select: 'name' } })
    .sort({ createdAt: -1 })
  res.json(feedback)
})

export const markFeedbackRead = asyncHandler(async (req, res) => {
  const field = req.role === 'subadmin' ? 'readBySubAdmin' : 'readBySuperAdmin'
  const feedback = await Feedback.findByIdAndUpdate(req.params.id, { [field]: true }, { new: true })
  if (!feedback) return res.status(404).json({ message: 'Feedback not found.' })
  res.json({ message: 'Marked as read.' })
})
