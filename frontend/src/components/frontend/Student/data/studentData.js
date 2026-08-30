import { getWeekdayDatesInMonth, spreadDates, formatDate, dayName, getMonthRange } from '../../Media/dateUtils.js'

export const studentInfo = {
  name: 'Muhammad Naeem',
  rollNo: '477692',
  batch: '1',
  campus: 'Saylani Titan Sukkur',
  city: 'Sukkur',
  course: 'Modern Web Application Development',
  email: 'muhammadnaeemsoomro123@gmail.com',
  phone: '03159833357',
  gender: 'Male',
  dob: 'Not provided',
  cnic: 'Not provided',
  qualification: 'Not provided',
  address: 'Not provided',
  photo: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300&h=300&fit=crop&crop=faces',
}

/* ----------------------------------------------------------
   PROGRESS — 4 modules, topic-level detail with real dates
   ---------------------------------------------------------- */

const webDesignTopics = [
  'HTML Text', 'HTML Image', 'HTML Table', 'HTML Form', 'HTML Audio/Video Tags',
  'HTML Links', 'Grid System', 'Font Awesome', 'Bootstrap', 'CSS3',
  'CSS Variables', 'GitHub', 'Flexbox', 'CSS Box Model', 'CSS Positioning',
  'Responsive Design', 'Google Fonts', 'CSS Animations', 'SCSS Basics', 'Favicon & Meta Tags',
]

const frontEndTopics = [
  'JS Introduction', 'JS Chapter 1-10', 'JS Chapter 11-20', 'JS Quiz-1',
  'JS Chapter 21-30', 'JS Chapter 31-40', 'JS Quiz-2', 'JS Chapter 41-50',
  'JS Chapter 51-60', 'JS Quiz-3', 'var vs let vs const', 'Loops', 'Arrays',
  'Objects', 'Template Literals', 'Parameters vs Arguments', 'Functions', 'Scope',
  'Hoisting', 'Closures', 'DOM Selection', 'DOM Manipulation', 'Event Listeners',
  'Event Bubbling', 'JSON', 'Fetch API', 'Promises', 'Async/Await',
  'ES6 Modules', 'Spread & Rest Operator', 'Destructuring',
]

const modernFrontEndTopics = [
  'ReactJS Introduction & How to Create React Project', 'Components, Props and JSX',
  'State, Events and Forms', 'React in Depth and Behind the Scenes (Composition, Re-useability)',
  'Custom Hooks, Ref, useReducer', 'State Management - Context API', 'React Router',
  'Lifting State Up', 'Performance Optimization (memo, useMemo, useCallback)',
  'Error Boundaries', 'Class Components Basics', 'Lifecycle Methods',
  'React + Bootstrap Integration', 'Deploying a React App',
]

const backEndTopics = [
  'Mongo DB', 'Node Js', 'Express Js', 'Security and Authentication', 'CI/CD',
  'Node Production and Cloud Deployment', 'Multer - Media Uploading', 'PostgreSQL',
  'Payment Integration', 'REST API Design', 'Middleware', 'JWT Authentication',
  'Error Handling in Express', 'File Uploads', 'Environment Variables', 'Testing APIs with Postman',
]

function buildModule({ title, topics, completedCount, dateStart, dateEnd, completedIndexes }) {
  const dates = spreadDates(dateStart, dateEnd, completedCount)
  let dateCursor = 0
  const detailedTopics = topics.map((name, idx) => {
    const isComplete = completedIndexes ? completedIndexes.includes(idx) : idx < completedCount
    const date = isComplete ? dates[dateCursor++] : null
    return { name, completed: isComplete, date }
  })
  const percent = Math.round((completedCount / topics.length) * 10000) / 100
  return {
    title,
    totalTopics: topics.length,
    completedTopics: completedCount,
    percent,
    topics: detailedTopics,
  }
}

export const progressModules = [
  buildModule({
    title: 'Web Designing Module',
    topics: webDesignTopics,
    completedCount: 20,
    dateStart: '2025-10-17',
    dateEnd: '2025-11-23',
  }),
  buildModule({
    title: 'Front-End Development',
    topics: frontEndTopics,
    completedCount: 31,
    dateStart: '2025-11-25',
    dateEnd: '2026-03-13',
  }),
  buildModule({
    title: 'Modern Front-End Development',
    topics: modernFrontEndTopics,
    completedCount: 13,
    dateStart: '2026-03-20',
    dateEnd: '2026-05-26',
    completedIndexes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  }),
  buildModule({
    title: 'Back-End Development',
    topics: backEndTopics,
    completedCount: 1,
    dateStart: '2026-06-15',
    dateEnd: '2026-06-15',
    completedIndexes: [0],
  }),
]

export const totalTopicsOverall = progressModules.reduce((sum, m) => sum + m.totalTopics, 0)
export const totalCompletedOverall = progressModules.reduce((sum, m) => sum + m.completedTopics, 0)
export const totalNotCompletedOverall = totalTopicsOverall - totalCompletedOverall

/* ----------------------------------------------------------
   ATTENDANCE — Oct 2025 through June 2026, classes on Mon/Wed/Fri
   ---------------------------------------------------------- */

export const attendanceMonths = getMonthRange(2025, 9, 2026, 5) // Oct 2025 .. Jun 2026

function statusForIndex(globalIndex) {
  if (globalIndex % 11 === 10) return 'Absent'
  if (globalIndex % 7 === 6) return 'Leave'
  return 'Present'
}

let runningIndex = 0
export const attendanceByMonth = {}
attendanceMonths.forEach(({ year, month, label }) => {
  const dates = getWeekdayDatesInMonth(year, month, [1, 3, 5])
  const records = dates.map((date, idxInMonth) => {
    const status = statusForIndex(runningIndex)
    runningIndex++
    return {
      classLabel: `Class ${idxInMonth + 1}`,
      date: `${dayName(date)}, ${formatDate(date)}`,
      status,
    }
  })
  attendanceByMonth[label] = records
})

function summarize(records) {
  const total = records.length
  const present = records.filter((r) => r.status === 'Present').length
  const leave = records.filter((r) => r.status === 'Leave').length
  const absent = records.filter((r) => r.status === 'Absent').length
  return { total, present, leave, absent }
}

export const attendanceOverall = (() => {
  let total = 0, present = 0, leave = 0, absent = 0
  Object.values(attendanceByMonth).forEach((records) => {
    const s = summarize(records)
    total += s.total
    present += s.present
    leave += s.leave
    absent += s.absent
  })
  const percent = total === 0 ? 0 : Math.round((present / total) * 100)
  return { total, present, leave, absent, percent }
})()

/* ----------------------------------------------------------
   ASSIGNMENTS — 16 total, 14 approved, 1 not approved, 1 not submitted
   ---------------------------------------------------------- */

const assignmentNames = [
  'Gallery API Test', 'React Routing Test', 'JS DOM Manipulation', 'If-Else Conditional Test',
  'CSS Grid Test', 'Animation & Transition Test', 'Flexbox Layout Test', 'Bootstrap Components Test',
  'Array Methods Quiz', 'Object Oriented JS Test', 'Form Validation Test', 'API Fetch Test',
  'Local Storage Test', 'React Hooks Test', 'State Management Test', 'Final Project Submission',
]

const placeholderSubmissionImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'%3E%3Crect width='400' height='260' fill='%23E8EAED'/%3E%3Ccircle cx='130' cy='85' r='26' fill='%23C9A227'/%3E%3Cpath d='M30 215 L150 110 L215 165 L285 95 L370 215 Z' fill='%231B2A4D' opacity='0.55'/%3E%3C/svg%3E"

const assignmentDueDates = spreadDates('2025-12-01', '2026-06-10', assignmentNames.length)

export const assignments = assignmentNames.map((name, idx) => {
  let status = 'Approved'
  if (idx === 14) status = 'Not Approved'
  if (idx === 15) status = 'Not Submitted'

  return {
    id: `A${String(idx + 1).padStart(2, '0')}`,
    name,
    course: 'Modern Web Application Development',
    dueDate: assignmentDueDates[idx],
    status,
    submittedOn: status !== 'Not Submitted' ? assignmentDueDates[idx] : null,
    submissionLink: status !== 'Not Submitted' ? `https://github.com/m-naeem/${name.toLowerCase().replace(/\s+/g, '-')}` : null,
    submissionNotes: status !== 'Not Submitted'
      ? 'Completed all the required functionality and tested it on Chrome and Firefox before submitting.'
      : null,
    submissionImage: status !== 'Not Submitted' ? placeholderSubmissionImage : null,
    description: `Build and submit the "${name}" task following the requirements discussed in class, including clean code structure and comments.`,
  }
})

export const assignmentSummary = {
  total: assignments.length,
  submitted: assignments.filter((a) => a.status !== 'Not Submitted').length,
  approved: assignments.filter((a) => a.status === 'Approved').length,
  notApproved: assignments.filter((a) => a.status === 'Not Approved').length,
}

/* ----------------------------------------------------------
   QUIZZES
   ---------------------------------------------------------- */

export const quizzes = [
  {
    id: 'Q1',
    title: 'JavaScript (Quiz-1)',
    module: 'Modern Front-End Development',
    questions: 40,
    attempts: '1/3',
    score: '34/40',
    percentage: 85,
    date: 'Mar 9, 2026',
  },
  {
    id: 'Q2',
    title: 'JavaScript (Quiz-2)',
    module: 'Modern Front-End Development',
    questions: 35,
    attempts: '2/3',
    score: '20/35',
    percentage: 57.14,
    date: 'Apr 6, 2026',
  },
  {
    id: 'Q3',
    title: 'JavaScript (Quiz-3)',
    module: 'Modern Front-End Development',
    questions: 30,
    attempts: '1/3',
    score: '24/30',
    percentage: 80,
    date: 'May 4, 2026',
  },
].map((q) => ({ ...q, statusLabel: q.percentage >= 70 ? 'Passed' : 'Failed' }))

/* ----------------------------------------------------------
   PAYMENTS — Oct 2025 through June 2026
   ---------------------------------------------------------- */

export const payments = [...attendanceMonths].reverse().map(({ year, month, label }) => {
  const monthNum = String(month + 1).padStart(2, '0')
  return {
    month: label,
    amount: 'Rs: 1000/-',
    type: 'Monthly',
    dueDate: `08-${label.split(' ')[0]}-${year}`,
    voucherId: `2026${monthNum}477692`,
    status: 'Paid',
  }
})

/* ----------------------------------------------------------
   CLASS SCHEDULE (Mon / Wed / Fri, 2:00 PM - 4:00 PM)
   ---------------------------------------------------------- */

export const classSchedule = [
  { day: 'Mon', time: '02:00 PM - 04:00 PM' },
  { day: 'Wed', time: '02:00 PM - 04:00 PM' },
  { day: 'Fri', time: '02:00 PM - 04:00 PM' },
]
