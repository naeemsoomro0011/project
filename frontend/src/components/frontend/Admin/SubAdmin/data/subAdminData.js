import { spreadDates, formatDate } from '../../../Media/dateUtils.js'

/* ----------------------------------------------------------
   LOGGED-IN ADMIN + PERMISSIONS
   ----------------------------------------------------------
   Permissions are data, not hard-coded logic — the sidebar and
   action buttons read this list to decide what to show. A real
   backend would send this after login; here it's static, but the
   UI is built to respect it either way. Every permission check
   should ideally also be re-checked on the server once one exists.
*/

export const adminInfo = {
  name: 'Sana Qureshi',
  email: 'suk.smit@gmail.com',
  role: 'Campus Manager',
  country: 'Pakistan',
  city: 'Sukkur',
  campus: 'Saylani TITAN Sukkur Campus',
  phone: '03001234567',
  gender: 'Female',
  photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=faces',
}

export const permissions = [
  { key: 'DASHBOARD', label: 'Dashboard', actions: ['READ'] },
  { key: 'STUDENT', label: 'Student', actions: ['READ', 'WRITE', 'UPDATE'] },
  { key: 'STUDENT_EXPORT', label: 'Student Export', actions: ['READ'] },
  { key: 'ATTENDANCE_VIEW', label: 'Attendance View', actions: ['READ', 'WRITE'] },
  { key: 'ATTENDANCE_MARK', label: 'Attendance Mark', actions: ['READ', 'WRITE', 'UPDATE'] },
  { key: 'ATTENDANCE_ADD_MULTI', label: 'Attendance Add Multi', actions: ['READ', 'WRITE', 'UPDATE'] },
  { key: 'SLOT', label: 'Slot', actions: ['READ', 'WRITE', 'UPDATE'] },
  { key: 'TRAINER', label: 'Trainer', actions: ['READ', 'WRITE', 'UPDATE'] },
  { key: 'TRAINER_ATTENDANCE_MARK', label: 'Trainer Attendance Mark', actions: ['READ', 'WRITE', 'UPDATE'] },
  { key: 'TRAINER_ATTENDANCE_VIEW', label: 'Trainer Attendance View', actions: ['READ', 'WRITE'] },
  { key: 'TRAINER_ATTENDANCE_REQUEST', label: 'Trainer Attendance Request', actions: ['READ', 'UPDATE'] },
  { key: 'UPDATION', label: 'Updation', actions: ['READ', 'WRITE'] },
]

// Checks both (a) that this module even supports the given action, and
// (b) that the currently logged-in Sub Admin was actually granted this
// permission by Super Admin. Reading sessionStorage directly (rather than a
// React hook) keeps this a plain function so every existing call site -
// `hasPermission('STUDENT')` - keeps working without changes.
export function hasPermission(key, action = 'READ') {
  const perm = permissions.find((p) => p.key === key)
  if (!perm || !perm.actions.includes(action)) return false
  try {
    const stored = JSON.parse(sessionStorage.getItem('titan_user') || 'null')
    const granted = stored?.permissionKeys || []
    if (!granted.includes(key)) return false
    const grantedActions = stored?.permissionActions?.[key]
    // Older Sub Admin records saved before per-action grants existed won't
    // have permissionActions for this key yet - treat having the module at
    // all as having every action it supports, same as before.
    if (!grantedActions) return true
    return grantedActions.includes(action)
  } catch {
    return false
  }
}

/* ----------------------------------------------------------
   LOCATION / COURSE CASCADES (Country -> City -> Campus -> Course -> Batch -> Slot)
   ---------------------------------------------------------- */

export const countries = ['Pakistan']

export const citiesByCountry = {
  Pakistan: ['Sukkur', 'Ghotki', 'Karachi', 'Lahore'],
}

export const campusesByCity = {
  Sukkur: ['Saylani TITAN Sukkur Campus'],
  Ghotki: ['SMIT Ghotki Campus'],
  Karachi: ['SMIT Karachi Campus'],
  Lahore: ['SMIT Lahore Campus'],
}

export const coursesByCampus = {
  'Saylani TITAN Sukkur Campus': ['Modern Web Application Development', 'Graphic Designing'],
  'SMIT Ghotki Campus': ['Little Geniuses: Coding, Design & Fun Lab', 'Domestic Electrician'],
  'SMIT Karachi Campus': ['Modern Web Application Development', 'Spoken English'],
  'SMIT Lahore Campus': ['Graphic Designing', 'Domestic Electrician'],
}

export const batchesByCourse = ['Batch-1', 'Batch-2']

export const slotsBySchedule = [
  'Mon/Wed/Fri 02:00 PM - 04:00 PM',
  'Mon/Wed/Fri 04:00 PM - 06:00 PM',
  'Sat/Sun 02:00 PM - 04:00 PM',
  'Sat/Sun 04:00 PM - 06:00 PM',
]

export const genders = ['Male', 'Female']
export const computerLevels = ['Beginner', 'Intermediate', 'Advanced']
export const qualifications = ['Matric', 'Intermediate', 'Bachelors', 'Masters']
export const statusOptions = ['pending', 'approved', 'rejected', 'passed', 'failed', 'enrolled', 'completed']
export const paymentStatusOptions = ['Paid', 'Pending', 'Not Generated']

/* ----------------------------------------------------------
   STUDENTS (registrations)
   ---------------------------------------------------------- */

const studentFirstNames = [
  'Sohna', 'Areesha', 'Bilal', 'Komal', 'Hassan', 'Zoya', 'Usman', 'Mariam',
  'Faizan', 'Sana', 'Talha', 'Hira', 'Danish', 'Anum', 'Saad', 'Rabia',
  'Junaid', 'Iqra',
]
const studentLastNames = [
  'Khan', 'Mahar', 'Soomro', 'Shaikh', 'Memon', 'Bhutto', 'Qureshi', 'Siddiqui',
  'Baloch', 'Rajput', 'Jatoi', 'Chandio', 'Magsi', 'Khoso', 'Junejo', 'Talpur',
  'Abbasi', 'Lakho',
]

function seededValue(seed, mod) {
  const x = Math.sin(seed * 999) * 10000
  return Math.floor((x - Math.floor(x)) * mod)
}

const studentRegDates = spreadDates('2025-10-01', '2026-06-20', studentFirstNames.length)

export const students = studentFirstNames.map((first, i) => {
  const last = studentLastNames[i]
  const campusList = Object.keys(coursesByCampus)
  const campus = campusList[i % campusList.length]
  const cityEntry = Object.entries(campusesByCity).find(([, list]) => list.includes(campus))
  const city = cityEntry ? cityEntry[0] : 'Sukkur'
  const course = coursesByCampus[campus][i % coursesByCampus[campus].length]
  const status = statusOptions[i % statusOptions.length]
  const paymentStatus = paymentStatusOptions[i % paymentStatusOptions.length]
  const roll = `${800000 + seededValue(i + 1, 199999)}`

  return {
    id: `STU${String(i + 1).padStart(3, '0')}`,
    index: i,
    roll,
    name: `${first} ${last}`,
    fatherName: `${studentFirstNames[(i + 5) % studentFirstNames.length]} ${last}`,
    cnic: `5${seededValue(i + 2, 899999999)}`.padEnd(13, '0'),
    fatherCnic: `5${seededValue(i + 9, 899999999)}`.padEnd(13, '0'),
    phone: `030${seededValue(i + 3, 89999999) + 10000000}`,
    fatherPhone: `030${seededValue(i + 4, 89999999) + 10000000}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@gmail.com`,
    dob: 'Jan 1, 2005',
    gender: genders[i % genders.length],
    address: `House #${i + 12}, Street ${i + 3}, ${city}`,
    lastQualification: qualifications[i % qualifications.length],
    computerLevel: computerLevels[i % computerLevels.length],
    hasLaptop: i % 3 === 0,
    country: 'Pakistan',
    city,
    campus,
    course,
    batch: batchesByCourse[i % batchesByCourse.length],
    slot: slotsBySchedule[i % slotsBySchedule.length],
    status,
    paymentStatus,
    sponsorship: i % 6 === 0 ? 'Sponsored' : 'Self-funded',
    registrationDate: studentRegDates[i],
    history: [
      { date: studentRegDates[i], change: 'Registration created', by: 'Sana Qureshi' },
      { date: studentRegDates[i], change: `Status set to "${status}"`, by: 'Sana Qureshi' },
    ],
    vouchers: [
      {
        invoiceNo: `INV-${1000 + i}`,
        paymentId: `PAY-${2000 + i}`,
        type: 'Registration',
        month: '-',
        dueDate: studentRegDates[i],
        amount: 'Rs: 1500/-',
        status: paymentStatus,
      },
      {
        invoiceNo: `INV-${1100 + i}`,
        paymentId: `PAY-${2100 + i}`,
        type: 'Monthly',
        month: 'June 2026',
        dueDate: '08-Jun-2026',
        amount: 'Rs: 1000/-',
        status: i % 2 === 0 ? 'Paid' : 'Pending',
      },
    ],
  }
})

/* ----------------------------------------------------------
   TRAINERS (admin-side master list, across campuses)
   ---------------------------------------------------------- */

export const trainers = [
  { id: 'TR001', employeeId: '84217', name: 'Yasir Ali', nameUrdu: 'یاسر علی', email: 'yasiralilashari123@gmail.com', phone: '03195622019', campus: 'Saylani TITAN Sukkur Campus', coursesTaught: ['Modern Web Application Development'], hourlyRate: '2500/hour', bio: '5 years of full-stack teaching experience.' },
  { id: 'TR002', employeeId: '84218', name: 'Faizan Hussain', nameUrdu: 'فیضان حسین', email: 'faizan.hussain@titan.edu.pk', phone: '03211234567', campus: 'Saylani TITAN Sukkur Campus', coursesTaught: ['Graphic Designing'], hourlyRate: '2000/hour', bio: 'Senior graphic design trainer.' },
  { id: 'TR003', employeeId: '84219', name: 'Sammar Abbas', nameUrdu: 'سمر عباس', email: 'sammar.abbas@titan.edu.pk', phone: '03331234567', campus: 'SMIT Ghotki Campus', coursesTaught: ['Little Geniuses: Coding, Design & Fun Lab'], hourlyRate: '1800/hour', bio: 'Specializes in teaching young learners.' },
  { id: 'TR004', employeeId: '84220', name: 'Hamza Siddiqui', nameUrdu: 'حمزہ صدیقی', email: 'hamza.siddiqui@titan.edu.pk', phone: '03451234567', campus: 'SMIT Ghotki Campus', coursesTaught: ['Domestic Electrician'], hourlyRate: '1700/hour', bio: 'Certified electrician and vocational trainer.' },
  { id: 'TR005', employeeId: '84221', name: 'Ayesha Memon', nameUrdu: 'عائشہ میمن', email: 'ayesha.memon@titan.edu.pk', phone: '03021234567', campus: 'SMIT Karachi Campus', coursesTaught: ['Spoken English'], hourlyRate: '1600/hour', bio: 'IELTS certified language trainer.' },
  { id: 'TR006', employeeId: '84222', name: 'Owais Shah', nameUrdu: 'اویس شاہ', email: 'owais.shah@titan.edu.pk', phone: '03111234567', campus: 'SMIT Karachi Campus', coursesTaught: ['Modern Web Application Development'], hourlyRate: '2400/hour', bio: 'Full-stack developer turned trainer.' },
]

/* ----------------------------------------------------------
   SLOTS (class groups / Administration)
   ---------------------------------------------------------- */

export const slots = [
  { id: 'SLT001', schedule: 'Mon/Wed/Fri 04:00 PM - 06:00 PM', trainer: 'Yasir Ali', course: 'Modern Web Application Development', campus: 'Saylani TITAN Sukkur Campus', classType: 'Regular', gender: 'Male', startDate: 'Oct 1, 2025', endDate: 'Sep 30, 2026', capacity: 30, seatsUsed: 20, registrationOpen: true, whatsappLink: 'https://chat.whatsapp.com/wma-batch1' },
  { id: 'SLT002', schedule: 'Mon/Wed/Fri 02:00 PM - 04:00 PM', trainer: 'Yasir Ali', course: 'Modern Web Application Development', campus: 'Saylani TITAN Sukkur Campus', classType: 'Regular', gender: 'Male', startDate: 'Oct 17, 2025', endDate: 'Oct 16, 2026', capacity: 30, seatsUsed: 30, registrationOpen: false, whatsappLink: 'https://chat.whatsapp.com/wma-batch2' },
  { id: 'SLT003', schedule: 'Sat/Sun 04:00 PM - 06:00 PM', trainer: 'Sammar Abbas', course: 'Little Geniuses: Coding, Design & Fun Lab', campus: 'SMIT Ghotki Campus', classType: 'Kids', gender: 'Male', startDate: 'Sep 1, 2025', endDate: 'Aug 31, 2026', capacity: 30, seatsUsed: 27, registrationOpen: true, whatsappLink: 'https://chat.whatsapp.com/lg-batch1' },
  { id: 'SLT004', schedule: 'Sat/Sun 02:00 PM - 04:00 PM', trainer: 'Sammar Abbas', course: 'Little Geniuses: Coding, Design & Fun Lab', campus: 'SMIT Ghotki Campus', classType: 'Kids', gender: 'Female', startDate: 'Sep 1, 2025', endDate: 'Aug 31, 2026', capacity: 28, seatsUsed: 25, registrationOpen: true, whatsappLink: 'https://chat.whatsapp.com/lg-batch2' },
  { id: 'SLT005', schedule: 'Mon/Wed/Fri 04:00 PM - 06:00 PM', trainer: 'Hamza Siddiqui', course: 'Domestic Electrician', campus: 'SMIT Ghotki Campus', classType: 'Vocational', gender: 'Male', startDate: 'Nov 1, 2025', endDate: 'Apr 30, 2026', capacity: 20, seatsUsed: 14, registrationOpen: true, whatsappLink: 'https://chat.whatsapp.com/electrician-1' },
  { id: 'SLT006', schedule: 'Sat/Sun 12:00 PM - 02:00 PM', trainer: 'Ayesha Memon', course: 'Spoken English', campus: 'SMIT Karachi Campus', classType: 'Regular', gender: 'Female', startDate: 'Jan 5, 2026', endDate: 'Jun 30, 2026', capacity: 25, seatsUsed: 18, registrationOpen: true, whatsappLink: 'https://chat.whatsapp.com/spoken-eng-1' },
]

/* ----------------------------------------------------------
   DASHBOARD SUMMARY
   ---------------------------------------------------------- */

export const dashboardStats = {
  totalStudents: students.length,
  enrolledStudents: students.filter((s) => s.status === 'enrolled' || s.status === 'approved').length,
  totalCourses: [...new Set(students.map((s) => s.course))].length,
  totalCities: Object.keys(citiesByCountry.Pakistan ? citiesByCountry : {}).length || citiesByCountry.Pakistan.length,
  totalCampuses: Object.keys(coursesByCampus).length,
  totalTrainers: trainers.length,
  activeSlots: slots.length,
  slotsRegistrationOpen: slots.filter((s) => s.registrationOpen).length,
}

export const studentsPerCampus = Object.keys(coursesByCampus).map((campus) => ({
  name: campus.replace('Saylani TITAN ', '').replace('SMIT ', ''),
  count: students.filter((s) => s.campus === campus).length,
}))

export const studentsPerCourse = [...new Set(students.map((s) => s.course))].map((course) => ({
  name: course,
  count: students.filter((s) => s.course === course).length,
}))

/* ----------------------------------------------------------
   TRAINER ATTENDANCE REQUESTS (corrections)
   ---------------------------------------------------------- */

export const trainerAttendanceRequests = [
  { id: 'REQ001', trainer: 'Sammar Abbas', date: 'Jun 14, 2026', reason: 'Forgot to check out, left at 6:05 PM not recorded.', status: 'Pending' },
  { id: 'REQ002', trainer: 'Hamza Siddiqui', date: 'Jun 10, 2026', reason: 'Scanner was offline, attended in person.', status: 'Pending' },
  { id: 'REQ003', trainer: 'Ayesha Memon', date: 'Jun 3, 2026', reason: 'Wrong check-in time recorded due to slow scan.', status: 'Approved' },
]

/* ----------------------------------------------------------
   ATTENDANCE HELPERS (students)
   ---------------------------------------------------------- */

export function findStudentByRoll(roll) {
  return students.find((s) => s.roll === roll || s.roll.includes(roll))
}

export function formatToday() {
  return formatDate(new Date())
}

export function getStudentAttendanceCalendar(student, year, monthIndex) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const result = {}
  let present = 0, leave = 0, absent = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, monthIndex, d).getDay()
    if (![1, 3, 5].includes(dow)) continue // classes only on Mon/Wed/Fri
    const v = seededValue(student.index ? student.index * 23 + d : d * 7, 10)
    let status = 'Present'
    if (v === 9) status = 'Absent'
    else if (v === 8) status = 'Leave'
    result[d] = status
    if (status === 'Present') present++
    else if (status === 'Leave') leave++
    else absent++
  }
  const total = present + leave + absent
  const percent = total === 0 ? 0 : Math.round((present / total) * 100)
  return { days: result, present, leave, absent, total, percent }
}
