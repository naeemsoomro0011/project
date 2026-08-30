import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth.js'

// Wrap any portal's routes with this to make sure only a logged-in account
// of the right role can reach it, e.g.:
//   <Route path="/teacher/*" element={<ProtectedRoute role="teacher"><TeacherPortal /></ProtectedRoute>} />
export default function ProtectedRoute({ role, children }) {
  const { role: currentRole, isAuthenticated, loading } = useAuth()

  if (loading) return null // avoid a flash-redirect while we're still checking localStorage/token

  if (!isAuthenticated || currentRole !== role) {
    return <Navigate to="/" replace />
  }

  return children
}
