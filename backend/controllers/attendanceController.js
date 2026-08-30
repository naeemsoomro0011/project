import Attendance from '../models/Attendance.js'
import Student from '../models/Student.js'
import Slot from '../models/Slot.js'
import { asyncHandler } from '../middleware/errorHandler.js'

function toDayKey(date) {
  return new Date(date).toISOString().slice(0, 10)
}

// Turns any date input (a "YYYY-MM-DD" string from a <input type="date">,
// or a full Date/timestamp like Student.registrationDate) into a genuine
// UTC midnight for that calendar day.
//
// The previous version used `.setHours(0,0,0,0)`, which zeroes the *server's
// local* clock time, not UTC time. On a server whose local timezone isn't
// UTC (e.g. Asia/Karachi, UTC+5), that quietly shifted the stored date
// backwards by a day - which is exactly why attendance marked for one date
// could show up under a different date. Reading the UTC year/month/day
// components directly and rebuilding with Date.UTC() is timezone-proof: the
// same input always produces the same stored day no matter what timezone
// the Node process happens to be running in.
function toUtcMidnight(input) {
  const d = new Date(input)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

// Builds every scheduled class date between a student's registration date
// and "today" (inclusive), based on their slot's scheduleDays (0=Sun..6=Sat).
function scheduledClassDates(registrationDate, scheduleDays, until = new Date()) {
  const dates = []
  const cursor = toUtcMidnight(registrationDate)
  const end = toUtcMidnight(until)

  while (cursor <= end) {
    if (scheduleDays.includes(cursor.getUTCDay())) {
      dates.push(new Date(cursor))
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return dates
}

// Core summary used by both the Sub Admin "view attendance" screen and the
// Student's own Attendance tab. Any scheduled class day with no explicit
// record is treated as Absent, exactly as the spec requires.
//
// IMPORTANT: the day list used to be *only* the slot's computed schedule
// dates (scheduledClassDates). That meant if an admin marked attendance for
// a date that didn't line up with the slot's scheduleDays - e.g. a makeup
// class, a one-off Saturday session, or simply because the slot's schedule
// was edited after the fact - the record was saved successfully in the
// Attendance collection but silently dropped from every summary, because
// that date was never in the "expected" list. That's exactly the bug where
// "admin marked attendance, but it doesn't show/count for the student":
// the record existed, the summary just never looked at it.
//
// Fix: the day list is now the *union* of the slot's scheduled class dates
// and any date that actually has an Attendance record for this student, so
// a real marked record is always counted, whether or not it falls on a
// "regular" scheduled day.
async function buildAttendanceSummary(student) {
  const slot = await Slot.findById(student.slot).catch(() => null)
  const scheduleDays = slot ? slot.scheduleDays : []
  const scheduledDates = scheduledClassDates(student.registrationDate, scheduleDays)

  const records = await Attendance.find({ student: student._id }).lean()
  const recordsByDay = new Map(records.map((r) => [toDayKey(r.date), r.status]))

  const allDayKeys = new Set(scheduledDates.map(toDayKey))
  records.forEach((r) => allDayKeys.add(toDayKey(r.date)))

  let present = 0, absent = 0, leave = 0
  const days = [...allDayKeys].sort().map((key) => {
    const status = recordsByDay.get(key) || 'Absent'
    if (status === 'Present') present++
    else if (status === 'Leave') leave++
    else absent++
    return { date: key, status }
  })

  const totalClasses = days.length
  const percentage = totalClasses ? Math.round((present / totalClasses) * 1000) / 10 : 0

  let remark = { text: '', level: 'neutral' }
  if (totalClasses > 0) {
    if (percentage >= 90) remark = { text: 'Your attendance is Outstanding, please continue like that!', level: 'outstanding' }
    else if (percentage >= 70) remark = { text: 'Your attendance is good. Keep it up!', level: 'good' }
    else remark = { text: 'Your attendance is not good, please improve your attendance!', level: 'warning' }
  }

  return { totalClasses, present, absent, leave, percentage, remark, days }
}

export const attendanceForSlotOnDate = asyncHandler(async (req, res) => {
  const { slotId } = req.params
  const dateStr = req.query.date || new Date().toISOString().slice(0, 10)
  const day = toUtcMidnight(dateStr)

  if (req.role === 'teacher') {
    const slotDoc = await Slot.findById(slotId)
    if (!slotDoc || String(slotDoc.teacher) !== String(req.user._id)) {
      return res.status(403).json({ message: 'This is not your batch.' })
    }
  }

  const students = await Student.find({ slot: slotId, status: { $ne: 'dropout' } }).select('name roll')
  const records = await Attendance.find({ slot: slotId, date: day })
  const recordByStudent = new Map(records.map((r) => [String(r.student), r.status]))

  res.json(students.map((s) => ({
    _id: s._id,
    name: s.name,
    roll: s.roll,
    status: recordByStudent.get(String(s._id)) || 'Absent',
  })))
})

export const markAttendance = asyncHandler(async (req, res) => {
  const { studentId, date, status } = req.body
  if (!studentId || !date || !status) {
    return res.status(400).json({ message: 'Student, date and status are required.' })
  }
  const student = await Student.findById(studentId)
  if (!student) return res.status(404).json({ message: 'Student not found.' })
  if (req.role === 'subadmin' && String(student.campus) !== String(req.user.campus)) {
    return res.status(403).json({ message: 'This student belongs to a different campus.' })
  }
  if (student.status === 'dropout') {
    return res.status(400).json({ message: `${student.name} has dropped out - attendance can't be marked for this student.` })
  }

  const day = toUtcMidnight(date)

  const record = await Attendance.findOneAndUpdate(
    { student: studentId, date: day },
    { student: studentId, slot: student.slot, date: day, status, markedBy: req.user._id, markedByModel: req.role === 'superadmin' ? 'SuperAdmin' : 'SubAdmin' },
    { upsert: true, new: true }
  )
  res.json(record)
})

export const markMultipleAttendance = asyncHandler(async (req, res) => {
  const { rollNumbers, date, status } = req.body
  if (!Array.isArray(rollNumbers) || !rollNumbers.length || !date || !status) {
    return res.status(400).json({ message: 'Roll numbers (array), date and status are required.' })
  }

  const day = toUtcMidnight(date)

  const results = []
  for (const rawRoll of rollNumbers) {
    const roll = String(rawRoll).trim()
    if (!roll) continue
    const student = await Student.findOne({ roll })
    if (!student) {
      results.push({ roll, ok: false, message: 'Roll number not found.' })
      continue
    }
    if (req.role === 'subadmin' && String(student.campus) !== String(req.user.campus)) {
      results.push({ roll, ok: false, message: 'Belongs to a different campus.' })
      continue
    }
    if (student.status === 'dropout') {
      results.push({ roll, ok: false, message: 'Student has dropped out - attendance not marked.' })
      continue
    }
    await Attendance.findOneAndUpdate(
      { student: student._id, date: day },
      { student: student._id, slot: student.slot, date: day, status, markedBy: req.user._id, markedByModel: req.role === 'superadmin' ? 'SuperAdmin' : 'SubAdmin' },
      { upsert: true, new: true }
    )
    results.push({ roll, ok: true, name: student.name })
  }

  res.json({ results })
})

export const recentAttendance = asyncHandler(async (req, res) => {
  const filter = req.role === 'subadmin' ? {} : {}
  const records = await Attendance.find(filter)
    .populate({ path: 'student', select: 'name roll campus photo', match: req.role === 'subadmin' ? { campus: req.user.campus } : {} })
    .sort({ createdAt: -1 })
    .limit(24)

  const filtered = records.filter((r) => r.student).slice(0, 8)
  res.json(filtered)
})

export const viewAttendanceByRoll = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ roll: req.params.roll }).populate('course', 'name')
  if (!student) return res.status(404).json({ message: 'No student found with this roll number.' })
  if (req.role === 'subadmin' && String(student.campus) !== String(req.user.campus)) {
    return res.status(403).json({ message: 'This student belongs to a different campus.' })
  }
  const summary = await buildAttendanceSummary(student)
  res.json({
    student: { name: student.name, roll: student.roll, course: student.course?.name, photo: student.photo },
    ...summary,
  })
})

export const myAttendance = asyncHandler(async (req, res) => {
  const summary = await buildAttendanceSummary(req.user)
  res.json(summary)
})

export const attendanceForStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId).populate('course', 'name')
  if (!student) return res.status(404).json({ message: 'Student not found.' })
  const summary = await buildAttendanceSummary(student)
  res.json({
    student: { name: student.name, roll: student.roll, course: student.course?.name, photo: student.photo },
    ...summary,
  })
})
