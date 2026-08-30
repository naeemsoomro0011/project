import Otp from '../models/Otp.js'
import { sendMail } from './mailer.js'
import { otpEmailTemplate } from './emailTemplates.js'
import { findDuplicateAccount } from './checkUnique.js'

const ACCOUNT_MODEL_BY_ROLE = {
  superadmin: 'SuperAdmin',
  subadmin: 'SubAdmin',
  teacher: 'Teacher',
  student: 'Student',
}

const EMAIL_CHANGE_EXPIRY_MINUTES = 10

export function maskEmail(email) {
  const [user, domain] = String(email || '').split('@')
  if (!domain) return '****'
  const visible = user.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(user.length - visible.length, 1))}@${domain}`
}

function httpError(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

/**
 * Step 1 of the Email Change flow, for both self-edit AND an admin (Super
 * Admin / Sub Admin) editing someone else's account (Trainer, Sub Admin).
 *
 * The confirmation code is ALWAYS sent to the account's CURRENT email on
 * file - never the new one being requested - so nobody can silently hijack
 * an account's email without whoever controls the existing inbox approving
 * it first.
 *
 * `role` here refers to the ROLE OF THE ACCOUNT WHOSE EMAIL IS CHANGING
 * (the target), not the role of whoever is making the request.
 */
export async function requestEmailChange({ role, account, newEmail }) {
  if (!newEmail || !newEmail.trim()) {
    throw httpError('New email is required.', 400)
  }
  const cleanEmail = newEmail.toLowerCase().trim()
  const accountModel = ACCOUNT_MODEL_BY_ROLE[role]
  if (!accountModel) throw httpError('Invalid role.', 400)

  if (cleanEmail === account.email) {
    throw httpError('This is already the current email on this account.', 400)
  }

  const dup = await findDuplicateAccount({
    email: cleanEmail,
    excludeId: account._id,
    excludeModel: accountModel,
  })
  if (dup.duplicate) {
    throw httpError(`This email is already used by another account (${dup.inModel}).`, 409)
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + EMAIL_CHANGE_EXPIRY_MINUTES * 60 * 1000)

  await Otp.create({
    accountModel,
    accountId: account._id,
    phone: account.phone || '',
    code,
    expiresAt,
    purpose: 'email_change',
    newEmail: cleanEmail,
  })

  await sendMail({
    to: account.email,
    subject: 'Confirm Your Email Change — Titan Portal',
    html: otpEmailTemplate({
      name: account.name,
      code,
      minutes: EMAIL_CHANGE_EXPIRY_MINUTES,
      heading: 'Confirm Your Email Change',
      message: `We received a request to change the email address on your Titan Portal account
        from <strong>${account.email}</strong> to <strong>${cleanEmail}</strong>.
        Enter the code below to confirm this change. If you didn't request this,
        simply ignore this email and your address will stay exactly as it is.`,
    }),
  })

  const devExposeOtp = process.env.DEV_EXPOSE_OTP === 'true'
  return {
    maskedEmail: maskEmail(account.email),
    ...(devExposeOtp ? { devOtp: code } : {}),
  }
}

/**
 * Step 2 - verifies the code against the CURRENT email's inbox and, only if
 * it matches and hasn't expired, applies the new email to the account.
 */
export async function verifyEmailChange({ role, account, otp }) {
  if (!otp || !otp.trim()) {
    throw httpError('OTP is required.', 400)
  }
  const accountModel = ACCOUNT_MODEL_BY_ROLE[role]
  if (!accountModel) throw httpError('Invalid role.', 400)

  const otpDoc = await Otp.findOne({
    accountModel,
    accountId: account._id,
    purpose: 'email_change',
    code: otp.trim(),
    consumed: false,
  }).sort({ createdAt: -1 })

  if (!otpDoc) {
    throw httpError('Invalid code.', 401)
  }
  if (otpDoc.expiresAt < new Date()) {
    throw httpError('This code has expired. Please request a new one.', 401)
  }

  const previousEmail = account.email
  account.email = otpDoc.newEmail
  await account.save()

  otpDoc.consumed = true
  await otpDoc.save()

  return { account, previousEmail, newEmail: otpDoc.newEmail }
}
