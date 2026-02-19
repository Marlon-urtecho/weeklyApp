'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileMenu from './MobileMenu'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

interface LayoutContainerProps {
  children: React.ReactNode
}

export default function LayoutContainer({ children }: LayoutContainerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  // Cargar estado del sidebar desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved) {
      setSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  // Escuchar cambios en el sidebar
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarCollapsed' && e.newValue) {
        setSidebarCollapsed(JSON.parse(e.newValue))
      }
    }

    const handleSidebarStateChange = (e: Event) => {
      const custom = e as CustomEvent<{ collapsed?: boolean }>
      if (typeof custom.detail?.collapsed === 'boolean') {
        setSidebarCollapsed(custom.detail.collapsed)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('sidebar-state-change', handleSidebarStateChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sidebar-state-change', handleSidebarStateChange)
    }
  }, [])

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const segments = pathname?.split('/').filter(Boolean) || []
  const currentLabel =
    segments.length <= 1
      ? 'Dashboard'
      : segments[segments.length - 1]
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (m) => m.toUpperCase())

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Mobile menu */}
      <MobileMenu 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Desktop sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-40 hidden lg:block transition-all duration-300',
        sidebarCollapsed ? 'w-20' : 'w-72'
      )}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className={cn(
        'min-h-screen transition-all duration-300',
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      )}>
        {/* Header - SOLO pasamos onMenuClick que es lo que acepta */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span>{currentLabel}</span>
          </div>
        </div>
        
        {/* Main content */}
        <main className="flex-1 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 py-4 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              © 2026 Weekly. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
