import jwt from 'jsonwebtoken'
import SuperAdmin from '../models/SuperAdmin.js'
import SubAdmin from '../models/SubAdmin.js'
import Teacher from '../models/Teacher.js'
import Student from '../models/Student.js'

const modelByRole = {
  superadmin: SuperAdmin,
  subadmin: SubAdmin,
  teacher: Teacher,
  student: Student,
}

// Verifies the JWT on every request and re-loads the account fresh from the
// database (rather than trusting the token payload) so a Super Admin
// suspending a Sub Admin/Teacher, or dropping out a Student, takes effect
// immediately on their very next request - not just at their next login.
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided.' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const Model = modelByRole[decoded.role]
    if (!Model) {
      return res.status(401).json({ message: 'Not authorized, invalid role in token.' })
    }

    const account = await Model.findById(decoded.id).select('-password')
    if (!account) {
      return res.status(401).json({ message: 'Not authorized, account no longer exists.' })
    }

    if (decoded.role === 'subadmin' && account.status === 'suspended') {
      return res.status(403).json({ message: 'Your Sub Admin account has been suspended.', code: 'SUSPENDED' })
    }
    if (decoded.role === 'teacher' && account.status === 'suspended') {
      return res.status(403).json({ message: 'Your Trainer account has been suspended.', code: 'SUSPENDED' })
    }
    if (decoded.role === 'student' && account.accountBlocked) {
      return res.status(403).json({
        message: account.blockedReason || 'Your account has been blocked.',
        code: 'BLOCKED',
      })
    }

    req.user = account
    req.role = decoded.role
    next()
  } catch {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired.' })
  }
}

// Usage: restrictTo('superadmin'), restrictTo('superadmin', 'subadmin')
export function restrictTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' })
    }
    next()
  }
}
