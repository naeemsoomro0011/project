import mongoose from 'mongoose'

const subAdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Not unique on purpose: employeeId (Sub Admin ID) is the single unique
    // identifier for a Sub Admin, so two accounts are allowed to share the
    // same name/email/phone. Login still resolves correctly because it
    // matches email *and* password together - see loginWithEmail() in
    // authController.js. Mirrors the same setup used for Teacher.
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash
    phone: { type: String, required: true, trim: true },
    employeeId: { type: String, required: true, unique: true }, // this is what uniquely identifies a Sub Admin
    gender: { type: String, enum: ['Male', 'Female'], default: 'Female' },
    photo: { type: String, default: '' },
    country: { type: String, default: 'Pakistan' },
    city: { type: String, required: true },
    campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true },
    role: { type: String, default: 'Campus Manager' }, // role template label
    permissionKeys: { type: [String], default: [] },
    // Per-module action grants, e.g. { STUDENT: ['READ','WRITE'], SLOT: ['READ'] }.
    // This is the real source of truth for what a Sub Admin can do inside a
    // module they have access to - permissionKeys above only says *whether*
    // they have the module at all (kept for backward compatibility with the
    // sidebar and older records).
    permissionActions: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
  },
  { timestamps: true }
)

export default mongoose.model('SubAdmin', subAdminSchema)
