import nodemailer from 'nodemailer'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The real Titan Portal crest, sent as an inline (CID) attachment on every
// email instead of a remote <img src="https://...">. Inline/CID images are
// embedded straight into the email itself, so the logo always renders -
// even for recipients whose mail client blocks remote images by default,
// and even if this server isn't publicly hosted. Referenced in templates as
// <img src="cid:titanlogo" />.
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'branding', 'titan-logo.png')
const LOGO_ATTACHMENT = {
  filename: 'titan-logo.png',
  path: LOGO_PATH,
  cid: 'titanlogo',
}

/**
 * Single shared Gmail SMTP transporter for the whole app - built lazily
 * (first time sendMail() is actually called) so a missing .env value fails
 * loudly in the console instead of crashing the server at import time.
 *
 * EMAIL_PASS must be a Gmail "App Password" (16 characters, no spaces) -
 * normal Gmail account passwords are rejected by Google's SMTP servers.
 * Generate one at https://myaccount.google.com/apppasswords (requires
 * 2-Step Verification to be turned on for the sending Gmail account).
 */
let transporter = null

function getTransporter() {
  if (transporter) return transporter

  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_PASS

  if (!user || !pass) {
    console.warn(
      '[mailer] EMAIL_USER / EMAIL_PASS are missing from .env - OTP and welcome emails will fail to send.'
    )
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })

  return transporter
}

const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Titan Portal'

/**
 * Sends one email. Never throws - callers should not have their whole
 * request fail just because an email happened to bounce or Gmail rate-
 * limited us; the OTP/record is still saved either way. Errors are logged
 * and the caller gets { sent: false } back so it can decide what to do
 * (e.g. still tell the user the code was "sent" is misleading, so
 * controllers surface a soft warning instead when sent === false).
 */
export async function sendMail({ to, subject, html, attachments = [] }) {
  const t = getTransporter()
  try {
    const info = await t.sendMail({
      from: `"${FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      // Every template's shell() references cid:titanlogo in its header,
      // so the logo attachment is added here once instead of at every
      // call site - callers can still pass their own extra attachments.
      attachments: [LOGO_ATTACHMENT, ...attachments],
    })
    return { sent: true, messageId: info.messageId }
  } catch (err) {
    console.error(`[mailer] Failed to send email to ${to}: ${err.message}`)
    return { sent: false, error: err.message }
  }
}
