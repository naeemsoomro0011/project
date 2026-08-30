import mongoose from 'mongoose'

const superAdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash
    phone: { type: String, required: true, unique: true, trim: true },
    gender: { type: String, enum: ['Male', 'Female'], default: 'Male' },
    photo: { type: String, default: '' },
    country: { type: String, default: 'Pakistan' },
  },
  { timestamps: true }
)

export default mongoose.model('SuperAdmin', superAdminSchema)
