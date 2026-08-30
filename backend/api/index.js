// Vercel serverless entry point.
//
// Why this file exists instead of using ../server.js directly:
// Vercel's Node.js runtime needs a module that EXPORTS a request handler
// (an Express app works fine). ../server.js instead calls `app.listen(...)`
// and process.exit(1) on DB errors, which is the correct shape for a normal
// "always-on" server (npm run dev / npm start locally) but not for a
// serverless function. To avoid changing server.js (and risk breaking your
// local dev setup or anything else), this file independently builds the
// exact same Express app - same middleware, same routes, same order - and
// exports it. Nothing about your existing routes/controllers/models changes.
//
// DB connections are cached across warm invocations so we don't reconnect
// (and reseed) on every single request.

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import connectDB from '../config/db.js'
import { seedInitialData } from '../seed.js'
import { notFound, errorHandler } from '../middleware/errorHandler.js'

import authRoutes from '../routes/authRoutes.js'
import campusRoutes from '../routes/campusRoutes.js'
import courseRoutes from '../routes/courseRoutes.js'
import subAdminRoutes from '../routes/subAdminRoutes.js'
import superAdminRoutes from '../routes/superAdminRoutes.js'
import teacherRoutes from '../routes/teacherRoutes.js'
import studentRoutes from '../routes/studentRoutes.js'
import slotRoutes from '../routes/slotRoutes.js'
import attendanceRoutes from '../routes/attendanceRoutes.js'
import teacherAttendanceRoutes from '../routes/teacherAttendanceRoutes.js'
import assignmentRoutes from '../routes/assignmentRoutes.js'
import quizRoutes from '../routes/quizRoutes.js'
import feedbackRoutes from '../routes/feedbackRoutes.js'
import voucherRoutes from '../routes/voucherRoutes.js'
import uploadRoutes from '../routes/uploadRoutes.js'
import pdfRoutes from '../routes/pdfRoutes.js'
import exportRoutes from '../routes/exportRoutes.js'
import dashboardRoutes from '../routes/dashboardRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// New image uploads go straight to Cloudinary now (see upload.js /
// uploadController.js), so they no longer depend on local disk. This
// static route is kept only so any photo saved before that change (an
// old-style '/uploads/xyz.jpg' URL already sitting in the database) still
// resolves the same way it always did in a normal server environment.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// Lazily connect to MongoDB once per warm function instance instead of on
// every request (serverless best practice - avoids exhausting Atlas
// connections and avoids reseeding on every invocation).
let dbReady = null
app.use((req, res, next) => {
  if (!dbReady) {
    dbReady = connectDB()
      .then(() => seedInitialData())
      .catch((err) => {
        // Let the NEXT request try again instead of staying broken forever
        // for the lifetime of this warm function instance.
        dbReady = null
        throw err
      })
  }
  dbReady.then(() => next()).catch(next)
})

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

export default app
