// src/contexts/AuthContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: number
  nombre: string
  email: string
  rol: { nombre: string }
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, nombre: string, rol?: string) => Promise<boolean>
  logout: () => void
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Cargar token del localStorage al iniciar
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (data.ok) {
        setToken(data.data.token)
        
        // Obtener información del usuario
        const userResponse = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${data.data.token}` }
        })
        
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData.data)
          localStorage.setItem('token', data.data.token)
          localStorage.setItem('user', JSON.stringify(userData.data))
        }
        
        setLoading(false)
        return true
      } else {
        setError(data.error)
        setLoading(false)
        return false
      }
    } catch (error) {
      setError('Error de conexión')
      setLoading(false)
      return false
    }
  }

  const register = async (email: string, password: string, nombre: string, rol: string = 'cliente'): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nombre, rol })
      })
      
      const data = await response.json()
      
      if (data.ok) {
        setToken(data.data.token)
        setUser(data.data.user)
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        setLoading(false)
        return true
      } else {
        setError(data.error)
        setLoading(false)
        return false
      }
    } catch (error) {
      setError('Error de conexión')
      setLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      loading,
      error
    }}>
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