import express from 'express'
import {
  markAttendance,
  markMultipleAttendance,
  recentAttendance,
  viewAttendanceByRoll,
  myAttendance,
  attendanceForStudent,
  attendanceForSlotOnDate,
} from '../controllers/attendanceController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/me', restrictTo('student'), myAttendance)
router.get('/student/:studentId', restrictTo('superadmin', 'subadmin', 'teacher'), attendanceForStudent)
router.get('/slot/:slotId', restrictTo('superadmin', 'subadmin', 'teacher'), attendanceForSlotOnDate)

router.post('/mark', restrictTo('superadmin', 'subadmin'), markAttendance)
router.post('/mark-multiple', restrictTo('superadmin', 'subadmin'), markMultipleAttendance)
router.get('/recent', restrictTo('superadmin', 'subadmin'), recentAttendance)
router.get('/view/:roll', restrictTo('superadmin', 'subadmin'), viewAttendanceByRoll)

export default router
