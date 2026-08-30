import Slot from '../models/Slot.js'
import Student from '../models/Student.js'
import Teacher from '../models/Teacher.js'
import Course from '../models/Course.js'
import Campus from '../models/Campus.js'
import { asyncHandler } from '../middleware/errorHandler.js'

function scopeToCampus(req) {
  if (req.role === 'subadmin') return { campus: req.user.campus, isDeleted: false }
  const filter = { isDeleted: false }
  if (req.query.campus) filter.campus = req.query.campus
  if (req.query.city) filter.city = req.query.city
  return filter
}

export const compareProgressForCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params
  const { excludeSlot } = req.query

  const slots = await Slot.find({ course: courseId, isDeleted: false, ...(excludeSlot ? { _id: { $ne: excludeSlot } } : {}) })
    .populate('teacher', 'name')
    .populate('campus', 'name city')
    .populate('course', 'syllabus')

  res.json(
    slots.map((s) => {
      const modules = s.course?.syllabus || []
      const totalTopics = modules.reduce((sum, m) => sum + m.topics.length, 0)
      // Only count completedTopics entries that still match a topic in the
      // current syllabus - same fix as the progress tabs. A raw
      // completedTopics.length here would keep counting entries left behind
      // by a syllabus edit, inflating "covered" above what's actually true.
      const covered = modules.reduce(
        (sum, m) =>
          sum +
          m.topics.filter((t) =>
            s.completedTopics.some((c) => String(c.moduleId) === String(m._id) && String(c.topicId) === String(t._id))
          ).length,
        0
      )
      return {
        _id: s._id,
        teacherName: s.teacher?.name,
        campusName: s.campus?.name,
        batchLabel: s.batchLabel,
        scheduleDays: s.scheduleDays,
        startTime: s.startTime,
        endTime: s.endTime,
        covered,
        total: totalTopics,
      }
    })
  )
})

export const listSlots = asyncHandler(async (req, res) => {
  const filter = scopeToCampus(req)
  const slots = await Slot.find(filter)
    .populate('course', 'name')
    .populate('campus', 'name city')
    .populate('teacher', 'name email photo')
    .sort({ createdAt: -1 })

  const withSeats = await Promise.all(
    slots.map(async (s) => {
      const seatsUsed = await Student.countDocuments({ slot: s._id, status: { $ne: 'dropout' } })
      return { ...s.toObject(), seatsUsed }
    })
  )
  res.json(withSeats)
})

export const getSlot = asyncHandler(async (req, res) => {
  const slot = await Slot.findById(req.params.id)
    .populate('course')
    .populate('campus', 'name city')
    .populate('teacher', 'name email photo')
  if (!slot) return res.status(404).json({ message: 'Slot not found.' })
  const seatsUsed = await Student.countDocuments({ slot: slot._id, status: { $ne: 'dropout' } })
  res.json({ ...slot.toObject(), seatsUsed })
})

export const createSlot = asyncHandler(async (req, res) => {
  const { course, teacher, scheduleDays, startTime, endTime, gender, classType, capacity, startDate, endDate, whatsappLink } = req.body
  let { campus } = req.body
  if (req.role === 'subadmin') campus = req.user.campus

  // Trainer is optional here on purpose - a slot can be created empty and
  // have a trainer assigned to it afterwards (see updateSlot), which is what
  // lets a brand-new campus get its first Slot before it has any Trainer.
  if (!course || !campus || !capacity || !startDate) {
    return res.status(400).json({ message: 'Course, campus, capacity and start date are required.' })
  }

  const [courseDoc, campusDoc, teacherDoc] = await Promise.all([
    Course.findById(course),
    Campus.findById(campus),
    teacher ? Teacher.findById(teacher) : null,
  ])
  if (!courseDoc) return res.status(404).json({ message: 'Course not found.' })
  if (!campusDoc) return res.status(404).json({ message: 'Campus not found.' })
  if (teacher && !teacherDoc) return res.status(404).json({ message: 'Trainer not found.' })
  if (teacherDoc && String(teacherDoc.campus) !== String(campus)) {
    return res.status(400).json({ message: 'This trainer does not belong to the selected campus.' })
  }

  const priorCount = await Slot.countDocuments({ course, campus })
  const batchLabel = `Batch-${priorCount + 1}`

  const slot = await Slot.create({
    course,
    campus,
    batchLabel,
    teacher: teacher || null,
    scheduleDays: scheduleDays || [],
    startTime,
    endTime,
    gender,
    classType,
    capacity,
    startDate,
    endDate,
    whatsappLink,
    createdBy: req.user._id,
    createdByModel: req.role === 'superadmin' ? 'SuperAdmin' : 'SubAdmin',
  })

  res.status(201).json(slot)
})

export const updateSlot = asyncHandler(async (req, res) => {
  const slot = await Slot.findById(req.params.id)
  if (!slot) return res.status(404).json({ message: 'Slot not found.' })
  if (req.role === 'subadmin' && String(slot.campus) !== String(req.user.campus)) {
    return res.status(403).json({ message: 'This slot belongs to a different campus.' })
  }

  const { teacher, scheduleDays, startTime, endTime, gender, classType, capacity, startDate, endDate, whatsappLink } = req.body

  if (capacity !== undefined) {
    const seatsUsed = await Student.countDocuments({ slot: slot._id, status: { $ne: 'dropout' } })
    if (capacity < seatsUsed) {
      return res.status(400).json({ message: `Capacity can't be lower than the ${seatsUsed} student(s) already enrolled.` })
    }
    slot.capacity = capacity
  }
  if (teacher) slot.teacher = teacher
  if (scheduleDays) slot.scheduleDays = scheduleDays
  if (startTime !== undefined) slot.startTime = startTime
  if (endTime !== undefined) slot.endTime = endTime
  if (gender) slot.gender = gender
  if (classType) slot.classType = classType
  if (startDate) slot.startDate = startDate
  if (endDate !== undefined) slot.endDate = endDate
  if (whatsappLink !== undefined) slot.whatsappLink = whatsappLink

  await slot.save()
  res.json(slot)
})

// Opening/closing registration. Once Super Admin sets it, a Sub Admin's
// attempt is rejected with a clear explanation instead of silently failing.
export const toggleRegistration = asyncHandler(async (req, res) => {
  const slot = await Slot.findById(req.params.id)
  if (!slot) return res.status(404).json({ message: 'Slot not found.' })
  if (req.role === 'subadmin' && String(slot.campus) !== String(req.user.campus)) {
    return res.status(403).json({ message: 'This slot belongs to a different campus.' })
  }

  if (req.role === 'subadmin' && slot.registrationLockedBySuperAdmin) {
    return res.status(403).json({
      message: `Super Admin has ${slot.registrationOpen ? 'opened' : 'closed'} this slot's registration. You can't change it.`,
    })
  }

  slot.registrationOpen = !slot.registrationOpen
  if (req.role === 'superadmin') slot.registrationLockedBySuperAdmin = true
  await slot.save()
  res.json({ message: `Registration ${slot.registrationOpen ? 'opened' : 'closed'}.`, registrationOpen: slot.registrationOpen })
})

// Soft-deletes the slot and blocks every currently-enrolled student's
// login, exactly as the spec calls for - "your course has been removed".
export const deleteSlot = asyncHandler(async (req, res) => {
  const slot = await Slot.findById(req.params.id)
  if (!slot) return res.status(404).json({ message: 'Slot not found.' })
  if (req.role === 'subadmin' && String(slot.campus) !== String(req.user.campus)) {
    return res.status(403).json({ message: 'This slot belongs to a different campus.' })
  }

  await Slot.findByIdAndDelete(slot._id)

  await Student.updateMany(
    { slot: slot._id, status: { $ne: 'dropout' } },
    { $set: { accountBlocked: true, blockedReason: 'Your course/slot has been removed. Please contact your Sub Admin.' } }
  )

  res.json({ message: 'Slot deleted. Affected students have been notified and blocked from logging in.' })
})

// Teacher ticks a syllabus topic complete/incomplete for their specific batch.
export const toggleTopicProgress = asyncHandler(async (req, res) => {
  const { moduleId, topicId } = req.body
  const slot = await Slot.findById(req.params.id)
  if (!slot) return res.status(404).json({ message: 'Slot not found.' })
  if (req.role === 'teacher' && String(slot.teacher) !== String(req.user._id)) {
    return res.status(403).json({ message: 'This is not your batch.' })
  }

  const existingIndex = slot.completedTopics.findIndex(
    (t) => String(t.moduleId) === moduleId && String(t.topicId) === topicId
  )

  if (existingIndex >= 0) {
    slot.completedTopics.splice(existingIndex, 1) // untick
  } else {
    slot.completedTopics.push({ moduleId, topicId, completedDate: new Date() }) // tick
  }

  await slot.save()
  res.json(slot.completedTopics)
})
