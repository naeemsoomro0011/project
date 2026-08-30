import express from 'express'
import {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/courseController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/', listCourses)
router.get('/:id', getCourse)
router.post('/', restrictTo('superadmin'), createCourse)
router.put('/:id', restrictTo('superadmin'), updateCourse)
router.delete('/:id', restrictTo('superadmin'), deleteCourse)

export default router
