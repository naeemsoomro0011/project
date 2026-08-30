import mongoose from 'mongoose'

const campusSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    capacityOfStudents: { type: Number, default: 0 },
  },
  { timestamps: true }
)

campusSchema.index({ name: 1, city: 1 }, { unique: true })

export default mongoose.model('Campus', campusSchema)
