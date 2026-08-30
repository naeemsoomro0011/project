import mongoose from 'mongoose'

const teacherAttendanceSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    lateMinutes: { type: Number, default: 0 },
    totalMinutes: { type: Number, default: 0 }, // time actually spent, capped by scheduled class length
    markedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'markedByModel' },
    markedByModel: { type: String, enum: ['SuperAdmin', 'SubAdmin'], default: 'SubAdmin' },
  },
  { timestamps: true }
)

teacherAttendanceSchema.index({ teacher: 1, slot: 1, date: 1 }, { unique: true })

export default mongoose.model('TeacherAttendance', teacherAttendanceSchema)
