import { Routes, Route, Navigate } from 'react-router-dom'
import TeacherShell from './TeacherShell.jsx'
import TeacherDashboard from '../Pages/TeacherDashboard.jsx'
import CourseDetail from '../Pages/CourseDetail.jsx'
import Calendar from '../Pages/Calendar.jsx'
import TeacherAttendance from '../Pages/TeacherAttendance.jsx'
import TeacherProfile from '../Pages/TeacherProfile.jsx'

// Everything the Teacher needs lives inside this one folder.
function TeacherPortal() {
  return (
    <Routes>
      <Route element={<TeacherShell />}>
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="course/:courseId" element={<CourseDetail />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="profile" element={<TeacherProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/teacher/dashboard" replace />} />
    </Routes>
  )
}

export default TeacherPortal
