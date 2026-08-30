import express from 'express'
import { updateMySuperAdminProfile } from '../controllers/superAdminController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

router.put('/me/profile', protect, restrictTo('superadmin'), updateMySuperAdminProfile)

export default router
