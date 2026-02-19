'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api/client'

interface HeaderProps {
  onMenuClick: () => void
}

type NotificationLevel = 'critical' | 'warning' | 'success' | 'info'

interface HeaderNotification {
  id: string
  title: string
  message: string
  time: string
  href: string
  level: NotificationLevel
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<HeaderNotification[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const getRelativeTime = (date: Date): string => {
    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Ahora'
    if (diffMin < 60) return `Hace ${diffMin} min`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `Hace ${diffHours} h`
    const diffDays = Math.floor(diffHours / 24)
    return `Hace ${diffDays} d`
  }

  const levelStyles: Record<NotificationLevel, string> = {
    critical: 'border-l-4 border-red-500',
    warning: 'border-l-4 border-amber-500',
    success: 'border-l-4 border-emerald-500',
    info: 'border-l-4 border-cyan-500'
  }

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true)
      const [dashboardRes, stockRes] = await Promise.allSettled([
        apiClient.get('/api/dashboard'),
        apiClient.get('/api/inventario/bodega/stock-bajo?limite=5')
      ])

      const now = new Date()
      const list: HeaderNotification[] = []

      if (dashboardRes.status === 'fulfilled') {
        const dashboard = dashboardRes.value || {}
        const creditosVencidos = Number(dashboard?.general?.alertas?.creditosVencidos || 0)
        const pagosHoy = Array.isArray(dashboard?.creditos?.pagosHoy) ? dashboard.creditos.pagosHoy : []

        if (creditosVencidos > 0) {
          list.push({
            id: 'creditos-vencidos',
            title: 'Créditos vencidos',
            message: `Tienes ${creditosVencidos} crédito(s) vencido(s) por revisar.`,
            time: getRelativeTime(now),
            href: '/dashboard/creditos',
            level: 'critical'
          })
        }

        if (pagosHoy.length > 0) {
          const fechaUltimoPago = pagosHoy[0]?.fecha_pago ? new Date(pagosHoy[0].fecha_pago) : now
          list.push({
            id: 'pagos-hoy',
            title: 'Pagos registrados hoy',
            message: `Se registraron ${pagosHoy.length} pago(s) hoy.`,
            time: getRelativeTime(fechaUltimoPago),
            href: '/dashboard/pagos',
            level: 'success'
          })
        }
      }

      if (stockRes.status === 'fulfilled' && Array.isArray(stockRes.value) && stockRes.value.length > 0) {
        for (const item of stockRes.value.slice(0, 3)) {
          list.push({
            id: `stock-${item?.id_inventario ?? item?.id_producto ?? Math.random()}`,
            title: 'Stock bajo en bodega',
            message: `${item?.productos?.nombre || 'Producto'}: ${Number(item?.stock_disponible || 0)} unidades disponibles.`,
            time: getRelativeTime(now),
            href: '/dashboard/inventario',
            level: 'warning'
          })
        }
      }

      if (list.length === 0) {
        list.push({
          id: 'sin-alertas',
          title: 'Sin alertas',
          message: 'No hay notificaciones pendientes.',
          time: getRelativeTime(now),
          href: '/dashboard',
          level: 'info'
        })
      }

      setNotifications(list)
      setUnreadCount(list.filter((n) => n.id !== 'sin-alertas').length)
    } finally {
      setLoadingNotifications(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (showNotifications) {
      setUnreadCount(0)
    }
  }, [showNotifications])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Search */}
            <div className="hidden md:block ml-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar en el sistema..."
                  className="w-80 pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
                <div className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center font-semibold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 border border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Notificaciones</p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {loadingNotifications && (
                      <div className="px-4 py-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando notificaciones...</p>
                      </div>
                    )}
                    {!loadingNotifications && notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => {
                          setShowNotifications(false)
                          router.push(notification.href)
                        }}
                        className={cn(
                          'w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                          levelStyles[notification.level]
                        )}
                      >
                        <p className="text-sm text-gray-900 dark:text-white font-medium">{notification.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{notification.message}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setShowNotifications(false)
                        router.push('/dashboard')
                      }}
                      className="text-sm text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 font-medium"
                    >
                      Ir al dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 focus:outline-none p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur opacity-50"></div>
                  <div className="relative w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold">
                    {user?.nombre?.charAt(0) || 'U'}
                  </div>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.nombre || 'Usuario'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.username || 'usuario@demo.com'}</p>
                </div>
                <svg className={cn(
                  "h-4 w-4 text-gray-400 transition-transform duration-200",
                  showProfileMenu && "rotate-180"
                )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-1 border border-gray-200 dark:border-gray-700">
                  <a
                    href="/dashboard/perfil"
                    className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Tu Perfil</span>
                    </div>
                  </a>
                  <a
                    href="/dashboard/configuracion"
                    className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      </svg>
                      <span>Configuración</span>
                    </div>
                  </a>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Cerrar Sesión</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
