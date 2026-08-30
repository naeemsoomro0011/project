import express from 'express'
import {
  listSubAdmins,
  getSubAdmin,
  createSubAdmin,
  updateSubAdmin,
  toggleSuspendSubAdmin,
  deleteSubAdmin,
  updateMySubAdminProfile,
  requestSubAdminEmailChange,
  verifySubAdminEmailChange,
} from '../controllers/subAdminController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.put('/me/profile', restrictTo('subadmin'), updateMySubAdminProfile)

router.get('/', restrictTo('superadmin'), listSubAdmins)
router.get('/:id', restrictTo('superadmin'), getSubAdmin)
router.post('/', restrictTo('superadmin'), createSubAdmin)
router.put('/:id', restrictTo('superadmin'), updateSubAdmin)
router.post('/:id/email-change/request', restrictTo('superadmin'), requestSubAdminEmailChange)
router.post('/:id/email-change/verify', restrictTo('superadmin'), verifySubAdminEmailChange)
router.put('/:id/suspend', restrictTo('superadmin'), toggleSuspendSubAdmin)
router.delete('/:id', restrictTo('superadmin'), deleteSubAdmin)

export default router
