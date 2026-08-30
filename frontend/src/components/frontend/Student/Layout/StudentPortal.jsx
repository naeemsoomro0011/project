import { Routes, Route, Navigate } from 'react-router-dom'
import CourseLanding from '../Pages/CourseLanding.jsx'
import StudentShell from './StudentShell.jsx'
import Dashboard from '../Pages/Dashboard.jsx'
import AttendanceDetail from '../Pages/AttendanceDetail.jsx'
import Assignments from '../Pages/Assignments.jsx'
import Progress from '../Pages/Progress.jsx'
import Payment from '../Pages/Payment.jsx'
import Quiz from '../Pages/Quiz.jsx'
import Profile from '../Pages/Profile.jsx'

// Everything the Student needs lives inside this one folder.
// Flow: login -> /student/landing (course card) -> View Detail -> /student/dashboard (sidebar shell)
function StudentPortal() {
  return (
    <Routes>
      <Route path="landing" element={<CourseLanding />} />

      <Route element={<StudentShell />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="progress" element={<Progress />} />
        <Route path="attendance" element={<AttendanceDetail />} />
        <Route path="payment" element={<Payment />} />
        <Route path="assignment" element={<Assignments />} />
        <Route path="quiz" element={<Quiz />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/student/landing" replace />} />
    </Routes>
  )
}

export default StudentPortal
