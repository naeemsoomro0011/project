import mongoose from 'mongoose'

const historyEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    change: { type: String, required: true },
    by: { type: String, required: true },
  },
  { _id: false }
)

const studentSchema = new mongoose.Schema(
  {
    // --- Set by Sub Admin / Super Admin at pre-registration time ---
    name: { type: String, required: true, trim: true },
    fatherName: { type: String, default: '' },
    cnic: { type: String, required: true, unique: true, trim: true },
    fatherCnic: { type: String, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    fatherPhone: { type: String, default: '' },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female'], default: 'Male' },
    address: { type: String, default: '' },
    lastQualification: { type: String, default: '' },
    computerLevel: { type: String, default: '' },
    hasLaptop: { type: Boolean, default: false },
    photo: { type: String, default: '' },
    roll: { type: String, required: true, unique: true }, // 6-digit sequential, auto-generated
    city: { type: String, required: true },
    campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },

    // --- Account activation (student self-service) ---
    password: { type: String, default: null }, // null until student creates their account
    accountCreated: { type: Boolean, default: false },

    // --- Status / lifecycle ---
    status: {
      type: String,
      enum: ['enrolled', 'dropout', 'completed'],
      default: 'enrolled',
    },
    accountBlocked: { type: Boolean, default: false },
    blockedReason: { type: String, default: '' },

    paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Not Generated'], default: 'Not Generated' },
    registrationDate: { type: Date, default: Date.now },
    history: { type: [historyEntrySchema], default: [] },

    createdBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'createdByModel' },
    createdByModel: { type: String, enum: ['SuperAdmin', 'SubAdmin'], default: 'SubAdmin' },
  },
  { timestamps: true }
)

export default mongoose.model('Student', studentSchema)
