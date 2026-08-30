import express from 'express'
import {
  lookupTeacherByEmployeeId,
  checkIn,
  checkOut,
  todayTeacherAttendance,
  viewTeacherAttendanceByDate,
  attendanceSummary,
  createAttendanceRequest,
  listAttendanceRequests,
  resolveAttendanceRequest,
} from '../controllers/teacherAttendanceController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/lookup/:employeeId', restrictTo('superadmin', 'subadmin'), lookupTeacherByEmployeeId)
router.post('/checkin', restrictTo('superadmin', 'subadmin'), checkIn)
router.post('/checkout', restrictTo('superadmin', 'subadmin'), checkOut)
router.get('/today', restrictTo('superadmin', 'subadmin'), todayTeacherAttendance)
router.get('/view', restrictTo('superadmin', 'subadmin'), viewTeacherAttendanceByDate)
router.get('/summary/:teacherId', restrictTo('superadmin', 'subadmin', 'teacher'), attendanceSummary)

router.post('/requests', restrictTo('teacher'), createAttendanceRequest)
router.get('/requests', restrictTo('superadmin', 'subadmin'), listAttendanceRequests)
router.put('/requests/:id', restrictTo('superadmin', 'subadmin'), resolveAttendanceRequest)

export default router
