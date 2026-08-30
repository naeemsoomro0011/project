import express from 'express'
import {
  listTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  toggleSuspendTeacher,
  deleteTeacherWithReplacement,
  updateMyTeacherProfile,
  requestTeacherEmailChange,
  verifyTeacherEmailChange,
} from '../controllers/teacherController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.put('/me/profile', restrictTo('teacher'), updateMyTeacherProfile)

router.get('/', restrictTo('superadmin', 'subadmin'), listTeachers)
router.get('/:id', restrictTo('superadmin', 'subadmin'), getTeacher)
router.post('/', restrictTo('superadmin', 'subadmin'), createTeacher)
router.put('/:id', restrictTo('superadmin', 'subadmin'), updateTeacher)
router.post('/:id/email-change/request', restrictTo('superadmin', 'subadmin'), requestTeacherEmailChange)
router.post('/:id/email-change/verify', restrictTo('superadmin', 'subadmin'), verifyTeacherEmailChange)
router.put('/:id/suspend', restrictTo('superadmin', 'subadmin'), toggleSuspendTeacher)
router.delete('/:id', restrictTo('superadmin', 'subadmin'), deleteTeacherWithReplacement)

export default router
