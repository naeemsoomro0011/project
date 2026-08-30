import mongoose from 'mongoose'

const voucherSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    invoiceNo: { type: String, required: true, unique: true },
    type: { type: String, enum: ['Registration', 'Monthly'], required: true },
    month: { type: String, default: '-' }, // e.g. "July 2026"
    monthKey: { type: String, default: '' }, // e.g. "2026-07" - used to prevent duplicate generation
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'generatedByModel' },
    generatedByModel: { type: String, enum: ['SuperAdmin', 'SubAdmin'], default: 'SubAdmin' },
  },
  { timestamps: true }
)

// A student can only have one Monthly voucher per calendar month.
voucherSchema.index({ student: 1, monthKey: 1, type: 1 }, { unique: true, partialFilterExpression: { type: 'Monthly' } })

export default mongoose.model('Voucher', voucherSchema)
