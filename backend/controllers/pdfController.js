import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import Student from '../models/Student.js'
import Teacher from '../models/Teacher.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '..', 'uploads')

// Local upload URLs look like http://host/uploads/filename.jpg - resolve
// them back to a filesystem path so pdfkit can embed the actual image.
// Kept only for backward compatibility with any photo saved before the
// switch to Cloudinary - new uploads are full https:// Cloudinary URLs,
// handled by fetchPhotoBuffer() below instead.
function localPathForUploadUrl(url) {
  if (!url) return null
  const idx = url.indexOf('/uploads/')
  if (idx === -1) return null
  const filename = url.slice(idx + '/uploads/'.length)
  const full = path.join(uploadsDir, filename)
  return fs.existsSync(full) ? full : null
}

// Returns something pdfkit's doc.image() can embed directly: a local file
// path for old-style /uploads/ URLs, or a Buffer fetched over https for
// Cloudinary (or any other remote) URL. Returns null if there's nothing to
// embed, so callers can fall back to the initials avatar.
async function fetchPhotoBuffer(url) {
  const localPath = localPathForUploadUrl(url)
  if (localPath) return localPath

  if (url && /^https?:\/\//i.test(url)) {
    try {
      const response = await fetch(url)
      if (!response.ok) return null
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch {
      return null
    }
  }

  return null
}

export const studentAuditPdf = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate('campus', 'name city').populate('course', 'name')
  if (!student) return res.status(404).json({ message: 'Student not found.' })
  if (req.role === 'subadmin' && String(student.campus._id) !== String(req.user.campus)) {
    return res.status(403).json({ message: 'This student belongs to a different campus.' })
  }

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${student.roll}-audit.pdf"`)

  const doc = new PDFDocument({ margin: 50 })
  doc.pipe(res)

  doc.fontSize(20).fillColor('#111').text('TITAN Student Audit Report', { align: 'center' })
  doc.moveDown(1.5)

  const photoSource = await fetchPhotoBuffer(student.photo)
  if (photoSource) {
    try { doc.image(photoSource, doc.page.width - 150, 90, { width: 80, height: 80 }) } catch { /* ignore malformed image */ }
  }

  const row = (label, value) => {
    doc.fontSize(11).fillColor('#555').text(label, { continued: true })
    doc.fillColor('#111').text(`  ${value ?? '-'}`)
    doc.moveDown(0.4)
  }

  row('Name:', student.name)
  row('Email:', student.email)
  row('Father Name:', student.fatherName)
  row('CNIC:', student.cnic)
  row('Father CNIC:', student.fatherCnic)
  row('Education:', student.lastQualification)
  row('Course:', student.course?.name)
  row('Roll Number:', student.roll)
  row('Campus:', `${student.campus?.name} (${student.campus?.city})`)
  row('Date of Birth:', student.dob ? new Date(student.dob).toDateString() : '-')
  row('Gender:', student.gender)
  row('Status:', student.status)

  doc.moveDown(2)
  doc.fontSize(9).fillColor('#999').text(`Generated on ${new Date().toDateString()}`, { align: 'center' })

  doc.end()
})

// Full students list as a table PDF, honouring the same campus scope the
// page was showing when the button was clicked: Sub Admin is always locked
// to their own campus, Super Admin gets whatever ?campus= was selected (or
// every campus if "All Campuses" was selected, i.e. no ?campus= at all).
export const studentsListPdf = asyncHandler(async (req, res) => {
  const filter = {}
  if (req.role === 'subadmin') {
    filter.campus = req.user.campus
  } else if (req.query.campus) {
    filter.campus = req.query.campus
  }

  const students = await Student.find(filter)
    .populate('campus', 'name city')
    .populate('course', 'name')
    .sort({ roll: 1 })
    .lean()

  const scopeLabel = req.role === 'subadmin' || req.query.campus
    ? (students[0]?.campus?.name ? `${students[0].campus.name} Campus` : 'Selected Campus')
    : 'All Campuses'

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="students-list-${Date.now()}.pdf"`)

  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' })
  doc.pipe(res)

  doc.fontSize(18).fillColor('#111').text('TITAN Students List', { align: 'center' })
  doc.fontSize(10).fillColor('#666').text(`Scope: ${scopeLabel}  |  Generated on ${new Date().toDateString()}`, { align: 'center' })
  doc.moveDown(1)

  const cols = [
    { key: 'roll', label: 'Roll No', width: 70 },
    { key: 'name', label: 'Name', width: 140 },
    { key: 'cnic', label: 'CNIC', width: 110 },
    { key: 'course', label: 'Course', width: 130 },
    { key: 'campus', label: 'Campus', width: 130 },
    { key: 'status', label: 'Status', width: 80 },
    { key: 'paymentStatus', label: 'Payment', width: 90 },
  ]
  const tableLeft = doc.page.margins.left
  let y = doc.y

  const drawHeaderRow = () => {
    doc.fontSize(9).fillColor('#fff')
    doc.rect(tableLeft, y, cols.reduce((s, c) => s + c.width, 0), 20).fill('#1B2A4D')
    let x = tableLeft
    doc.fillColor('#fff')
    cols.forEach((c) => { doc.text(c.label, x + 4, y + 6, { width: c.width - 8 }); x += c.width })
    y += 20
  }

  drawHeaderRow()

  students.forEach((s, idx) => {
    if (y > doc.page.height - doc.page.margins.bottom - 30) {
      doc.addPage()
      y = doc.page.margins.top
      drawHeaderRow()
    }
    if (idx % 2 === 0) {
      doc.rect(tableLeft, y, cols.reduce((sum, c) => sum + c.width, 0), 18).fill('#f5f6fa')
    }
    let x = tableLeft
    doc.fontSize(8.5).fillColor('#1B2A4D')
    const values = {
      roll: s.roll,
      name: s.name,
      cnic: s.cnic,
      course: s.course?.name || '-',
      campus: s.campus?.name || '-',
      status: s.status,
      paymentStatus: s.paymentStatus,
    }
    cols.forEach((c) => { doc.text(String(values[c.key] ?? '-'), x + 4, y + 5, { width: c.width - 8 }); x += c.width })
    y += 18
  })

  if (students.length === 0) {
    doc.fontSize(10).fillColor('#888').text('No students found for this scope.', tableLeft, y + 10)
  }

  doc.end()
})

// Same initials fallback the frontend's <Avatar/> shows when there's no
// uploaded photo, so the ID card never renders an empty grey box.
function initialsFor(name) {
  if (!name) return '?'
  const cleaned = name.replace(/\([^)]*\)/g, '').trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const teacherIdCardPdf = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id).populate('campus', 'name city')
  if (!teacher) return res.status(404).json({ message: 'Trainer not found.' })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${teacher.employeeId}-id-card.pdf"`)

  const doc = new PDFDocument({ size: [340, 520], margin: 24 })
  doc.pipe(res)

  doc.rect(0, 0, 340, 120).fill('#0f172a')
  doc.fontSize(18).fillColor('#fff').text('TITAN', 24, 30)
  doc.fontSize(10).fillColor('#cbd5e1').text('Official Trainer ID Card', 24, 55)

  const photoSource = await fetchPhotoBuffer(teacher.photo)
  const photoY = 90
  let photoDrawn = false
  if (photoSource) {
    try {
      doc.roundedRect(120, photoY, 100, 100, 6).fill('#e2e8f0')
      doc.image(photoSource, 120, photoY, { width: 100, height: 100 })
      photoDrawn = true
    } catch { /* fall through to initials avatar below */ }
  }
  if (!photoDrawn) {
    doc.roundedRect(120, photoY, 100, 100, 6).fill('#1B2A4D')
    doc.fontSize(30).fillColor('#ffffff')
      .text(initialsFor(teacher.name), 120, photoY + 34, { width: 100, align: 'center' })
  }

  doc.fillColor('#0f172a').fontSize(16).text(teacher.name, 24, 210, { width: 292, align: 'center' })
  doc.fontSize(11).fillColor('#475569').text(teacher.designation || 'Trainer', { width: 292, align: 'center' })
  doc.moveDown(1)

  const row = (label, value) => {
    doc.fontSize(10).fillColor('#64748b').text(label, 40, doc.y, { continued: true })
    doc.fillColor('#0f172a').text(`  ${value ?? '-'}`)
    doc.moveDown(0.5)
  }

  doc.moveDown(1)
  row('Email:', teacher.email)
  row('Campus:', `${teacher.campus?.name} (${teacher.campus?.city})`)
  row('Employee ID:', teacher.employeeId)

  doc.moveDown(2)
  doc.fontSize(8).fillColor('#94a3b8').text('This card is property of TITAN. If found, please return to the nearest campus.', 24, 480, { width: 292, align: 'center' })

  doc.end()
})
