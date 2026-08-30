import { useState, useCallback, useEffect } from 'react'
import { api, setToken, getToken } from '../api/client.js'
import { AuthContext } from './authContextObject.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('titan_user')
    return stored ? JSON.parse(stored) : null
  })
  const [role, setRole] = useState(() => sessionStorage.getItem('titan_role') || null)
  const [loading, setLoading] = useState(true)

  // On first load, if a token exists, re-fetch the account fresh from the
  // server (rather than trusting whatever was cached) so a suspension or
  // profile edit made elsewhere is picked up immediately.
  useEffect(() => {
    async function bootstrap() {
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await api.get('/auth/me')
        setUser(res.user)
        setRole(res.role)
        sessionStorage.setItem('titan_user', JSON.stringify(res.user))
        sessionStorage.setItem('titan_role', res.role)
      } catch {
        setToken(null)
        sessionStorage.removeItem('titan_user')
        sessionStorage.removeItem('titan_role')
        setUser(null)
        setRole(null)
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [])

  const login = useCallback((token, newRole, newUser) => {
    setToken(token)
    sessionStorage.setItem('titan_role', newRole)
    sessionStorage.setItem('titan_user', JSON.stringify(newUser))
    setRole(newRole)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    sessionStorage.removeItem('titan_role')
    sessionStorage.removeItem('titan_user')
    setRole(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch }
      sessionStorage.setItem('titan_user', JSON.stringify(next))
      return next
    })
  }, [])

  const isAuthenticated = !!user && !!role

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, updateUser, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}
