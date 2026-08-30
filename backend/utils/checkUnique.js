import SuperAdmin from '../models/SuperAdmin.js'
import SubAdmin from '../models/SubAdmin.js'
import Teacher from '../models/Teacher.js'
import Student from '../models/Student.js'

// The portal spec is explicit: the same email or phone number can never
// belong to two accounts, no matter which of the four roles they're in,
// and the same is true for CNIC among students. This checks all four
// collections at once and returns which field collided (if any), so
// controllers can send back a precise error instead of a generic 500
// when a unique index throws.
//
// `excludeId` + `excludeModel` let an "edit profile" call skip matching
// against itself.
export async function findDuplicateAccount({ email, phone, cnic, excludeId, excludeModel }) {
  const checks = [
    { Model: SuperAdmin, name: 'SuperAdmin' },
    { Model: SubAdmin, name: 'SubAdmin' },
    { Model: Teacher, name: 'Teacher' },
    { Model: Student, name: 'Student' },
  ]

  for (const { Model, name } of checks) {
    const or = []
    if (email) or.push({ email: email.toLowerCase().trim() })
    if (phone) or.push({ phone: phone.trim() })
    if (cnic && Model === Student) or.push({ cnic: cnic.trim() })
    if (or.length === 0) continue

    const query = { $or: or }
    if (excludeId && excludeModel === name) {
      query._id = { $ne: excludeId }
    }

    const match = await Model.findOne(query).lean()
    if (match) {
      let field = 'email'
      if (phone && match.phone === phone.trim()) field = 'phone'
      if (cnic && Model === Student && match.cnic === cnic.trim()) field = 'cnic'
      return { duplicate: true, field, inModel: name }
    }
  }

  return { duplicate: false }
}
