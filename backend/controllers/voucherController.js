import Voucher from '../models/Voucher.js'
import Student from '../models/Student.js'
import { nextInvoiceNumber } from '../utils/generateIds.js'
import { asyncHandler } from '../middleware/errorHandler.js'

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
function currentMonthLabel() {
  return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
}
function dueDateForThisMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 8) // 8th of the current month
}

async function generateForStudent(student, amount, generatedBy, generatedByModel) {
  const priorCount = await Voucher.countDocuments({ student: student._id })
  const type = priorCount === 0 ? 'Registration' : 'Monthly'
  const monthKey = type === 'Monthly' ? currentMonthKey() : ''

  if (type === 'Monthly') {
    const already = await Voucher.findOne({ student: student._id, monthKey, type: 'Monthly' })
    if (already) return { skipped: true, reason: `${currentMonthLabel()} voucher already generated.` }
  }

  const invoiceNo = await nextInvoiceNumber()
  const voucher = await Voucher.create({
    student: student._id,
    invoiceNo,
    type,
    month: type === 'Monthly' ? currentMonthLabel() : '-',
    monthKey,
    dueDate: dueDateForThisMonth(),
    amount,
    generatedBy,
    generatedByModel,
  })
  return { skipped: false, voucher }
}

export const generateVoucherForStudent = asyncHandler(async (req, res) => {
  const { amount } = req.body
  if (!amount || amount <= 0) return res.status(400).json({ message: 'A valid amount is required.' })

  const student = await Student.findById(req.params.studentId)
  if (!student) return res.status(404).json({ message: 'Student not found.' })
  if (req.role === 'subadmin' && String(student.campus) !== String(req.user.campus)) {
    return res.status(403).json({ message: 'This student belongs to a different campus.' })
  }

  const result = await generateForStudent(student, amount, req.user._id, req.role === 'superadmin' ? 'SuperAdmin' : 'SubAdmin')
  if (result.skipped) return res.status(409).json({ message: result.reason })
  res.status(201).json(result.voucher)
})

export const generateVouchersBulk = asyncHandler(async (req, res) => {
  const { amount } = req.body
  if (!amount || amount <= 0) return res.status(400).json({ message: 'A valid amount is required.' })

  const filter = req.role === 'subadmin' ? { campus: req.user.campus, status: { $ne: 'dropout' } } : { status: { $ne: 'dropout' } }
  const students = await Student.find(filter)

  let generated = 0, skipped = 0
  for (const student of students) {
    const result = await generateForStudent(student, amount, req.user._id, req.role === 'superadmin' ? 'SuperAdmin' : 'SubAdmin')
    if (result.skipped) skipped++
    else generated++
  }

  res.json({ message: `Generated ${generated} voucher(s). Skipped ${skipped} (already generated this month).`, generated, skipped })
})

export const vouchersForStudent = asyncHandler(async (req, res) => {
  const vouchers = await Voucher.find({ student: req.params.studentId }).sort({ createdAt: -1 })
  res.json(vouchers)
})

export const myVouchers = asyncHandler(async (req, res) => {
  const vouchers = await Voucher.find({ student: req.user._id }).sort({ createdAt: -1 })
  res.json(vouchers)
})

export const setVoucherStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!['Paid', 'Pending'].includes(status)) return res.status(400).json({ message: 'Invalid status.' })
  const voucher = await Voucher.findByIdAndUpdate(req.params.id, { status }, { new: true })
  if (!voucher) return res.status(404).json({ message: 'Voucher not found.' })
  res.json(voucher)
})
