import express from 'express'
import { createFeedback, listFeedback, markFeedbackRead } from '../controllers/feedbackController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.post('/', restrictTo('student'), createFeedback)
router.get('/', restrictTo('superadmin', 'subadmin'), listFeedback)
router.put('/:id/read', restrictTo('superadmin', 'subadmin'), markFeedbackRead)

export default router
