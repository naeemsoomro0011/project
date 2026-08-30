import { getWeekdayDatesInMonth, formatDate, getMonthRange, spreadDates } from '../../Media/dateUtils.js'

export const teacherInfo = {
  name: 'Sir Yasir Ali (SUK)',
  displayTitle: 'Sir Yasir Ali (SUK) - Trainer',
  campus: 'Sukkur Campus',
  email: 'yasiralilashari123@gmail.com',
  phone: '03195622019',
  employeeId: '84217',
  hourlyRate: '2500/hour',
  bio: '',
  socialLinks: [],
  photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces',
}

/* ----------------------------------------------------------
   COURSES (4 batches, students add up to 102)
   ---------------------------------------------------------- */

export const courses = [
  {
    id: 'lg-batch1',
    title: 'Little Geniuses: Coding, Design & Fun Lab',
    batchLabel: 'Batch-1',
    lab: 'Male',
    campus: 'SMIT Ghotki Campus (Ghotki)',
    colorTheme: 'green',
    schedule: 'Sat 04:00 PM - 06:00 PM | Sun 04:00 PM - 06:00 PM',
    scheduleDays: [6, 0],
    startDate: 'Sep 1, 2025',
    studentsCount: 27,
    progressPercent: 88,
  },
  {
    id: 'lg-batch2',
    title: 'Little Geniuses: Coding, Design & Fun Lab',
    batchLabel: 'Batch-2',
    lab: 'Female',
    campus: 'SMIT Ghotki Campus (Ghotki)',
    colorTheme: 'blue',
    schedule: 'Sat 02:00 PM - 04:00 PM | Sun 02:00 PM - 04:00 PM',
    scheduleDays: [6, 0],
    startDate: 'Sep 1, 2025',
    studentsCount: 25,
    progressPercent: 82,
  },
  {
    id: 'wma-batch1',
    title: 'Modern Web Application Development',
    batchLabel: 'Batch-1',
    lab: 'Male',
    campus: 'SMIT Sukkur Campus (Sukkur)',
    colorTheme: 'red',
    schedule: 'Mon 04:00 PM - 06:00 PM | Wed 04:00 PM - 06:00 PM | Fri 04:00 PM - 06:00 PM',
    scheduleDays: [1, 3, 5],
    startDate: 'Oct 1, 2025',
    studentsCount: 20,
    progressPercent: 65,
  },
  {
    id: 'wma-batch2',
    title: 'Modern Web Application Development',
    batchLabel: 'Batch-2',
    lab: 'Male',
    campus: 'SMIT Sukkur Campus (Sukkur)',
    colorTheme: 'silver',
    schedule: 'Mon 02:00 PM - 04:00 PM | Wed 02:00 PM - 04:00 PM | Fri 02:00 PM - 04:00 PM',
    scheduleDays: [1, 3, 5],
    startDate: 'Oct 17, 2025',
    studentsCount: 30,
    progressPercent: 70,
  },
]

export const totalStudents = courses.reduce((sum, c) => sum + c.studentsCount, 0)

/* ----------------------------------------------------------
   STUDENTS per course (deterministic, looks individual)
   ---------------------------------------------------------- */

const maleFirstNames = [
  'Farhan', 'Naeem', 'Sodhal', 'Yaseen', 'Talha', 'Mohsin', 'Faisal', 'Ahmed',
  'Bilal', 'Hassan', 'Usman', 'Zain', 'Hamza', 'Ali', 'Faizan', 'Danish',
  'Saad', 'Junaid', 'Asad', 'Waqas', 'Shahzaib', 'Imran', 'Bilawal', 'Arsalan',
  'Owais', 'Sajjad', 'Kamran', 'Adeel', 'Rizwan', 'Sufyan',
]

const femaleFirstNames = [
  'Farwa', 'Aliya', 'Nadia', 'Fiza', 'Mirha', 'Ayesha', 'Sana', 'Mariam',
  'Hira', 'Komal', 'Rabia', 'Anum', 'Mehak', 'Noor', 'Laiba', 'Sara',
  'Iqra', 'Aiman', 'Zoya', 'Areeba', 'Mehwish', 'Sidra', 'Kinza', 'Amna',
  'Hafsa', 'Sumbal', 'Tania', 'Rida', 'Eshal', 'Nimra',
]

const lastNames = [
  'Khan', 'Mahar', 'Khaskeli', 'Pirzada', 'Channa', 'Shah', 'Khokhar', 'Memon',
  'Soomro', 'Shaikh', 'Lashari', 'Bhutto', 'Qureshi', 'Siddiqui', 'Baloch', 'Rajput',
  'Bhayo', 'Jatoi', 'Chandio', 'Magsi', 'Khoso', 'Buriro', 'Junejo', 'Talpur',
  'Abbasi', 'Lakho', 'Sahito', 'Detho', 'Mallah', 'Wassan',
]

function courseSeedOffset(courseId) {
  let sum = 0
  for (let i = 0; i < courseId.length; i++) sum += courseId.charCodeAt(i) * (i + 1)
  return sum
}

function seededValue(seed, mod) {
  const x = Math.sin(seed * 999) * 10000
  return Math.floor((x - Math.floor(x)) * mod)
}

export function getStudentsForCourse(course) {
  const isFemale = course.lab.toLowerCase() === 'female'
  const firstPool = isFemale ? femaleFirstNames : maleFirstNames
  const offset = courseSeedOffset(course.id)
  const students = []
  for (let i = 0; i < course.studentsCount; i++) {
    const seed = course.id.length + i * 7
    const first = firstPool[(i + offset) % firstPool.length]
    const last = lastNames[(i + offset + 11) % lastNames.length]
    const roll = `${100000 + seededValue(seed + 1, 899999)}`
    students.push({
      id: `${course.id}-S${i + 1}`,
      index: i,
      name: `${first} ${last}`,
      roll,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@students.titan.edu.pk`,
      status: 'Enrolled',
      photo: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
      attendancePercent: 65 + seededValue(seed + 2, 34),
    })
  }
  return students
}

/* ----------------------------------------------------------
   ASSIGNMENTS & QUIZZES per course (shared definitions,
   per-student status/score derived deterministically)
   ---------------------------------------------------------- */

export function getAssignmentsForCourse(course) {
  const base = [
    'Portfolio Page Layout', 'Form Validation Task', 'API Integration Test',
    'Responsive Navbar Task', 'Final Mini Project',
  ]
  const dates = spreadDates('2025-12-01', '2026-06-01', base.length)
  return base.map((name, idx) => ({
    id: `${course.id}-A${idx + 1}`,
    name,
    type: 'No Types',
    dueDate: dates[idx],
  }))
}

export function studentAssignmentStatus(studentIndex, assignmentIndex) {
  const v = seededValue(studentIndex * 13 + assignmentIndex * 31, 10)
  if (v < 7) return 'Approved'
  if (v < 9) return 'Not Approved'
  return 'Not Submitted'
}

export function getQuizzesForCourse(course) {
  const base = ['HTML & CSS Basics', 'JavaScript Fundamentals', 'Final Concepts Quiz']
  const dates = spreadDates('2026-01-10', '2026-05-20', base.length)
  return base.map((name, idx) => ({
    id: `${course.id}-Q${idx + 1}`,
    name,
    questions: 30 + idx * 5,
    dueDate: dates[idx],
    status: 'Active',
  }))
}

export function studentQuizResult(studentIndex, quiz) {
  const v = seededValue(studentIndex * 17 + quiz.questions, 100)
  const score = Math.round((quiz.questions * (40 + v % 60)) / 100)
  const percentage = Math.round((score / quiz.questions) * 100)
  const attempts = `${1 + (v % 3)}/3`
  const submittedDate = quiz.dueDate
  return {
    score: `${score}/${quiz.questions}`,
    percentage,
    statusLabel: percentage >= 70 ? 'Pass' : 'Fail',
    attempts,
    date: `${submittedDate}, 0${1 + (v % 8)}:1${v % 6}0 PM`,
  }
}

/* ----------------------------------------------------------
   STUDENT ATTENDANCE (for the Course Detail > Attendance tab)
   ---------------------------------------------------------- */

export function getCourseAttendanceForDate(students, dayOfMonth) {
  return students.map((s) => {
    const v = seededValue(s.index * 19 + dayOfMonth, 10)
    let status = 'Present'
    if (v === 9) status = 'Absent'
    else if (v === 8) status = 'Leave'
    return { ...s, status }
  })
}

/* ----------------------------------------------------------
   TEACHER'S OWN ATTENDANCE / SCHEDULE
   ---------------------------------------------------------- */

export const teacherScheduleDays = [0, 1, 3, 5, 6] // Sun, Mon, Wed, Fri, Sat

export const teacherAttendanceMonths = getMonthRange(2025, 9, 2026, 5)

/* ----------------------------------------------------------
   CALENDAR — events per day across Oct 2025 - June 2026
   ---------------------------------------------------------- */

export function getCalendarEventsForMonth(year, monthIndex) {
  const events = {}
  courses.forEach((course) => {
    const dates = getWeekdayDatesInMonth(year, monthIndex, course.scheduleDays)
    dates.forEach((date) => {
      const key = date.getDate()
      if (!events[key]) events[key] = []
      events[key].push({ courseId: course.id, title: course.title, colorTheme: course.colorTheme })
    })
  })
  return events
}

/* ----------------------------------------------------------
   COURSE PROGRESS (per-course module breakdown, mirrors the
   student-side structure so teachers see the same shape)
   ---------------------------------------------------------- */

export function getCourseProgressModules(course) {
  const moduleNames = ['Web Designing Module', 'Front-End Development', 'Modern Front-End Development', 'Back-End Development']
  const totals = [20, 31, 14, 16]
  return moduleNames.map((title, idx) => {
    const completed = Math.min(totals[idx], Math.round((course.progressPercent / 100) * totals[idx]))
    return {
      title,
      totalTopics: totals[idx],
      completedTopics: completed,
      percent: Math.round((completed / totals[idx]) * 10000) / 100,
    }
  })
}

export const otherTeachersForCompare = [
  { name: 'Sir Faizan (SUK) - TITAN', slot: 'SS 06pm-08pm', covered: 60, total: 81 },
  { name: 'Sir Sammar Abbas (SUK) - TITAN', slot: 'MWF 12pm-02pm', covered: 58, total: 81 },
]

export { formatDate }
