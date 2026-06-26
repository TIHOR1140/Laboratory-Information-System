import { useState } from 'react'
import { api } from '../lib/api.js'
import { clearSession, getDashboardPath, loadSession, saveSession } from '../lib/authStorage.js'
import { AuthContext } from './AuthContext.js'

export function AuthProvider({ children }) {
  const initialSession = loadSession()
  const [user, setUser] = useState(initialSession?.user ?? null)
  const [token, setToken] = useState(initialSession?.token ?? '')

  const persistSession = (session, rememberMe = true) => {
    saveSession(session, rememberMe)
    setUser(session.user)
    setToken(session.token)
  }

  const login = async ({ email, password, rememberMe }) => {
    const response = await api.post('/auth/login', { email, password })
    persistSession(response.data, rememberMe)
    return response.data
  }

  const register = async (payload, rememberMe = true) => {
    const response = await api.post('/auth/register', payload)
    persistSession(response.data, rememberMe)
    return response.data
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearSession()
      setUser(null)
      setToken('')
    }
  }

  const refreshProfile = async () => {
    const response = await api.get('/profile')
    setUser((currentUser) => ({ ...currentUser, ...response.data.user }))
    return response.data
  }

  const updateProfile = async (payload) => {
    const response = await api.put('/profile', payload)
    setUser((currentUser) => ({ ...currentUser, ...response.data.user }))
    return response.data
  }

  const changePassword = async (payload) => {
    const response = await api.put('/profile/change-password', payload)
    return response.data
  }

  const value = {
    user,
    token,
    loading: false,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    logout,
    refreshProfile,
    updateProfile,
    changePassword,
    getDashboardPath,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
