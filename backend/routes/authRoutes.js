import express from 'express'
import {
  loginWithEmail,
  loginStudent,
  studentCreateAccount,
  forgotPasswordRequest,
  forgotPasswordVerify,
  changePassword,
  getMe,
  requestMyEmailChange,
  verifyMyEmailChange,
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/login/superadmin', loginWithEmail('superadmin'))
router.post('/login/subadmin', loginWithEmail('subadmin'))
router.post('/login/teacher', loginWithEmail('teacher'))
router.post('/login/student', loginStudent)

router.post('/student/create-account', studentCreateAccount)

router.post('/forgot-password/request', forgotPasswordRequest)
router.post('/forgot-password/verify', forgotPasswordVerify)

router.post('/change-password', protect, changePassword)
router.get('/me', protect, getMe)

// Self-service email change (Super Admin / Sub Admin / Teacher / Student) -
// two-step OTP flow, code goes to the current email on file.
router.post('/email-change/request', protect, requestMyEmailChange)
router.post('/email-change/verify', protect, verifyMyEmailChange)

export default router
