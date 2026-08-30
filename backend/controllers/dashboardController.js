import Student from '../models/Student.js'
import Teacher from '../models/Teacher.js'
import Slot from '../models/Slot.js'
import Campus from '../models/Campus.js'
import SubAdmin from '../models/SubAdmin.js'
import Course from '../models/Course.js'
import Assignment from '../models/Assignment.js'
import { asyncHandler } from '../middleware/errorHandler.js'

// These two charts are always org-wide (every campus), even on the Sub
// Admin's dashboard - a single campus can't meaningfully compare itself
// against "campuses" or show a useful course breakdown alone, so both
// roles are shown the same global picture, as clarified in the brief.
async function studentsPerCampus() {
  const rows = await Student.aggregate([
    { $match: { status: { $ne: 'dropout' } } },
    { $group: { _id: '$campus', count: { $sum: 1 } } },
  ])
  const campuses = await Campus.find({ _id: { $in: rows.map((r) => r._id) } }).lean()
  const campusById = new Map(campuses.map((c) => [String(c._id), c]))
  return rows.map((r) => ({
    campus: campusById.get(String(r._id))?.name || 'Unknown',
    city: campusById.get(String(r._id))?.city || '',
    count: r.count,
  }))
}

async function studentsPerCourse() {
  const rows = await Student.aggregate([
    { $match: { status: { $ne: 'dropout' } } },
    { $group: { _id: '$course', count: { $sum: 1 } } },
  ])
  const courses = await Course.find({ _id: { $in: rows.map((r) => r._id) } }).lean()
  const courseById = new Map(courses.map((c) => [String(c._id), c]))
  return rows.map((r) => ({ course: courseById.get(String(r._id))?.name || 'Unknown', count: r.count }))
}

export const subAdminDashboard = asyncHandler(async (req, res) => {
  const campus = req.user.campus

  const [totalStudents, enrolledStudents, registrationOpen, trainers, activeSlots, perCampus, perCourse] = await Promise.all([
    Student.countDocuments({ campus }),
    Student.countDocuments({ campus, status: 'enrolled' }),
    Slot.countDocuments({ campus, isDeleted: false, registrationOpen: true }),
    Teacher.countDocuments({ campus }),
    Slot.countDocuments({ campus, isDeleted: false }),
    studentsPerCampus(),
    studentsPerCourse(),
  ])

  const [totalCities, totalCampuses] = await Promise.all([
    Campus.distinct('city').then((c) => c.length),
    Campus.countDocuments(),
  ])

  res.json({
    totalStudents,
    enrolledStudents,
    registrationOpen,
    trainers,
    activeSlots,
    totalCities,
    totalCampuses,
    studentsPerCampus: perCampus,
    studentsPerCourse: perCourse,
  })
})

export const superAdminDashboard = asyncHandler(async (req, res) => {
  const [students, enrolledStudents, coursesOffered, cities, campuses, trainers, activeSlots, registrationOpen, subAdmins, perCampus, perCourse] =
    await Promise.all([
      Student.countDocuments({}),
      Student.countDocuments({ status: 'enrolled' }),
      Course.countDocuments({}),
      Campus.distinct('city').then((c) => c.length),
      Campus.countDocuments({}),
      Teacher.countDocuments({}),
      Slot.countDocuments({ isDeleted: false }),
      Slot.countDocuments({ isDeleted: false, registrationOpen: true }),
      SubAdmin.countDocuments({}),
      studentsPerCampus(),
      studentsPerCourse(),
    ])

  res.json({
    students,
    enrolledStudents,
    coursesOffered,
    cities,
    campuses,
    trainers,
    activeSlots,
    registrationOpen,
    subAdmins,
    studentsPerCampus: perCampus,
    studentsPerCourse: perCourse,
  })
})

export const teacherDashboard = asyncHandler(async (req, res) => {
  const teacherId = req.user._id
  const slots = await Slot.find({ teacher: teacherId, isDeleted: false }).populate('course', 'name syllabus').populate('campus', 'name city')
  const enrolledStudents = await Student.countDocuments({ slot: { $in: slots.map((s) => s._id) }, status: { $ne: 'dropout' } })

  const totalAssignments = await Assignment.countDocuments({ slot: { $in: slots.map((s) => s._id) }, isDeleted: false })

  // Attach live seat counts per slot - `seatsUsed` is only a virtual on the
  // Slot model, so it never comes back from a plain .find() and has to be
  // computed and merged in manually (same pattern as slotController).
  const slotsWithSeats = await Promise.all(
    slots.map(async (s) => {
      const seatsUsed = await Student.countDocuments({ slot: s._id, status: { $ne: 'dropout' } })
      return { ...s.toObject(), seatsUsed }
    })
  )

  res.json({
    activeCourses: slots.length,
    enrolledStudents,
    totalAssignments,
    slots: slotsWithSeats,
  })
})
