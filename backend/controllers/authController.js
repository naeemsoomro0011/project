import bcrypt from 'bcryptjs'
import SuperAdmin from '../models/SuperAdmin.js'
import SubAdmin from '../models/SubAdmin.js'
import Teacher from '../models/Teacher.js'
import Student from '../models/Student.js'
import Otp from '../models/Otp.js'
import { generateToken } from '../utils/generateToken.js'
import { sendMail } from '../utils/mailer.js'
import { otpEmailTemplate, welcomeEmailTemplate, loginNotificationEmailTemplate } from '../utils/emailTemplates.js'
import { requestEmailChange, verifyEmailChange, maskEmail } from '../utils/emailChangeService.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const modelByRole = {
  superadmin: SuperAdmin,
  subadmin: SubAdmin,
  teacher: Teacher,
  student: Student,
}

const accountModelByRole = {
  superadmin: 'SuperAdmin',
  subadmin: 'SubAdmin',
  teacher: 'Teacher',
}

// Friendly display name per role, used in the login-notification email
// (kept consistent with the label already used in welcomeEmailTemplate).
const roleLabelByRole = {
  superadmin: 'Super Admin',
  subadmin: 'Sub Admin',
  teacher: 'Trainer',
}

function sanitize(doc) {
  const obj = doc.toObject ? doc.toObject() : doc
  delete obj.password
  return obj
}

// Best-effort, dependency-free device summary from the User-Agent header -
// just enough for the login-notification email to say "Windows · Chrome"
// instead of a raw, unreadable UA string.
function describeDevice(userAgent = '') {
  if (!userAgent) return ''
  const os = /windows/i.test(userAgent)
    ? 'Windows'
    : /mac os/i.test(userAgent)
    ? 'macOS'
    : /android/i.test(userAgent)
    ? 'Android'
    : /iphone|ipad/i.test(userAgent)
    ? 'iOS'
    : /linux/i.test(userAgent)
    ? 'Linux'
    : 'Unknown device'

  const browser = /edg\//i.test(userAgent)
    ? 'Edge'
    : /chrome\//i.test(userAgent)
    ? 'Chrome'
    : /firefox\//i.test(userAgent)
    ? 'Firefox'
    : /safari\//i.test(userAgent)
    ? 'Safari'
    : ''

  return browser ? `${os} · ${browser}` : os
}

// Real client IP even behind a reverse proxy (Vercel, Render, Nginx, etc.)
// falls back to req.ip when there's no proxy in front of the app.
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.ip || req.socket?.remoteAddress || ''
}

// Fires the "new sign-in" security email for Super Admin / Sub Admin /
// Trainer logins. Never awaited by the caller and never throws outward -
// a slow or failed notification email must never delay or break a login.
function notifyLogin(req, account, role) {
  const time = new Date().toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  sendMail({
    to: account.email,
    subject: 'New Sign-in to Your Titan Portal Account',
    html: loginNotificationEmailTemplate({
      name: account.name,
      role: roleLabelByRole[role] || role,
      loginEmail: account.email,
      time: `${time} (PKT)`,
      ip: getClientIp(req),
      device: describeDevice(req.headers['user-agent']),
    }),
  }).catch(() => {})
}

// --- Login: Super Admin / Sub Admin / Teacher (email + password) ---
export const loginWithEmail = (role) =>
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const Model = modelByRole[role]

    // Trainers (and only trainers, currently) can share an email/phone with
    // another account - Trainer ID is their real unique key, not email. So
    // instead of assuming one account per email, pull every account with
    // this email and let the password be the tie-breaker: each account's
    // password is still its own, so comparing against every candidate finds
    // the one actually being logged into, even when the email collides.
    const candidates = await Model.find({ email: email.toLowerCase().trim() })
    if (candidates.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    let account = null
    for (const candidate of candidates) {
      // eslint-disable-next-line no-await-in-loop
      if (await bcrypt.compare(password, candidate.password)) {
        account = candidate
        break
      }
    }
    if (!account) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    if (role !== 'superadmin' && account.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact your administrator.' })
    }

    const token = generateToken(account._id, role)
    res.json({ token, role, user: sanitize(account) })

    // Fire-and-forget: response has already been sent, this just informs
    // the account owner in the background that a login just happened.
    notifyLogin(req, account, role)
  })

// --- Login: Student (CNIC + password) ---
export const loginStudent = asyncHandler(async (req, res) => {
  const { cnic, password } = req.body
  if (!cnic || !password) {
    return res.status(400).json({ message: 'CNIC and password are required.' })
  }

  const student = await Student.findOne({ cnic: cnic.trim() })
    .populate('campus', 'name city')
    .populate('course', 'name')
    .populate({ path: 'slot', populate: { path: 'teacher', select: 'name email' } })

  if (!student || !student.accountCreated) {
    return res.status(401).json({
      message: 'No active account found for this CNIC. Ask your Sub Admin to enroll you first, then create your account.',
    })
  }

  const match = await bcrypt.compare(password, student.password)
  if (!match) {
    return res.status(401).json({ message: 'Invalid CNIC or password.' })
  }

  if (student.accountBlocked) {
    return res.status(403).json({ message: student.blockedReason || 'Your account has been blocked.', code: 'BLOCKED' })
  }

  const token = generateToken(student._id, 'student')
  res.json({ token, role: 'student', user: sanitize(student) })
})

// --- Student self-activation: turns a Sub-Admin-created pre-registration into a login-able account ---
export const studentCreateAccount = asyncHandler(async (req, res) => {
  const { cnic, dob, password } = req.body
  if (!cnic || !dob || !password) {
    return res.status(400).json({ message: 'CNIC, date of birth and password are all required.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' })
  }

  const student = await Student.findOne({ cnic: cnic.trim() })
  if (!student) {
    return res.status(404).json({
      message: 'This CNIC was not found. Your Sub Admin must enroll you before you can create an account.',
    })
  }

  if (student.accountCreated) {
    return res.status(409).json({ message: 'An account already exists for this CNIC. Please log in instead.' })
  }

  const providedDob = new Date(dob).toISOString().slice(0, 10)
  const recordDob = new Date(student.dob).toISOString().slice(0, 10)
  if (providedDob !== recordDob) {
    return res.status(401).json({ message: 'The date of birth does not match our records.' })
  }

  student.password = await bcrypt.hash(password, 10)
  student.accountCreated = true
  student.history.push({ change: 'Account activated by student', by: student.name })
  await student.save()

  // Fire the welcome email in the background - a slow/failed email should
  // never block the student from getting their token and logging in.
  sendMail({
    to: student.email,
    subject: 'Welcome to Titan Portal 🎉',
    html: welcomeEmailTemplate({ name: student.name, role: 'Student', loginEmail: student.email }),
  }).catch(() => {})

  const token = generateToken(student._id, 'student')
  res.status(201).json({ token, role: 'student', user: sanitize(student) })
})

// --- Forgot password: request OTP (Super Admin / Sub Admin / Teacher only) ---
export const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email, role, employeeId } = req.body
  if (!email || !role || !['superadmin', 'subadmin', 'teacher'].includes(role)) {
    return res.status(400).json({ message: 'A valid email and role are required.' })
  }

  const Model = modelByRole[role]
  const candidates = await Model.find({ email: email.toLowerCase().trim() })
  if (candidates.length === 0) {
    return res.status(404).json({ message: 'No account found with that email.' })
  }

  // Trainers and Sub Admins can share an email with another account of the
  // same role (their ID is the real unique key, not email), so if more than
  // one account matched, there's no password yet to disambiguate with - ask
  // for their ID instead.
  const idLabel = role === 'teacher' ? 'Trainer ID' : role === 'subadmin' ? 'Sub Admin ID' : 'ID'
  let account = candidates[0]
  if (candidates.length > 1) {
    if (!employeeId) {
      return res.status(409).json({
        message: `This email is used by ${candidates.length} accounts. Please enter your ${idLabel} to tell us which one is yours.`,
        code: 'NEED_EMPLOYEE_ID',
        idLabel,
        accountsFound: candidates.length,
      })
    }
    account = candidates.find((c) => c.employeeId === employeeId.trim())
    if (!account) {
      return res.status(404).json({ message: `No account found with that email and ${idLabel}.` })
    }
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

  await Otp.create({
    accountModel: accountModelByRole[role],
    accountId: account._id,
    phone: account.phone,
    code,
    expiresAt,
    purpose: 'password_reset',
  })

  await sendMail({
    to: account.email,
    subject: 'Password Reset Code — Titan Portal',
    html: otpEmailTemplate({
      name: account.name,
      code,
      minutes: 5,
      heading: 'Reset Your Password',
      message: `We received a request to reset the password on your Titan Portal account.
        Enter the code below to continue. If you didn't request this, you can safely ignore this email —
        your password will not be changed.`,
    }),
  })

  const devExposeOtp = process.env.DEV_EXPOSE_OTP === 'true'
  res.json({
    message: `A 6-digit verification code was sent to the email on file (${maskEmail(account.email)}).`,
    maskedEmail: maskEmail(account.email),
    ...(devExposeOtp ? { devOtp: code } : {}),
  })
})

// --- Forgot password: verify OTP + set new password ---
export const forgotPasswordVerify = asyncHandler(async (req, res) => {
  const { email, role, otp, newPassword, employeeId } = req.body
  if (!email || !role || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, role, OTP and new password are all required.' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' })
  }

  const Model = modelByRole[role]
  const candidates = await Model.find({ email: email.toLowerCase().trim() })
  if (candidates.length === 0) {
    return res.status(404).json({ message: 'No account found with that email.' })
  }

  // Same disambiguation as the request step above - with a shared email,
  // the OTP code (tied to one specific account) is what actually pins down
  // which account this is, so try that first before asking for their ID.
  const accountModel = accountModelByRole[role]
  const idLabel = role === 'teacher' ? 'Trainer ID' : role === 'subadmin' ? 'Sub Admin ID' : 'ID'
  let account = candidates[0]
  if (candidates.length > 1) {
    if (employeeId) {
      account = candidates.find((c) => c.employeeId === employeeId.trim())
      if (!account) {
        return res.status(404).json({ message: `No account found with that email and ${idLabel}.` })
      }
    } else {
      const matchByOtp = await Otp.findOne({
        accountModel,
        accountId: { $in: candidates.map((c) => c._id) },
        code: otp,
        consumed: false,
      }).sort({ createdAt: -1 })
      if (!matchByOtp) {
        return res.status(401).json({ message: 'Invalid code.' })
      }
      account = candidates.find((c) => String(c._id) === String(matchByOtp.accountId))
    }
  }

  const otpDoc = await Otp.findOne({
    accountModel,
    accountId: account._id,
    code: otp,
    consumed: false,
  }).sort({ createdAt: -1 })

  if (!otpDoc) {
    return res.status(401).json({ message: 'Invalid code.' })
  }
  if (otpDoc.expiresAt < new Date()) {
    return res.status(401).json({ message: 'This code has expired. Please request a new one.' })
  }

  account.password = await bcrypt.hash(newPassword, 10)
  await account.save()

  otpDoc.consumed = true
  await otpDoc.save()

  res.json({ message: 'Password updated successfully. You can now log in with your new password.' })
})

// --- Change password (logged in) - Super Admin / Sub Admin / Teacher only, old password required ---
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Old and new password are both required.' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' })
  }

  const Model = modelByRole[req.role]
  const account = await Model.findById(req.user._id)

  const match = await bcrypt.compare(oldPassword, account.password)
  if (!match) {
    return res.status(401).json({ message: 'Your old password is incorrect.' })
  }

  account.password = await bcrypt.hash(newPassword, 10)
  await account.save()

  res.json({ message: 'Password changed successfully.' })
})

// --- Current logged-in user ---
export const getMe = asyncHandler(async (req, res) => {
  res.json({ role: req.role, user: sanitize(req.user) })
})

// --- Self-service Email Change (Super Admin / Sub Admin / Teacher / Student) ---
// Step 1: request a confirmation code. It is sent to the CURRENT email on
// file (not the new one) - the account holder must prove they still control
// their existing inbox before the address is allowed to change.
export const requestMyEmailChange = asyncHandler(async (req, res) => {
  const { newEmail } = req.body
  const Model = modelByRole[req.role]
  const account = await Model.findById(req.user._id)
  if (!account) return res.status(404).json({ message: 'Account not found.' })

  try {
    const { maskedEmail, devOtp } = await requestEmailChange({ role: req.role, account, newEmail })
    res.json({
      message: `A confirmation code was sent to your current email (${maskedEmail}). Enter it below to confirm the change.`,
      maskedEmail,
      ...(devOtp ? { devOtp } : {}),
    })
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message })
  }
})

// Step 2: verify the code and apply the new email.
export const verifyMyEmailChange = asyncHandler(async (req, res) => {
  const { otp } = req.body
  const Model = modelByRole[req.role]
  const account = await Model.findById(req.user._id)
  if (!account) return res.status(404).json({ message: 'Account not found.' })

  try {
    const { newEmail } = await verifyEmailChange({ role: req.role, account, otp })
    res.json({ message: 'Your email has been updated successfully.', email: newEmail })
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message })
  }
})
