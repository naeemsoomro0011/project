import mongoose from 'mongoose'

const otpSchema = new mongoose.Schema(
  {
    accountModel: { type: String, enum: ['SuperAdmin', 'SubAdmin', 'Teacher', 'Student'], required: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true },
    phone: { type: String, default: '' },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumed: { type: Boolean, default: false },

    // What this code is for. 'password_reset' -> Forgot Password flow.
    // 'email_change' -> confirming a request to change the email on file
    // (self-service edit, or Super Admin / Sub Admin editing a Trainer's or
    // Sub Admin's email). The code is always delivered to the CURRENT email
    // on file, never the new one, so only someone with access to the
    // existing inbox can approve the switch.
    purpose: { type: String, enum: ['password_reset', 'email_change'], default: 'password_reset' },

    // Only set for purpose: 'email_change' - the email address that gets
    // applied to the account once this code is verified.
    newEmail: { type: String, default: null },
  },
  { timestamps: true }
)

// MongoDB TTL index - documents are automatically deleted once expiresAt passes.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('Otp', otpSchema)
