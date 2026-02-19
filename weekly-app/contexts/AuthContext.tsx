'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
       
interface User {
  id_usuario: number
  nombre: string
  username: string
  activo: boolean
  roles?: Array<{ id_rol: number; nombre_rol: string }>
  usuario_roles?: Array<{ roles?: { id_rol: number; nombre_rol: string } }>
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateUser: (nextUser: Partial<User>) => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const TOKEN_STORAGE_KEY = 'token'
const USER_STORAGE_KEY = 'user'
const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const normalizeUser = (raw: any): User => {
    const directRoles = Array.isArray(raw?.roles) ? raw.roles : []
    const mappedFromUsuarioRoles = Array.isArray(raw?.usuario_roles)
      ? raw.usuario_roles.map((ur: any) => ur?.roles).filter(Boolean)
      : []
    const allRoles = [...directRoles, ...mappedFromUsuarioRoles]
    const uniqueMap = new Map<number, { id_rol: number; nombre_rol: string }>()
    allRoles.forEach((r: any) => {
      const id = Number(r?.id_rol)
      if (!Number.isNaN(id) && !uniqueMap.has(id)) {
        uniqueMap.set(id, {
          id_rol: id,
          nombre_rol: String(r?.nombre_rol || '').trim()
        })
      }
    })

    return {
      ...raw,
      roles: Array.from(uniqueMap.values())
    }
  }

  const clearSession = (redirectToLogin = true) => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    apiClient.setToken(null)
    if (redirectToLogin) {
      router.push('/login')
    }
  }

  const refreshAccessToken = async (): Promise<string | null> => {
    if (!API_URL) return null

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      const newToken = typeof data?.token === 'string' ? data.token : null
      if (!newToken) return null

      setToken(newToken)
      localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
      apiClient.setToken(newToken)

      return newToken
    } catch {
      return null
    }
  }

  useEffect(() => {
    // Verificar si hay sesión guardada
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    const storedUser = localStorage.getItem(USER_STORAGE_KEY)
    
    if (storedToken && storedUser) {
      const parsedUser = normalizeUser(JSON.parse(storedUser))
      setToken(storedToken)
      setUser(parsedUser)
      apiClient.setToken(storedToken)
    }
    
    setLoading(false)
  }, [])

  useEffect(() => {
    apiClient.onTokenRefresh(async () => {
      const refreshed = await refreshAccessToken()
      return refreshed
    })

    apiClient.onUnauthorized(() => {
      clearSession()
    })
    return () => {
      apiClient.onTokenRefresh(null)
      apiClient.onUnauthorized(null)
    }
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const data = await apiClient.post('/auth/login', { username, password })
      
      // Guardar en estado y localStorage
      const normalizedUser = normalizeUser(data.user)
      setToken(data.token)
      setUser(normalizedUser)
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser))
      apiClient.setToken(data.token)
      
      // Redirigir al dashboard
      router.push('/dashboard')
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Error de conexión' }
    }
  }

  const logout = async () => {
    if (API_URL) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        })
      } catch {
        // noop
      }
    }
    clearSession()
  }

  const updateUser = (nextUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev
      const merged = normalizeUser({ ...prev, ...nextUser })
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(merged))
      return merged
    })
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      updateUser,
      isAuthenticated: !!user && !!token
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
