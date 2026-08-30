import express from 'express'
import {
  listSlots,
  getSlot,
  createSlot,
  updateSlot,
  toggleRegistration,
  deleteSlot,
  toggleTopicProgress,
  compareProgressForCourse,
} from '../controllers/slotController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/compare/:courseId', restrictTo('teacher', 'superadmin', 'subadmin'), compareProgressForCourse)
router.get('/', restrictTo('superadmin', 'subadmin', 'teacher'), listSlots)
router.get('/:id', restrictTo('superadmin', 'subadmin', 'teacher', 'student'), getSlot)
router.post('/', restrictTo('superadmin', 'subadmin'), createSlot)
router.put('/:id', restrictTo('superadmin', 'subadmin'), updateSlot)
router.put('/:id/registration', restrictTo('superadmin', 'subadmin'), toggleRegistration)
router.delete('/:id', restrictTo('superadmin', 'subadmin'), deleteSlot)
router.put('/:id/progress', restrictTo('teacher', 'superadmin'), toggleTopicProgress)

export default router
