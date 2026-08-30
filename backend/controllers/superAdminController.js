import SuperAdmin from '../models/SuperAdmin.js'
import { findDuplicateAccount } from '../utils/checkUnique.js'
import { asyncHandler } from '../middleware/errorHandler.js'

export const updateMySuperAdminProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, photo, country } = req.body
  const superAdmin = await SuperAdmin.findById(req.user._id)

  // Email changes always go through the OTP-confirmed flow
  // (/api/auth/email-change/request + /verify) - never set inline here.
  if (email && email.toLowerCase().trim() !== superAdmin.email) {
    return res.status(400).json({
      message: 'Email can\'t be changed here. Use "Change Email", which sends a confirmation code to your current email first.',
      code: 'EMAIL_CHANGE_REQUIRES_OTP',
    })
  }

  if (phone) {
    const dup = await findDuplicateAccount({ phone, excludeId: superAdmin._id, excludeModel: 'SuperAdmin' })
    if (dup.duplicate) {
      return res.status(409).json({ message: `This ${dup.field} is already used by another account (${dup.inModel}).` })
    }
  }

  if (name) superAdmin.name = name
  if (phone) superAdmin.phone = phone
  if (photo !== undefined) superAdmin.photo = photo
  if (country) superAdmin.country = country

  await superAdmin.save()
  const safe = superAdmin.toObject()
  delete safe.password
  res.json(safe)
})
