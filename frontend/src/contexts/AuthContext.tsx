import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

interface User {
  id: number
  username: string
  email: string | null
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await api.get('/users/me/')
      setUser(response.data)
    } catch (error) {
      console.error('Check auth error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login/', { username, password })
      if (response.data.user) {
        setUser(response.data.user)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      const message = error.response?.data?.detail || 'An error occurred during login'
      throw new Error(message)
    }
  }

  const register = async (userData: any) => {
    try {
      const response = await api.post('/users/', userData)
      // Don't set user state after registration
      // Instead, let them log in after approval
      return response.data
    } catch (error: any) {
      console.error('Registration error:', error)
      const message = error.response?.data?.detail || error.message || 'Registration failed'
      throw new Error(message)
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout/')
      setUser(null)
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear the user state even if the logout request fails
      setUser(null)
      navigate('/login')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 