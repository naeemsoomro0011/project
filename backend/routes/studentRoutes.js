import express from 'express'
import {
  listStudents,
  getStudent,
  getStudentByRoll,
  createStudent,
  updateStudent,
  setStudentStatus,
  deleteStudent,
  getMyStudentProfile,
  updateMyStudentProfile,
} from '../controllers/studentController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/me/profile', restrictTo('student'), getMyStudentProfile)
router.put('/me/profile', restrictTo('student'), updateMyStudentProfile)
router.get('/by-roll/:roll', restrictTo('superadmin', 'subadmin'), getStudentByRoll)

router.get('/', restrictTo('superadmin', 'subadmin', 'teacher'), listStudents)
router.get('/:id', restrictTo('superadmin', 'subadmin', 'teacher'), getStudent)
router.post('/', restrictTo('superadmin', 'subadmin'), createStudent)
router.put('/:id', restrictTo('superadmin', 'subadmin'), updateStudent)
router.put('/:id/status', restrictTo('superadmin', 'subadmin'), setStudentStatus)
router.delete('/:id', restrictTo('superadmin', 'subadmin'), deleteStudent)

export default router
