import mongoose from 'mongoose'

// One completed topic, recorded against a specific slot (batch). Storing it
// per-slot (rather than per-course) is what lets one teacher's Batch-1 be
// ahead of another teacher's Batch-2 of the very same course.
const completedTopicSchema = new mongoose.Schema(
  {
    moduleId: { type: mongoose.Schema.Types.ObjectId, required: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, required: true },
    completedDate: { type: Date, default: Date.now },
  },
  { _id: false }
)

const slotSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true },
    batchLabel: { type: String, required: true }, // Batch-1, Batch-2 ... auto-assigned per course+campus
    // Optional at creation time - a Slot (batch) can exist before a Trainer
    // is assigned to it. This is what lets "a Slot must exist before you can
    // add a Trainer for that campus" actually work without a chicken-and-egg
    // deadlock: create the empty slot first, then either assign a trainer to
    // it directly, or add a new Trainer (which now requires at least one
    // slot to already exist at that campus) and assign them afterward.
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
    scheduleDays: { type: [Number], default: [] }, // 0=Sun ... 6=Sat
    startTime: { type: String, default: '' }, // "02:00 PM"
    endTime: { type: String, default: '' }, // "04:00 PM"
    gender: { type: String, enum: ['Male', 'Female', 'Mixed'], default: 'Mixed' },
    classType: { type: String, default: 'Regular' },
    capacity: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    registrationOpen: { type: Boolean, default: true },
    // When true, only Super Admin may flip registrationOpen back - a Sub
    // Admin who tries gets a clear "Super Admin has closed/opened this" message.
    registrationLockedBySuperAdmin: { type: Boolean, default: false },
    whatsappLink: { type: String, default: '' },
    completedTopics: { type: [completedTopicSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'createdByModel' },
    createdByModel: { type: String, enum: ['SuperAdmin', 'SubAdmin'], default: 'SubAdmin' },
  },
  { timestamps: true }
)

slotSchema.virtual('seatsUsed', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'slot',
  count: true,
})

export default mongoose.model('Slot', slotSchema)
