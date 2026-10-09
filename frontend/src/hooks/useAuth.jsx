import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import * as authApi from '../api/auth'
import { clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // loading | authenticated | anonymous
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // A 401 from any protected route ends the session exactly once, wherever it
  // happens, rather than each call site inventing its own handling.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setStatus('anonymous')
      queryClient.clear()
      navigate('/login?expired=1', { replace: true })
    })
    return () => setUnauthorizedHandler(null)
  }, [navigate, queryClient])

  // Restore a session on first load.
  useEffect(() => {
    let cancelled = false
    if (!getToken()) {
      setStatus('anonymous')
      return undefined
    }
    authApi
      .me()
      .then((data) => {
        if (cancelled) return
        setUser(data)
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        clearToken()
        setStatus('anonymous')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password)
    setToken(data.access_token)
    setUser({ username: data.username })
    setStatus('authenticated')
    return data
  }, [])

  const signup = useCallback(async (payload) => {
    const data = await authApi.signup(payload)
    setToken(data.access_token)
    setUser({ username: data.username })
    setStatus('authenticated')
    return data
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
    setStatus('anonymous')
    queryClient.clear()
    navigate('/login', { replace: true })
  }, [navigate, queryClient])

  const value = useMemo(
    () => ({ user, status, login, signup, logout }),
    [user, status, login, signup, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
