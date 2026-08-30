import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import connectDB from './config/db.js'
import { seedInitialData } from './seed.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

import authRoutes from './routes/authRoutes.js'
import campusRoutes from './routes/campusRoutes.js'
import courseRoutes from './routes/courseRoutes.js'
import subAdminRoutes from './routes/subAdminRoutes.js'
import superAdminRoutes from './routes/superAdminRoutes.js'
import teacherRoutes from './routes/teacherRoutes.js'
import studentRoutes from './routes/studentRoutes.js'
import slotRoutes from './routes/slotRoutes.js'
import attendanceRoutes from './routes/attendanceRoutes.js'
import teacherAttendanceRoutes from './routes/teacherAttendanceRoutes.js'
import assignmentRoutes from './routes/assignmentRoutes.js'
import quizRoutes from './routes/quizRoutes.js'
import feedbackRoutes from './routes/feedbackRoutes.js'
import voucherRoutes from './routes/voucherRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import pdfRoutes from './routes/pdfRoutes.js'
import exportRoutes from './routes/exportRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

app.use('/api/auth', authRoutes)
app.use('/api/campuses', campusRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/subadmins', subAdminRoutes)
app.use('/api/superadmin', superAdminRoutes)
app.use('/api/teachers', teacherRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/slots', slotRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/teacher-attendance', teacherAttendanceRoutes)
app.use('/api/assignments', assignmentRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/vouchers', voucherRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/pdf', pdfRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

async function start() {
  await connectDB()
  await seedInitialData()
  app.listen(PORT, () => {
    console.log(`\n🚀 Titan Portal API running on http://localhost:${PORT}`)
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`)
  })
}

start().catch((err) => {
  console.error('[Server] Failed to start:', err.message)
  process.exit(1)
})
