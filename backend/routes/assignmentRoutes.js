import express from 'express'
import {
  createAssignment,
  listAssignmentsForSlot,
  myAssignments,
  updateAssignment,
  toggleCloseSubmission,
  deleteAssignment,
  assignmentSubmissions,
  submitAssignment,
  setSubmissionStatus,
  assignmentsForStudentInSlot,
} from '../controllers/assignmentController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/me', restrictTo('student'), myAssignments)
router.get('/student/:studentId', restrictTo('teacher', 'superadmin', 'subadmin'), assignmentsForStudentInSlot)
router.get('/slot/:slotId', restrictTo('teacher', 'superadmin', 'subadmin'), listAssignmentsForSlot)
router.post('/', restrictTo('teacher'), createAssignment)
router.put('/:id', restrictTo('teacher'), updateAssignment)
router.put('/:id/close', restrictTo('teacher'), toggleCloseSubmission)
router.delete('/:id', restrictTo('teacher'), deleteAssignment)
router.get('/:id/submissions', restrictTo('teacher', 'superadmin', 'subadmin'), assignmentSubmissions)
router.post('/:id/submit', restrictTo('student'), submitAssignment)
router.put('/submissions/:id/status', restrictTo('teacher'), setSubmissionStatus)

export default router
