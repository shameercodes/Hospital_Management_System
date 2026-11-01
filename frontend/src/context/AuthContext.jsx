import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../utils/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('hms_user')
      return u ? JSON.parse(u) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('hms_token')
    if (token) {
      authAPI.me()
        .then(res => {
          setUser(res.data.data)
          localStorage.setItem('hms_user', JSON.stringify(res.data.data))
        })
        .catch(() => {
          localStorage.removeItem('hms_token')
          localStorage.removeItem('hms_user')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { token, user: u } = res.data
    localStorage.setItem('hms_token', token)
    localStorage.setItem('hms_user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const logout = () => {
    localStorage.removeItem('hms_token')
    localStorage.removeItem('hms_user')
    setUser(null)
  }

  const hasRole = (...roles) => roles.includes(user?.role)
  const isAdmin = () => user?.role === 'admin'
  const canWrite = (...roles) => {
    if (!user?.role) return false
    if (!roles.length) return true
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, isAdmin, canWrite }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
