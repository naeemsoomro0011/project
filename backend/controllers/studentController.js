import Student from '../models/Student.js'
import Slot from '../models/Slot.js'
import Campus from '../models/Campus.js'
import Course from '../models/Course.js'
import { findDuplicateAccount } from '../utils/checkUnique.js'
import { nextRollNumber } from '../utils/generateIds.js'
import { asyncHandler } from '../middleware/errorHandler.js'

function scopeToCampus(req) {
  if (req.role === 'subadmin') return { campus: req.user.campus }
  const filter = {}
  if (req.query.campus) filter.campus = req.query.campus
  return filter
}

export const listStudents = asyncHandler(async (req, res) => {
  const filter = req.role === 'teacher' ? {} : scopeToCampus(req)
  const { search, course, status, slot } = req.query

  // A teacher isn't campus-scoped the way a Sub Admin is (they can teach at
  // multiple campuses) - instead they're locked to only ever querying by a
  // specific slot, and only one that's actually theirs.
  if (req.role === 'teacher') {
    if (!slot) return res.status(400).json({ message: 'A slot is required.' })
    const Slot = (await import('../models/Slot.js')).default
    const slotDoc = await Slot.findById(slot)
    if (!slotDoc || String(slotDoc.teacher) !== String(req.user._id)) {
      return res.status(403).json({ message: 'This is not your batch.' })
    }
  }

  if (slot) filter.slot = slot
  if (course) filter.course = course
  if (status) filter.status = status
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { roll: new RegExp(search, 'i') },
      { cnic: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
    ]
  }

  const students = await Student.find(filter)
    .populate('campus', 'name city')
    .populate('course', 'name')
    .populate({ path: 'slot', select: 'batchLabel teacher', populate: { path: 'teacher', select: 'name' } })
    .select('-password')
    .sort({ createdAt: -1 })

  res.json(students)
})

export const getStudentByRoll = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ roll: req.params.roll })
    .populate('campus', 'name city')
    .populate('course', 'name')
    .populate({ path: 'slot', select: 'batchLabel' })
    .select('-password')
  if (!student) return res.status(404).json({ message: 'No student found with this roll number.' })
  if (req.role === 'subadmin' && String(student.campus._id) !== String(req.user.campus)) {
    return res.status(403).json({ message: 'This student belongs to a different campus.' })
  }
  res.json(student)
})

export const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('campus', 'name city')
    .populate('course', 'name syllabus')
    .populate({ path: 'slot', populate: { path: 'teacher', select: 'name email photo' } })
    .select('-password')
  if (!student) return res.status(404).json({ message: 'Student not found.' })
  if (req.role === 'subadmin' && String(student.campus._id) !== String(req.user.campus)) {
    return res.status(403).json({ message: 'This student belongs to a different campus.' })
  }
  if (req.role === 'teacher' && String(student.slot?.teacher?._id) !== String(req.user._id)) {
    return res.status(403).json({ message: 'This student is not in your batch.' })
  }
  res.json(student)
})

export const createStudent = asyncHandler(async (req, res) => {
  const {
    name, fatherName, cnic, fatherCnic, email, phone, fatherPhone, dob, gender,
    address, lastQualification, computerLevel, hasLaptop, photo, course, slot,
  } = req.body
  let { campus } = req.body
  if (req.role === 'subadmin') campus = req.user.campus

  if (!name || !cnic || !email || !phone || !dob || !course || !slot || !campus) {
    return res.status(400).json({ message: 'Name, CNIC, email, phone, date of birth, course, campus and slot are required.' })
  }

  const [campusDoc, courseDoc, slotDoc] = await Promise.all([
    Campus.findById(campus),
    Course.findById(course),
    Slot.findById(slot),
  ])
  if (!campusDoc) return res.status(404).json({ message: 'Campus not found.' })
  if (!courseDoc) return res.status(404).json({ message: 'Course not found.' })
  if (!slotDoc || slotDoc.isDeleted) return res.status(404).json({ message: 'Slot not found.' })
  if (String(slotDoc.campus) !== String(campus)) {
    return res.status(400).json({ message: 'This slot does not belong to the selected campus.' })
  }
  if (String(slotDoc.course) !== String(course)) {
    return res.status(400).json({ message: 'This slot does not belong to the selected course.' })
  }
  if (!slotDoc.registrationOpen) {
    return res.status(400).json({ message: 'Registration for this slot/batch is currently closed.' })
  }

  const seatsUsed = await Student.countDocuments({ slot: slotDoc._id, status: { $ne: 'dropout' } })
  if (seatsUsed >= slotDoc.capacity) {
    return res.status(400).json({
      message: `${slotDoc.batchLabel} is already full (${seatsUsed}/${slotDoc.capacity}). Increase capacity in Administration or pick another batch.`,
    })
  }

  const dup = await findDuplicateAccount({ email, phone, cnic })
  if (dup.duplicate) {
    return res.status(409).json({ message: `This ${dup.field} is already used by another account (${dup.inModel}).` })
  }

  const roll = await nextRollNumber()

  const student = await Student.create({
    name, fatherName, cnic, fatherCnic, email, phone, fatherPhone, dob, gender,
    address, lastQualification, computerLevel, hasLaptop, photo,
    roll, city: campusDoc.city, campus, course, slot,
    createdBy: req.user._id,
    createdByModel: req.role === 'superadmin' ? 'SuperAdmin' : 'SubAdmin',
    history: [{ change: 'Enrolled', by: req.user.name }],
  })

  const safe = student.toObject()
  delete safe.password
  res.status(201).json(safe)
})

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
  if (!student) return res.status(404).json({ message: 'Student not found.' })
  if (req.role === 'subadmin' && String(student.campus) !== String(req.user.campus)) {
    return res.status(403).json({ message: 'This student belongs to a different campus.' })
  }

  const editable = [
    'name', 'fatherName', 'cnic', 'fatherCnic', 'email', 'phone', 'fatherPhone', 'dob', 'gender', 'address',
    'lastQualification', 'computerLevel', 'hasLaptop', 'photo', 'campus', 'course', 'slot', 'paymentStatus',
  ]

  if (req.body.cnic && req.body.cnic.replace(/\D/g, '').length < 13) {
    return res.status(400).json({ message: 'CNIC looks too short.' })
  }

  if (req.body.email || req.body.phone || req.body.cnic) {
    const dup = await findDuplicateAccount({
      email: req.body.email, phone: req.body.phone, cnic: req.body.cnic, excludeId: student._id, excludeModel: 'Student',
    })
    if (dup.duplicate) {
      return res.status(409).json({ message: `This ${dup.field} is already used by another account (${dup.inModel}).` })
    }
  }

  // Moving a student to a different campus (Super Admin only) also carries
  // them into a batch that actually exists there - a Slot is always tied to
  // one specific campus+course, so whichever slot ends up on the student
  // must belong to the target campus. The `city` field mirrors campus (set
  // from it at creation), so it moves along automatically too.
  if (req.body.campus && String(req.body.campus) !== String(student.campus)) {
    if (req.role === 'subadmin') {
      return res.status(403).json({ message: 'Only Super Admin can move a student to a different campus.' })
    }
    const newCampus = await Campus.findById(req.body.campus)
    if (!newCampus) return res.status(404).json({ message: 'Campus not found.' })

    const targetSlotId = req.body.slot || student.slot
    const newSlot = await Slot.findById(targetSlotId)
    if (!newSlot || String(newSlot.campus) !== String(newCampus._id)) {
      return res.status(400).json({ message: 'Pick a trainer/batch that belongs to the new campus before moving this student.' })
    }
    student.city = newCampus.city
  }

  const changedFields = []
  for (const field of editable) {
    if (req.body[field] !== undefined && String(req.body[field]) !== String(student[field])) {
      changedFields.push(field)
      student[field] = req.body[field]
    }
  }
  if (changedFields.length) {
    student.history.push({ change: `Updated: ${changedFields.join(', ')}`, by: req.user.name })
  }

  await student.save()
  const safe = student.toObject()
  delete safe.password
  res.json(safe)
})

export const setStudentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!['enrolled', 'dropout', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' })
  }
  const student = await Student.findById(req.params.id)
  if (!student) return res.status(404).json({ message: 'Student not found.' })
  if (req.role === 'subadmin' && String(student.campus) !== String(req.user.campus)) {
    return res.status(403).json({ message: 'This student belongs to a different campus.' })
  }

  student.status = status
  if (status === 'dropout') {
    student.accountBlocked = true
    student.blockedReason = 'Your enrollment has been marked as dropped out. Please contact your Sub Admin.'
  } else {
    student.accountBlocked = false
    student.blockedReason = ''
  }
  student.history.push({ change: `Status changed to ${status}`, by: req.user.name })
  await student.save()
  res.json({ message: `Student marked as ${status}.`, status: student.status })
})

export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
  if (!student) return res.status(404).json({ message: 'Student not found.' })
  if (req.role === 'subadmin' && String(student.campus) !== String(req.user.campus)) {
    return res.status(403).json({ message: 'This student belongs to a different campus.' })
  }
  await Student.findByIdAndDelete(req.params.id)
  res.json({ message: 'Student record permanently deleted.' })
})

// --- Student self-service ---
export const getMyStudentProfile = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id)
    .populate('campus', 'name city')
    .populate('course', 'name syllabus')
    .populate({ path: 'slot', populate: { path: 'teacher', select: 'name email photo' } })
    .select('-password')
  res.json(student)
})

export const updateMyStudentProfile = asyncHandler(async (req, res) => {
  const { name, email, dob, gender, phone, photo, cnic, fatherCnic } = req.body
  const student = await Student.findById(req.user._id)

  // Email changes always go through the OTP-confirmed flow
  // (/api/auth/email-change/request + /verify) - never set inline here.
  if (email && email.toLowerCase().trim() !== student.email) {
    return res.status(400).json({
      message: 'Email can\'t be changed here. Use "Change Email", which sends a confirmation code to your current email first.',
      code: 'EMAIL_CHANGE_REQUIRES_OTP',
    })
  }

  if (cnic && cnic.replace(/\D/g, '').length < 13) {
    return res.status(400).json({ message: 'CNIC looks too short.' })
  }

  if (phone || cnic) {
    const dup = await findDuplicateAccount({ phone, cnic, excludeId: student._id, excludeModel: 'Student' })
    if (dup.duplicate) {
      return res.status(409).json({ message: `This ${dup.field} is already used by another account (${dup.inModel}).` })
    }
  }

  const changedFields = []
  if (name && name !== student.name) { student.name = name; changedFields.push('name') }
  if (dob && String(dob) !== String(student.dob)) { student.dob = dob; changedFields.push('dob') }
  if (gender && gender !== student.gender) { student.gender = gender; changedFields.push('gender') }
  if (phone && phone !== student.phone) { student.phone = phone; changedFields.push('phone') }
  if (photo !== undefined && photo !== student.photo) { student.photo = photo; changedFields.push('photo') }
  // CNIC doubles as the student's login ID, so changing it here is exactly
  // as significant as an admin changing it - the very next login must use
  // the new number. Father's CNIC is informational only.
  if (cnic && cnic !== student.cnic) { student.cnic = cnic; changedFields.push('cnic') }
  if (fatherCnic !== undefined && fatherCnic !== student.fatherCnic) { student.fatherCnic = fatherCnic; changedFields.push('fatherCnic') }

  if (changedFields.length) {
    student.history.push({ change: `Updated own profile: ${changedFields.join(', ')}`, by: student.name })
  }
  await student.save()
  const safe = student.toObject()
  delete safe.password
  res.json(safe)
})
