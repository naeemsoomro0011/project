import Course from '../models/Course.js'
import { asyncHandler } from '../middleware/errorHandler.js'

export const listCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find().sort({ name: 1 })
  res.json(courses)
})

export const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
  if (!course) return res.status(404).json({ message: 'Course not found.' })
  res.json(course)
})

export const createCourse = asyncHandler(async (req, res) => {
  const { name, description, syllabus } = req.body
  if (!name) return res.status(400).json({ message: 'Course name is required.' })

  const exists = await Course.findOne({ name: name.trim() })
  if (exists) return res.status(409).json({ message: 'A course with this name already exists.' })

  const course = await Course.create({ name, description, syllabus: syllabus || [] })
  res.status(201).json(course)
})

export const updateCourse = asyncHandler(async (req, res) => {
  const { name, description, syllabus } = req.body
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { ...(name && { name }), ...(description !== undefined && { description }), ...(syllabus && { syllabus }) },
    { new: true, runValidators: true }
  )
  if (!course) return res.status(404).json({ message: 'Course not found.' })
  res.json(course)
})

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id)
  if (!course) return res.status(404).json({ message: 'Course not found.' })
  res.json({ message: 'Course deleted.' })
})
