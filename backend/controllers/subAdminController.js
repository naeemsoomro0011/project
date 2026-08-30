import bcrypt from 'bcryptjs'
import SubAdmin from '../models/SubAdmin.js'
import Campus from '../models/Campus.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { sendMail } from '../utils/mailer.js'
import { welcomeEmailTemplate } from '../utils/emailTemplates.js'
import { requestEmailChange, verifyEmailChange } from '../utils/emailChangeService.js'

export const listSubAdmins = asyncHandler(async (req, res) => {
  const subAdmins = await SubAdmin.find().populate('campus', 'name city').select('-password').sort({ createdAt: -1 })
  res.json(subAdmins)
})

export const getSubAdmin = asyncHandler(async (req, res) => {
  const subAdmin = await SubAdmin.findById(req.params.id).populate('campus', 'name city').select('-password')
  if (!subAdmin) return res.status(404).json({ message: 'Sub Admin not found.' })
  res.json(subAdmin)
})

export const createSubAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, phone, employeeId, gender, photo, campus, role, permissionKeys, permissionActions } = req.body
  if (!name || !email || !password || !phone || !campus || !employeeId) {
    return res.status(400).json({ message: 'Name, email, password, phone, ID and campus are required.' })
  }

  const campusDoc = await Campus.findById(campus)
  if (!campusDoc) return res.status(404).json({ message: 'Selected campus was not found.' })

  const existingForCampus = await SubAdmin.findOne({ campus })
  if (existingForCampus) {
    return res.status(409).json({
      message: `${campusDoc.name} already has a Sub Admin (${existingForCampus.name}). Edit that account instead, or pick a different campus.`,
    })
  }

  // A Sub Admin's uniqueness is anchored on their Sub Admin ID alone - two
  // Sub Admins are allowed to share the same name, email, or phone number.
  const idTaken = await SubAdmin.findOne({ employeeId: employeeId.trim() }).lean()
  if (idTaken) {
    return res.status(409).json({ message: 'This Sub Admin ID is already in use. Please choose a different one.' })
  }

  const hashed = await bcrypt.hash(password, 10)
  const subAdmin = await SubAdmin.create({
    name,
    email,
    password: hashed,
    phone,
    employeeId: employeeId.trim(),
    gender,
    photo,
    city: campusDoc.city,
    campus,
    role: role || 'Campus Manager',
    permissionKeys: permissionKeys || [],
    permissionActions: permissionActions || {},
    createdBy: req.user._id,
  })

  const safe = subAdmin.toObject()
  delete safe.password
  res.status(201).json(safe)

  sendMail({
    to: subAdmin.email,
    subject: 'Welcome to Titan Portal 🎉',
    html: welcomeEmailTemplate({ name: subAdmin.name, role: 'Sub Admin', loginEmail: subAdmin.email }),
  }).catch(() => {})
})

export const updateSubAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, phone, employeeId, gender, photo, role, permissionKeys, permissionActions } = req.body
  const subAdmin = await SubAdmin.findById(req.params.id)
  if (!subAdmin) return res.status(404).json({ message: 'Sub Admin not found.' })

  // Email changes always go through the OTP-confirmed flow below - a Super
  // Admin editing a Sub Admin's email included - never set inline here.
  if (email && email.toLowerCase().trim() !== subAdmin.email) {
    return res.status(400).json({
      message: 'Email can\'t be changed here. Use the "Change Email" action, which sends a confirmation code to the Sub Admin\'s current email first.',
      code: 'EMAIL_CHANGE_REQUIRES_OTP',
    })
  }

  if (employeeId && employeeId.trim() !== subAdmin.employeeId) {
    const idTaken = await SubAdmin.findOne({ employeeId: employeeId.trim(), _id: { $ne: subAdmin._id } }).lean()
    if (idTaken) {
      return res.status(409).json({ message: 'This Sub Admin ID is already in use. Please choose a different one.' })
    }
    subAdmin.employeeId = employeeId.trim()
  }

  if (name) subAdmin.name = name
  if (phone) subAdmin.phone = phone
  if (gender) subAdmin.gender = gender
  if (photo) subAdmin.photo = photo
  if (role) subAdmin.role = role
  if (permissionKeys) subAdmin.permissionKeys = permissionKeys
  if (permissionActions) subAdmin.permissionActions = permissionActions
  if (password) subAdmin.password = await bcrypt.hash(password, 10)

  await subAdmin.save()
  const safe = subAdmin.toObject()
  delete safe.password
  res.json(safe)
})

export const toggleSuspendSubAdmin = asyncHandler(async (req, res) => {
  const subAdmin = await SubAdmin.findById(req.params.id)
  if (!subAdmin) return res.status(404).json({ message: 'Sub Admin not found.' })
  subAdmin.status = subAdmin.status === 'suspended' ? 'active' : 'suspended'
  await subAdmin.save()
  res.json({ message: `Sub Admin ${subAdmin.status === 'suspended' ? 'suspended' : 'activated'}.`, status: subAdmin.status })
})

// Simple, direct delete - Super Admin confirms once on the frontend and the
// account is gone. A campus is allowed to sit without a Sub Admin; Super
// Admin can always add a new one later from the Sub Admins page whenever
// they choose to.
export const deleteSubAdmin = asyncHandler(async (req, res) => {
  const outgoing = await SubAdmin.findById(req.params.id)
  if (!outgoing) return res.status(404).json({ message: 'Sub Admin not found.' })

  const outgoingName = outgoing.name
  await SubAdmin.findByIdAndDelete(outgoing._id)

  res.json({ message: `${outgoingName} has been removed.` })
})

// Self-service profile edit (the logged-in Sub Admin editing their own info)
export const updateMySubAdminProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, photo } = req.body
  const subAdmin = await SubAdmin.findById(req.user._id)

  if (email && email.toLowerCase().trim() !== subAdmin.email) {
    return res.status(400).json({
      message: 'Email can\'t be changed here. Use "Change Email", which sends a confirmation code to your current email first.',
      code: 'EMAIL_CHANGE_REQUIRES_OTP',
    })
  }

  if (name) subAdmin.name = name
  if (phone) subAdmin.phone = phone
  if (photo !== undefined) subAdmin.photo = photo

  await subAdmin.save()
  const safe = subAdmin.toObject()
  delete safe.password
  res.json(safe)
})

// --- Email Change (OTP-confirmed), Super Admin changing a Sub Admin's email ---
// A Sub Admin changing their OWN email uses the generic
// /api/auth/email-change/request|verify endpoints. The code always goes to
// the Sub Admin's CURRENT email on file, so the change only goes through if
// that inbox confirms it.
export const requestSubAdminEmailChange = asyncHandler(async (req, res) => {
  const subAdmin = await SubAdmin.findById(req.params.id)
  if (!subAdmin) return res.status(404).json({ message: 'Sub Admin not found.' })
  try {
    const { maskedEmail, devOtp } = await requestEmailChange({ role: 'subadmin', account: subAdmin, newEmail: req.body.newEmail })
    res.json({
      message: `A confirmation code was sent to this Sub Admin's current email (${maskedEmail}). The change only applies once that code is entered correctly.`,
      maskedEmail,
      ...(devOtp ? { devOtp } : {}),
    })
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message })
  }
})

export const verifySubAdminEmailChange = asyncHandler(async (req, res) => {
  const subAdmin = await SubAdmin.findById(req.params.id)
  if (!subAdmin) return res.status(404).json({ message: 'Sub Admin not found.' })
  try {
    const { newEmail } = await verifyEmailChange({ role: 'subadmin', account: subAdmin, otp: req.body.otp })
    res.json({ message: 'Sub Admin email updated successfully.', email: newEmail })
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message })
  }
})
