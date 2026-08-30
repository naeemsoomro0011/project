import mongoose from 'mongoose'

const teacherAttendanceRequestSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    date: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'markedByModel' },
    markedByModel: { type: String, enum: ['SuperAdmin', 'SubAdmin'], default: 'SubAdmin' },
  },
  { timestamps: true }
)

export default mongoose.model('TeacherAttendanceRequest', teacherAttendanceRequestSchema)
