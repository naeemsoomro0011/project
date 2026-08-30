import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    date: { type: Date, required: true }, // stored at midnight UTC for the calendar day
    status: { type: String, enum: ['Present', 'Absent', 'Leave'], required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'markedByModel' },
    markedByModel: { type: String, enum: ['SuperAdmin', 'SubAdmin'], default: 'SubAdmin' },
  },
  { timestamps: true }
)

// One attendance record per student per calendar day.
attendanceSchema.index({ student: 1, date: 1 }, { unique: true })

export default mongoose.model('Attendance', attendanceSchema)
