import { Routes, Route, Navigate } from 'react-router-dom'
import SubAdminShell from './SubAdminShell.jsx'
import Dashboard from '../Pages/Dashboard.jsx'
import Students from '../Pages/Students.jsx'
import StudentAdd from '../Pages/StudentAdd.jsx'
import StudentDetail from '../Pages/StudentDetail.jsx'
import AttendanceMark from '../Pages/AttendanceMark.jsx'
import AttendanceView from '../Pages/AttendanceView.jsx'
import AttendanceMulti from '../Pages/AttendanceMulti.jsx'
import Administration from '../Pages/Administration.jsx'
import Trainers from '../Pages/Trainers.jsx'
import TrainerAttendanceMark from '../Pages/TrainerAttendanceMark.jsx'
import TrainerAttendanceView from '../Pages/TrainerAttendanceView.jsx'
import TrainerAttendanceRequests from '../Pages/TrainerAttendanceRequests.jsx'
import Feedback from '../Pages/Feedback.jsx'
import Updation from '../Pages/Updation.jsx'
import Profile from '../Pages/Profile.jsx'

// Everything the Sub Admin needs lives inside this one folder.
function SubAdminPortal() {
  return (
    <Routes>
      <Route element={<SubAdminShell />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/add" element={<StudentAdd />} />
        <Route path="students/:studentId" element={<StudentDetail />} />
        <Route path="attendance/mark" element={<AttendanceMark />} />
        <Route path="attendance/view" element={<AttendanceView />} />
        <Route path="attendance/multi" element={<AttendanceMulti />} />
        <Route path="administration" element={<Administration />} />
        <Route path="trainers" element={<Trainers />} />
        <Route path="trainers/attendance/mark" element={<TrainerAttendanceMark />} />
        <Route path="trainers/attendance/view" element={<TrainerAttendanceView />} />
        <Route path="trainers/attendance/requests" element={<TrainerAttendanceRequests />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="updation" element={<Updation />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin/subadmin/dashboard" replace />} />
    </Routes>
  )
}

export default SubAdminPortal
