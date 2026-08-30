// Professional, dynamic HTML email templates for Titan Portal.
// Every email shares one branded shell so all outgoing mail (OTPs, welcome
// messages, etc.) looks consistent, premium, and unmistakably from
// "Titan Portal" - inline CSS only, since most email clients strip <style>
// blocks in the <head>.

const BRAND_NAME = 'Titan Portal'
const BRAND_GRADIENT = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
const CURRENT_YEAR = new Date().getFullYear()

function shell({ preheader = '', bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${BRAND_NAME}</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <span style="display:none; font-size:1px; color:#f3f4f6; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    ${preheader}
  </span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(17,24,39,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${BRAND_GRADIENT}; padding:32px 32px 28px; text-align:center;">
              <div style="display:inline-block; width:64px; height:64px; border-radius:16px; background:#ffffff; padding:8px; box-sizing:border-box; margin-bottom:14px; box-shadow:0 2px 10px rgba(17,24,39,0.15); line-height:0;">
                <img src="cid:titanlogo" width="48" height="48" alt="${BRAND_NAME}" style="display:block; width:48px; height:48px; object-fit:contain;" />
              </div>
              <div style="color:#ffffff; font-size:22px; font-weight:700; letter-spacing:0.3px;">
                ${BRAND_NAME}
              </div>
              <div style="color:rgba(255,255,255,0.85); font-size:13px; margin-top:4px;">
                Learning Management &amp; Campus Portal
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 8px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 32px 32px;">
              <div style="border-top:1px solid #e5e7eb; padding-top:20px; text-align:center;">
                <div style="color:#9ca3af; font-size:12px; line-height:1.6;">
                  This is an automated message from <strong style="color:#6b7280;">${BRAND_NAME}</strong>.
                  Please do not reply directly to this email.
                </div>
                <div style="color:#c4c9d2; font-size:11px; margin-top:8px;">
                  &copy; ${CURRENT_YEAR} ${BRAND_NAME}. All rights reserved.
                </div>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Generic OTP email - used for Forgot Password AND Email Change confirmation.
 * `heading` + `message` let the caller describe exactly what the code is
 * confirming, so the same template stays reusable and dynamic instead of
 * needing a near-duplicate file per use case.
 */
export function otpEmailTemplate({ name, code, minutes = 5, heading, message }) {
  const bodyHtml = `
    <h1 style="margin:0 0 14px; font-size:20px; color:#111827; font-weight:700;">
      ${heading}
    </h1>
    <p style="margin:0 0 22px; font-size:14.5px; line-height:1.7; color:#4b5563;">
      Hi <strong style="color:#111827;">${name || 'there'}</strong>,<br/><br/>
      ${message}
    </p>

    <div style="background:#f5f3ff; border:1px solid #ddd6fe; border-radius:12px; padding:22px; text-align:center; margin:0 0 22px;">
      <div style="color:#6b7280; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:10px;">
        Your Verification Code
      </div>
      <div style="font-size:36px; font-weight:800; letter-spacing:10px; color:#4f46e5; font-family:'Courier New', monospace;">
        ${code}
      </div>
      <div style="color:#9ca3af; font-size:12px; margin-top:12px;">
        This code expires in ${minutes} minute${minutes === 1 ? '' : 's'}.
      </div>
    </div>

    <p style="margin:0 0 6px; font-size:13px; line-height:1.7; color:#6b7280;">
      For your security, never share this code with anyone — not even someone claiming to be from ${BRAND_NAME} support.
      If you didn't request this, you can safely ignore this email.
    </p>
  `
  return shell({ preheader: `Your Titan Portal verification code is ${code}`, bodyHtml })
}

/**
 * Welcome email - sent when a new Titan Portal account is created
 * (Student self-activation, Trainer added by an admin, Sub Admin added by
 * Super Admin, or the initial Super Admin seed).
 */
export function welcomeEmailTemplate({ name, role, loginEmail }) {
  const bodyHtml = `
    <h1 style="margin:0 0 14px; font-size:20px; color:#111827; font-weight:700;">
      Welcome to Titan Portal 🎉
    </h1>
    <p style="margin:0 0 22px; font-size:14.5px; line-height:1.7; color:#4b5563;">
      Hi <strong style="color:#111827;">${name || 'there'}</strong>,<br/><br/>
      Your <strong>${BRAND_NAME}</strong> account has been created successfully as a
      <strong>${role}</strong>. You can now sign in and start using the portal.
    </p>

    <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:18px 20px; margin:0 0 22px;">
      <div style="color:#6b7280; font-size:12px; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:6px;">
        Account Email
      </div>
      <div style="color:#111827; font-size:15px; font-weight:600;">
        ${loginEmail}
      </div>
    </div>

    <p style="margin:0 0 6px; font-size:13px; line-height:1.7; color:#6b7280;">
      If you didn't expect this email or believe it was created in error, please contact your ${BRAND_NAME} administrator.
    </p>
  `
  return shell({ preheader: `Your Titan Portal account is ready`, bodyHtml })
}

/**
 * Login notification email - sent every time a Teacher, Sub Admin or
 * Super Admin successfully logs in, mirroring the same "new sign-in"
 * security alert pattern used by Google/Microsoft/GitHub etc. Purely
 * informational: it never blocks or delays the login response, it just
 * lets the account owner know their account was accessed so they can
 * flag it immediately if it wasn't them.
 */
export function loginNotificationEmailTemplate({ name, role, loginEmail, time, ip, device }) {
  const detailRow = (label, value) =>
    value
      ? `
    <tr>
      <td style="padding:9px 0; border-bottom:1px solid #f3f4f6; color:#9ca3af; font-size:12.5px; letter-spacing:0.04em; text-transform:uppercase; width:38%;">
        ${label}
      </td>
      <td style="padding:9px 0; border-bottom:1px solid #f3f4f6; color:#111827; font-size:14px; font-weight:600; text-align:right;">
        ${value}
      </td>
    </tr>`
      : ''

  const bodyHtml = `
    <div style="text-align:center; margin:0 0 18px;">
      <div style="display:inline-block; width:54px; height:54px; line-height:54px; border-radius:50%; background:#ecfdf5; font-size:24px;">
        🔐
      </div>
    </div>
    <h1 style="margin:0 0 14px; font-size:20px; color:#111827; font-weight:700; text-align:center;">
      New Sign-in to Your Account
    </h1>
    <p style="margin:0 0 22px; font-size:14.5px; line-height:1.7; color:#4b5563;">
      Hi <strong style="color:#111827;">${name || 'there'}</strong>,<br/><br/>
      Your <strong>${BRAND_NAME}</strong> account was just signed in as
      <strong>${role}</strong>. Here are the details:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:4px 18px; margin:0 0 22px;">
      ${detailRow('Account', loginEmail)}
      ${detailRow('Role', role)}
      ${detailRow('Time', time)}
      ${detailRow('IP Address', ip)}
      ${detailRow('Device', device)}
    </table>

    <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:12px; padding:16px 18px; margin:0 0 6px;">
      <p style="margin:0; font-size:13px; line-height:1.7; color:#92400e;">
        <strong>Wasn't you?</strong> Change your password immediately from the portal's "Forgot Password" option
        and contact your ${BRAND_NAME} administrator right away.
      </p>
    </div>
  `
  return shell({ preheader: `New sign-in to your Titan Portal account`, bodyHtml })
}
