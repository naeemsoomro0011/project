import express from 'express'
import { subAdminDashboard, superAdminDashboard, teacherDashboard } from '../controllers/dashboardController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/subadmin', restrictTo('subadmin'), subAdminDashboard)
router.get('/superadmin', restrictTo('superadmin'), superAdminDashboard)
router.get('/teacher', restrictTo('teacher'), teacherDashboard)

export default router
