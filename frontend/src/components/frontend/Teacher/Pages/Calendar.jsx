import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import TeacherTopbar from '../Layout/TeacherTopbar.jsx'
import { monthName } from '../../Media/dateUtils.js'
import { api } from '../../../../api/client.js'

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const colorThemes = ['blue', 'green', 'red', 'silver']

function buildGrid(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function Calendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [monthIndex, setMonthIndex] = useState(today.getMonth())
  const [slots, setSlots] = useState([])

  useEffect(() => {
    api.get('/dashboard/teacher').then((res) => setSlots(res.slots)).catch(() => {})
  }, [])

  const cells = buildGrid(year, monthIndex)

  // Every day-of-month in this month that matches one of the teacher's
  // scheduled class days gets an event chip per slot scheduled that day.
  const events = {}
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, monthIndex, d).getDay()
    slots.forEach((s, idx) => {
      if (s.scheduleDays.includes(dow)) {
        if (!events[d]) events[d] = []
        events[d].push({ title: `${s.course?.name} (${s.batchLabel})`, colorTheme: colorThemes[idx % colorThemes.length] })
      }
    })
  }

  const goPrev = () => {
    if (monthIndex === 0) { setMonthIndex(11); setYear(year - 1) } else setMonthIndex(monthIndex - 1)
  }
  const goNext = () => {
    if (monthIndex === 11) { setMonthIndex(0); setYear(year + 1) } else setMonthIndex(monthIndex + 1)
  }

  const isToday = (day) => day === today.getDate() && monthIndex === today.getMonth() && year === today.getFullYear()

  return (
    <div className="teacher-page">
      <TeacherTopbar breadcrumb={['Home', 'Calendar']} />

      <div className="calendar-box">
        <div className="calendar-header-row">
          <button type="button" className="calendar-nav-btn" onClick={goPrev}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <h3 className="calendar-month-label">{monthName(monthIndex)} {year}</h3>
          <button type="button" className="calendar-nav-btn" onClick={goNext}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>

        <div className="calendar-weekday-row">
          {weekdayLabels.map((w) => (
            <span key={w} className="calendar-weekday-label">{w}</span>
          ))}
        </div>

        <div className="calendar-grid">
          {cells.map((day, idx) => (
            <div key={idx} className={`calendar-cell ${day === null ? 'calendar-cell-empty' : ''} ${day && isToday(day) ? 'calendar-cell-today' : ''}`}>
              {day && (
                <>
                  <span className="calendar-cell-day">{day}</span>
                  <div className="calendar-cell-events">
                    {(events[day] || []).slice(0, 3).map((e, i) => (
                      <span key={i} className={`calendar-event-chip calendar-event-chip-${e.colorTheme}`}>
                        {e.title}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Calendar
