import mongoose from 'mongoose'

const feedbackSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true },
    type: { type: String, enum: ['Bug', 'Idea', 'Other'], required: true },
    message: { type: String, required: true },
    image: { type: String, default: '' },
    // Read status is tracked separately per role, so a Sub Admin opening a
    // feedback card only removes it from *their* inbox - Super Admin still
    // gets to see that same feedback once, independently, and vice versa.
    readBySubAdmin: { type: Boolean, default: false },
    readBySuperAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.model('Feedback', feedbackSchema)
