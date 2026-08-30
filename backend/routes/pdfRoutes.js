import express from 'express'
import { studentAuditPdf, studentsListPdf, teacherIdCardPdf } from '../controllers/pdfController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/students', restrictTo('superadmin', 'subadmin'), studentsListPdf)
router.get('/student/:id', restrictTo('superadmin', 'subadmin'), studentAuditPdf)
router.get('/teacher/:id', restrictTo('teacher', 'superadmin', 'subadmin'), teacherIdCardPdf)

export default router
