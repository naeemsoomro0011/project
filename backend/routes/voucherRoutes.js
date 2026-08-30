import express from 'express'
import {
  generateVoucherForStudent,
  generateVouchersBulk,
  vouchersForStudent,
  myVouchers,
  setVoucherStatus,
} from '../controllers/voucherController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/me', restrictTo('student'), myVouchers)
router.get('/student/:studentId', restrictTo('superadmin', 'subadmin'), vouchersForStudent)
router.post('/generate/:studentId', restrictTo('superadmin', 'subadmin'), generateVoucherForStudent)
router.post('/generate-bulk', restrictTo('superadmin', 'subadmin'), generateVouchersBulk)
router.put('/:id/status', restrictTo('superadmin', 'subadmin'), setVoucherStatus)

export default router
