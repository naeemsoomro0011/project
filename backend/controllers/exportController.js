import ExcelJS from 'exceljs'
import Student from '../models/Student.js'
import Attendance from '../models/Attendance.js'
import QuizAttempt from '../models/QuizAttempt.js'
import Quiz from '../models/Quiz.js'
import { asyncHandler } from '../middleware/errorHandler.js'

export const exportStudentsExcel = asyncHandler(async (req, res) => {
  const { course } = req.query
  // Honour the same campus scope the page was showing when Export was
  // clicked: Sub Admin is always locked to their own campus, Super Admin
  // gets whatever ?campus= was selected (or every campus if "All Campuses"
  // was selected, i.e. no ?campus= at all) - same rule as studentsListPdf.
  const filter = {}
  if (req.role === 'subadmin') {
    filter.campus = req.user.campus
  } else if (req.query.campus) {
    filter.campus = req.query.campus
  }
  if (course && course !== 'all') filter.course = course

  const students = await Student.find(filter).populate('course', 'name').populate({ path: 'slot', select: 'batchLabel scheduleDays' })

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Students')

  sheet.columns = [
    { header: 'Name', key: 'name', width: 24 },
    { header: 'Father Name', key: 'fatherName', width: 24 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Phone Number', key: 'phone', width: 16 },
    { header: 'Roll Number', key: 'roll', width: 14 },
    { header: 'Course', key: 'course', width: 24 },
    { header: 'Batch', key: 'batch', width: 12 },
    { header: 'Attendance %', key: 'attendancePct', width: 14 },
    { header: 'Quiz %', key: 'quizPct', width: 12 },
    { header: 'Payment Status', key: 'paymentStatus', width: 16 },
  ]
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

  for (const student of students) {
    const scheduleDays = student.slot?.scheduleDays || []
    const records = await Attendance.find({ student: student._id })
    const present = records.filter((r) => r.status === 'Present').length

    // Approximate total scheduled classes since registration (same logic
    // used on the dashboards) for a quick attendance % in the export.
    let totalClasses = 0
    if (scheduleDays.length) {
      const cursor = new Date(student.registrationDate)
      cursor.setHours(0, 0, 0, 0)
      const end = new Date()
      end.setHours(0, 0, 0, 0)
      while (cursor <= end) {
        if (scheduleDays.includes(cursor.getDay())) totalClasses++
        cursor.setDate(cursor.getDate() + 1)
      }
    }
    const attendancePct = totalClasses ? Math.round((present / totalClasses) * 1000) / 10 : 0

    const quizzes = await Quiz.find({ slot: student.slot, isDeleted: false }).select('_id')
    const attempts = await QuizAttempt.find({ student: student._id, quiz: { $in: quizzes.map((q) => q._id) }, submittedAt: { $ne: null } })
    const avgQuizPct = attempts.length ? Math.round((attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) * 10) / 10 : 0

    sheet.addRow({
      name: student.name,
      fatherName: student.fatherName,
      email: student.email,
      phone: student.phone,
      roll: student.roll,
      course: student.course?.name || '-',
      batch: student.slot?.batchLabel || '-',
      attendancePct,
      quizPct: avgQuizPct,
      paymentStatus: student.paymentStatus,
    })
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename="students-export.xlsx"')
  await workbook.xlsx.write(res)
  res.end()
})
