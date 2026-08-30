import mongoose from 'mongoose'

const assignmentSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, default: 'No Types' },
    dueDate: { type: Date, required: true },
    dueTime: { type: String, default: '' },
    submissionClosed: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.model('Assignment', assignmentSchema)
