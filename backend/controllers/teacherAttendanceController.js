import TeacherAttendance from '../models/TeacherAttendance.js'
import TeacherAttendanceRequest from '../models/TeacherAttendanceRequest.js'
import Teacher from '../models/Teacher.js'
import Slot from '../models/Slot.js'
import { asyncHandler } from '../middleware/errorHandler.js'

// "Today" for attendance purposes always means the campus's Pakistan
// calendar day, not the server process's own local day - same reasoning
// as toUtcMidnight() in attendanceController.js.
function todayAtMidnight() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date()) // "YYYY-MM-DD"
  const [y, m, d] = parts.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// "02:00 PM" -> minutes since midnight, so it can be compared against a Date's own minutes-since-midnight.
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!match) return null
  let [, h, m, period] = match
  h = parseInt(h, 10)
  m = parseInt(m, 10)
  if (period) {
    period = period.toUpperCase()
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
  }
  return h * 60 + m
}

// A slot's startTime ("12:00 PM") is always the campus's *local* Pakistan
// wall-clock time. Computing "how many minutes late" by calling
// now.getHours()/getMinutes() reads the server process's own local
// timezone instead - on any server not itself running in Asia/Karachi
// (e.g. a UTC cloud box, which is 5 hours behind), that silently produced
// a lateMinutes far lower than reality, clamped to 0 by Math.max(0, ...)
// whenever the UTC clock hadn't yet reached the scheduled minute-of-day.
// That's exactly why "Total Late Time" kept showing 0 even for genuinely
// late check-ins. Reading the wall-clock minutes explicitly in
// Asia/Karachi (regardless of what timezone the server itself runs in)
// fixes it for good.
function minutesSinceMidnightInKarachi(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const h = Number(parts.find((p) => p.type === 'hour').value)
  const m = Number(parts.find((p) => p.type === 'minute').value)
  return h * 60 + m
}

// Employee IDs are free-typed text (e.g. "TR-1001"), so escape anything a
// person types before it goes into a RegExp - otherwise characters like
// "." or "(" would be treated as regex syntax instead of literal text.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const lookupTeacherByEmployeeId = asyncHandler(async (req, res) => {
  const raw = (req.params.employeeId || '').trim()
  if (!raw) {
    return res.status(400).json({ message: 'Please enter an Employee ID or trainer number.' })
  }

  // First try the full Employee ID exactly as typed (case-insensitive),
  // e.g. "TR-1001" - this is the same lookup as before.
  let teacher = await Teacher.findOne({ employeeId: new RegExp(`^${escapeRegex(raw)}$`, 'i') }).select('-password')

  // If that didn't match and what was typed is just digits (e.g. "1001"),
  // fall back to matching the numeric part of any trainer's Employee ID -
  // so scanning/typing the bare number works too, not just the full ID.
  if (!teacher && /^\d+$/.test(raw)) {
    const candidates = await Teacher.find({ employeeId: new RegExp(escapeRegex(raw)) }).select('-password')
    teacher = candidates.find((c) => c.employeeId.replace(/\D/g, '') === raw) || null
  }

  if (!teacher) return res.status(404).json({ message: 'No trainer found with this Employee ID.' })
  const slots = await Slot.find({ teacher: teacher._id, isDeleted: false }).populate('course', 'name')
  res.json({ teacher, slots })
})

export const checkIn = asyncHandler(async (req, res) => {
  const { teacherId, slotId } = req.body
  const slot = await Slot.findById(slotId)
  if (!slot) return res.status(404).json({ message: 'Slot not found.' })

  const day = todayAtMidnight()
  const existing = await TeacherAttendance.findOne({ teacher: teacherId, slot: slotId, date: day })
  if (existing && existing.checkIn) {
    return res.status(409).json({ message: 'This trainer has already checked in for this slot today.' })
  }

  const now = new Date()
  const scheduledStart = parseTimeToMinutes(slot.startTime)
  const nowMinutes = minutesSinceMidnightInKarachi(now)
  const lateMinutes = scheduledStart !== null ? Math.max(0, nowMinutes - scheduledStart) : 0

  const record = await TeacherAttendance.findOneAndUpdate(
    { teacher: teacherId, slot: slotId, date: day },
    { teacher: teacherId, slot: slotId, date: day, checkIn: now, lateMinutes, markedBy: req.user._id, markedByModel: req.role === 'superadmin' ? 'SuperAdmin' : 'SubAdmin' },
    { upsert: true, new: true }
  )
  res.json(record)
})

export const checkOut = asyncHandler(async (req, res) => {
  const { teacherId, slotId } = req.body
  const day = todayAtMidnight()
  const record = await TeacherAttendance.findOne({ teacher: teacherId, slot: slotId, date: day })
  if (!record || !record.checkIn) {
    return res.status(400).json({ message: 'This trainer has not checked in yet today.' })
  }
  if (record.checkOut) {
    return res.status(409).json({ message: 'Already checked out.' })
  }

  const now = new Date()
  record.checkOut = now
  record.totalMinutes = Math.max(0, Math.round((now - record.checkIn) / 60000))
  await record.save()
  res.json(record)
})

export const todayTeacherAttendance = asyncHandler(async (req, res) => {
  const day = todayAtMidnight()
  const records = await TeacherAttendance.find({ date: day })
    .populate({ path: 'teacher', select: 'name employeeId photo campus', match: req.role === 'subadmin' ? { campus: req.user.campus } : {} })
    .populate('slot', 'batchLabel startTime endTime')
  res.json(records.filter((r) => r.teacher))
})

// Teachers scheduled for a given date, with whatever attendance record exists (or none yet).
export const viewTeacherAttendanceByDate = asyncHandler(async (req, res) => {
  const dateStr = req.query.date || new Date().toISOString().slice(0, 10)
  const date = new Date(dateStr)
  const dayOfWeek = date.getDay()
  date.setHours(0, 0, 0, 0)

  const campusFilter = req.role === 'subadmin' ? { campus: req.user.campus } : {}
  const slots = await Slot.find({ ...campusFilter, isDeleted: false, scheduleDays: dayOfWeek })
    .populate('teacher', 'name employeeId photo')
    .populate('course', 'name')

  const records = await TeacherAttendance.find({ date, slot: { $in: slots.map((s) => s._id) } })
  const recordBySlot = new Map(records.map((r) => [String(r.slot), r]))

  const rows = slots.map((s) => ({
    slot: { id: s._id, batchLabel: s.batchLabel, course: s.course?.name, startTime: s.startTime, endTime: s.endTime },
    teacher: s.teacher,
    attendance: recordBySlot.get(String(s._id)) || null,
  }))

  res.json(rows)
})

// A teacher's own (or Sub/Super Admin viewing a teacher's) attendance summary for one slot + month.
export const attendanceSummary = asyncHandler(async (req, res) => {
  const teacherId = req.params.teacherId
  const { slot, month } = req.query // month = "2026-07"
  if (!slot) return res.status(400).json({ message: 'A slot is required.' })

  const filter = { teacher: teacherId, slot }
  if (month) {
    const [y, m] = month.split('-').map(Number)
    filter.date = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) }
  }

  const records = await TeacherAttendance.find(filter).sort({ date: 1 })
  const totalClasses = records.filter((r) => r.checkIn).length
  const totalTimeSpend = records.reduce((sum, r) => sum + (r.totalMinutes || 0), 0)
  const totalLateTime = records.reduce((sum, r) => sum + (r.lateMinutes || 0), 0)

  res.json({ totalClasses, totalTimeSpend, totalLateTime, records })
})

// --- Correction requests ---
export const createAttendanceRequest = asyncHandler(async (req, res) => {
  const { date, reason } = req.body
  if (!date || !reason) return res.status(400).json({ message: 'Date and reason are required.' })
  const request = await TeacherAttendanceRequest.create({ teacher: req.user._id, date, reason })
  res.status(201).json(request)
})

export const listAttendanceRequests = asyncHandler(async (req, res) => {
  const teacherFilter = req.role === 'subadmin' ? await Teacher.find({ campus: req.user.campus }).distinct('_id') : null
  const filter = {}
  if (teacherFilter) filter.teacher = { $in: teacherFilter }
  const requests = await TeacherAttendanceRequest.find(filter).populate('teacher', 'name employeeId photo').sort({ createdAt: -1 })
  res.json(requests)
})

export const resolveAttendanceRequest = asyncHandler(async (req, res) => {
  const { status } = req.body // 'Approved' | 'Rejected'
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be Approved or Rejected.' })
  }
  const request = await TeacherAttendanceRequest.findByIdAndUpdate(
    req.params.id,
    { status, resolvedBy: req.user._id, markedByModel: req.role === 'superadmin' ? 'SuperAdmin' : 'SubAdmin' },
    { new: true }
  )
  if (!request) return res.status(404).json({ message: 'Request not found.' })
  res.json(request)
})
