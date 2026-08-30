import Campus from '../models/Campus.js'
import SubAdmin from '../models/SubAdmin.js'
import Teacher from '../models/Teacher.js'
import Student from '../models/Student.js'
import Slot from '../models/Slot.js'
import { asyncHandler } from '../middleware/errorHandler.js'

export const listCampuses = asyncHandler(async (req, res) => {
  const campuses = await Campus.find().sort({ city: 1, name: 1 }).lean()

  // Attach live counts so the Super Admin "Campuses" cards (students,
  // trainers, slots, staff) never drift out of sync with reality.
  const withCounts = await Promise.all(
    campuses.map(async (c) => {
      const [students, trainers, slots, staff] = await Promise.all([
        Student.countDocuments({ campus: c._id, status: { $ne: 'dropout' } }),
        Teacher.countDocuments({ campus: c._id }),
        Slot.countDocuments({ campus: c._id, isDeleted: false }),
        SubAdmin.countDocuments({ campus: c._id }),
      ])
      return { ...c, studentsCount: students, trainersCount: trainers, slotsCount: slots, staffCount: staff }
    })
  )

  res.json(withCounts)
})

export const getCampus = asyncHandler(async (req, res) => {
  const campus = await Campus.findById(req.params.id)
  if (!campus) return res.status(404).json({ message: 'Campus not found.' })
  res.json(campus)
})

export const createCampus = asyncHandler(async (req, res) => {
  const { name, city, address, capacityOfStudents } = req.body
  if (!name || !city) {
    return res.status(400).json({ message: 'Campus name and city are required.' })
  }
  const campus = await Campus.create({ name, city, address, capacityOfStudents })
  res.status(201).json(campus)
})

export const updateCampus = asyncHandler(async (req, res) => {
  const { name, city, address, capacityOfStudents } = req.body
  const campus = await Campus.findByIdAndUpdate(
    req.params.id,
    { name, city, address, capacityOfStudents },
    { new: true, runValidators: true }
  )
  if (!campus) return res.status(404).json({ message: 'Campus not found.' })
  res.json(campus)
})

export const deleteCampus = asyncHandler(async (req, res) => {
  const [students, teachers, subAdmins] = await Promise.all([
    Student.countDocuments({ campus: req.params.id }),
    Teacher.countDocuments({ campus: req.params.id }),
    SubAdmin.countDocuments({ campus: req.params.id }),
  ])
  if (students || teachers || subAdmins) {
    return res.status(409).json({
      message: `Cannot delete this campus - it still has ${students} student(s), ${teachers} trainer(s) and ${subAdmins} sub admin(s) attached. Reassign or remove them first.`,
    })
  }
  const campus = await Campus.findByIdAndDelete(req.params.id)
  if (!campus) return res.status(404).json({ message: 'Campus not found.' })
  res.json({ message: 'Campus deleted.' })
})
