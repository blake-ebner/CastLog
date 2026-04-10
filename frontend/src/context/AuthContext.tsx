import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { UserOut } from '../types'
import { apiLogin, apiRegister, apiGetMyProfile } from '../api/client'

interface AuthContextValue {
  user: UserOut | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<UserOut | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async (t: string) => {
    try {
      localStorage.setItem('token', t)
      const profile = await apiGetMyProfile()
      setUser(profile.user)
    } catch {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    if (token) {
      fetchUser(token).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (username: string, password: string) => {
    const data = await apiLogin(username, password)
    setToken(data.access_token)
    await fetchUser(data.access_token)
  }

  const register = async (username: string, email: string, password: string) => {
    const data = await apiRegister(username, email, password)
    setToken(data.access_token)
    await fetchUser(data.access_token)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
