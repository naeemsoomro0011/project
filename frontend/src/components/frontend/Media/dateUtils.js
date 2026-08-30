// Shared date helpers - used by both Student and Teacher data files
// so that every date shown in the app is a real, correctly computed date
// rather than a hand-typed (and possibly wrong) string.

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function formatDate(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

export function formatDateWithDay(date) {
  return `${DAY_NAMES[date.getDay()]}, ${formatDate(date)}`
}

export function dayName(date) {
  return DAY_NAMES[date.getDay()]
}

// Formats a raw "HH:MM" (24h) time string - as stored for assignment/quiz
// due times - into a clean, unambiguous "5:00 PM" style string. Returns
// an empty string when no time was set, so callers can render nothing.
export function formatTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return ''
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export function monthName(monthIndex) {
  return MONTH_NAMES[monthIndex]
}

// Returns every date in `year`/`monthIndex` (0-based) that falls on one of
// the given weekdays (0=Sun..6=Sat). Used to build correct Mon/Wed/Fri or
// Sat/Sun class schedules for any month.
export function getWeekdayDatesInMonth(year, monthIndex, weekdays) {
  const dates = []
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d)
    if (weekdays.includes(date.getDay())) {
      dates.push(date)
    }
  }
  return dates
}

// Evenly spreads `count` dates between a start and end date (inclusive),
// used for the Progress module "completed on" dates.
export function spreadDates(startStr, endStr, count) {
  const start = new Date(startStr)
  const end = new Date(endStr)
  const totalMs = end.getTime() - start.getTime()
  const result = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1)
    const d = new Date(start.getTime() + totalMs * t)
    result.push(formatDate(d))
  }
  return result
}

// List of the last N months (inclusive of given end year/month), oldest
// to newest by default - used for Payment / Attendance month pickers.
export function getMonthRange(startYear, startMonth, endYear, endMonth) {
  const months = []
  let y = startYear
  let m = startMonth
  while (y < endYear || (y === endYear && m <= endMonth)) {
    months.push({ year: y, month: m, label: `${monthName(m)} ${y}` })
    m++
    if (m > 11) {
      m = 0
      y++
    }
  }
  return months
}

// Returns 7 Date objects (Sun..Sat) for the week containing today's
// real date - used for the Dashboard's weekly class-schedule strip.
export function getCurrentWeekDates() {
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  const week = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    week.push(d)
  }
  return week
}
