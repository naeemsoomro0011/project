import express from 'express'
import { exportStudentsExcel } from '../controllers/exportController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

router.get('/students', protect, restrictTo('superadmin', 'subadmin'), exportStudentsExcel)

export default router
