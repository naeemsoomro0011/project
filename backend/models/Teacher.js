import mongoose from 'mongoose'

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Not unique on purpose: employeeId (Trainer ID) is the single unique
    // identifier for a trainer, so two trainers are allowed to share the
    // same email/phone (e.g. real siblings, shared family contact, data
    // entered before an individual email exists yet). Login still resolves
    // correctly because it matches email *and* password together - see
    // loginWithEmail() in authController.js.
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash
    phone: { type: String, required: true, trim: true }, // no longer unique on purpose - see employeeId
    employeeId: { type: String, required: true, unique: true }, // this is now what uniquely identifies a trainer
    gender: { type: String, enum: ['Male', 'Female'], default: 'Male' },
    photo: { type: String, default: '' },
    city: { type: String, required: true },
    campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true },
    hourlyRate: { type: Number, default: 0 },
    bio: { type: String, default: '' },
    designation: { type: String, default: '' }, // e.g. "Full Stack Web Developer" - shown on the ID card
    socialLinks: {
      type: [
        {
          platform: String,
          url: String,
        },
      ],
      default: [],
    },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'createdByModel' },
    createdByModel: { type: String, enum: ['SuperAdmin', 'SubAdmin'], default: 'SubAdmin' },
  },
  { timestamps: true }
)

export default mongoose.model('Teacher', teacherSchema)
