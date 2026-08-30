// Permission *definitions* (keys, labels, which actions each module
// supports) are UI configuration, not per-account data - so they live here
// as a single shared source instead of the database. What IS per-account
// data is which of these keys a given Sub Admin actually has, which comes
// back from the API on their SubAdmin document (`permissionKeys`).

export const permissionActionsOrder = ['READ', 'WRITE', 'UPDATE', 'EXPORT']

export const permissions = [
  { key: 'DASHBOARD', label: 'Dashboard', actions: ['READ'] },
  { key: 'STUDENT', label: 'Student', actions: ['READ', 'WRITE', 'UPDATE', 'EXPORT'] },
  { key: 'STUDENT_EXPORT', label: 'Student Export', actions: ['READ'] },
  { key: 'ATTENDANCE_VIEW', label: 'Attendance View', actions: ['READ', 'WRITE', 'UPDATE', 'EXPORT'] },
  { key: 'ATTENDANCE_MARK', label: 'Attendance Mark', actions: ['READ', 'WRITE', 'UPDATE'] },
  { key: 'ATTENDANCE_ADD_MULTI', label: 'Attendance Add Multi', actions: ['READ', 'WRITE', 'UPDATE'] },
  { key: 'SLOT', label: 'Slot', actions: ['READ', 'WRITE', 'UPDATE'] },
  { key: 'TRAINER', label: 'Trainer', actions: ['READ', 'WRITE', 'UPDATE'] },
  { key: 'TRAINER_ATTENDANCE_MARK', label: 'Trainer Attendance Mark', actions: ['READ', 'WRITE', 'UPDATE'] },
  { key: 'TRAINER_ATTENDANCE_VIEW', label: 'Trainer Attendance View', actions: ['READ', 'WRITE', 'UPDATE'] },
  { key: 'TRAINER_ATTENDANCE_REQUEST', label: 'Trainer Attendance Request', actions: ['READ', 'WRITE', 'UPDATE'] },
  { key: 'UPDATION', label: 'Updation', actions: ['READ', 'WRITE'] },
  { key: 'SUB_ADMIN', label: 'Sub Admin Management', actions: ['READ', 'WRITE', 'UPDATE'] },
  { key: 'CAMPUS', label: 'Campus Management', actions: ['READ', 'WRITE', 'UPDATE'] },
  { key: 'SETTINGS', label: 'Org Settings', actions: ['READ', 'WRITE', 'UPDATE'] },
]

export const subAdminPermissionKeys = permissions
  .filter((p) => !['SUB_ADMIN', 'CAMPUS', 'SETTINGS'].includes(p.key))
  .map((p) => p.key)

export const roleTemplates = ['Campus Manager', 'Receptionist', 'Coordinator', 'Accountant']

// Quick-apply permission preset per role, used by the Add/Edit Sub Admin
// popup so Super Admin can pick a role and get a sensible starting point,
// then fine-tune individual keys before saving.
export const roleTemplatePermissions = {
  'Campus Manager': ['DASHBOARD', 'STUDENT', 'STUDENT_EXPORT', 'ATTENDANCE_VIEW', 'ATTENDANCE_MARK', 'ATTENDANCE_ADD_MULTI', 'SLOT', 'TRAINER', 'TRAINER_ATTENDANCE_MARK', 'TRAINER_ATTENDANCE_VIEW', 'TRAINER_ATTENDANCE_REQUEST', 'UPDATION'],
  Receptionist: ['DASHBOARD', 'STUDENT', 'ATTENDANCE_MARK', 'ATTENDANCE_VIEW'],
  Coordinator: ['DASHBOARD', 'STUDENT', 'ATTENDANCE_VIEW', 'SLOT', 'TRAINER'],
  Accountant: ['DASHBOARD', 'STUDENT', 'ATTENDANCE_VIEW'],
}

export const genders = ['Male', 'Female']
export const computerLevels = ['Beginner', 'Intermediate', 'Advanced']
export const qualifications = ['Matric', 'Intermediate', 'Bachelors', 'Masters']

// Checks whether `permissionKeys` (the array on the logged-in account)
// includes the given module key. Super Admin callers can skip this
// entirely - they implicitly have every permission everywhere.
export function hasPermission(permissionKeys, key) {
  return Array.isArray(permissionKeys) && permissionKeys.includes(key)
}
