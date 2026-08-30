import Counter from '../models/Counter.js'

// Atomically returns the next number for a named counter. Two requests
// arriving at the same instant still get two different numbers because
// MongoDB's findOneAndUpdate + $inc is a single atomic operation.
async function nextSequence(name) {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true }
  )
  if (!doc) {
    throw new Error(`Counter "${name}" was not initialized - check backend/seed.js`)
  }
  return doc.seq
}

// 6-digit student roll number, e.g. 100001, 100002, ...
export async function nextRollNumber() {
  const seq = await nextSequence('studentRoll')
  return String(seq)
}

// 5-digit teacher employee ID, e.g. 10001, 10002, ...
export async function nextEmployeeId() {
  const seq = await nextSequence('teacherEmployeeId')
  return String(seq)
}

// INV-1000, INV-1001, ... used for voucher invoice numbers.
export async function nextInvoiceNumber() {
  const seq = await nextSequence('invoiceNumber')
  return `INV-${seq}`
}
