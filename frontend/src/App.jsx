import { Routes, Route } from 'react-router-dom'
import Landing from './Pages/Landing.jsx'
import StudentPortal from './components/frontend/Student/Layout/StudentPortal.jsx'
import TeacherPortal from './components/frontend/Teacher/Layout/TeacherPortal.jsx'
import SubAdminPortal from './components/frontend/Admin/SubAdmin/Layout/SubAdminPortal.jsx'
import SuperAdminPortal from './components/frontend/Admin/SuperAdmin/Layout/SuperAdminPortal.jsx'
import ProtectedRoute from './context/ProtectedRoute.jsx'

function App() {
  return (
    <Routes>
      {/* Shared entry gateway - login / create account for both roles */}
      <Route path="/" element={<Landing />} />

      {/* Everything under /student/* lives inside the Student folder only */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute role="student">
            <StudentPortal />
          </ProtectedRoute>
        }
      />

      {/* Everything under /teacher/* lives inside the Teacher folder only */}
      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute role="teacher">
            <TeacherPortal />
          </ProtectedRoute>
        }
      />

      {/* Everything under /admin/subadmin/* lives inside Admin/SubAdmin only */}
      <Route
        path="/admin/subadmin/*"
        element={
          <ProtectedRoute role="subadmin">
            <SubAdminPortal />
          </ProtectedRoute>
        }
      />

      {/* Everything under /admin/superadmin/* lives inside Admin/SuperAdmin only */}
      <Route
        path="/admin/superadmin/*"
        element={
          <ProtectedRoute role="superadmin">
            <SuperAdminPortal />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
