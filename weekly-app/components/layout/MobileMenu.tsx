'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { buildNavigation } from './navigation'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    principal: true,
    comercial: true,
    inventario: false,
    administracion: false
  })

  const roles = (user?.roles || []).map((r) => (r.nombre_rol || '').toUpperCase().trim())
  const sections = useMemo(() => buildNavigation(roles), [roles])

  const filteredSections = useMemo(() => {
    const term = query.toLowerCase().trim()
    if (!term) return sections
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.label.toLowerCase().includes(term))
      }))
      .filter((section) => section.items.length > 0)
  }, [sections, query])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 left-0 w-[88%] max-w-sm bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-2xl">
        <div className="h-16 px-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold">
              W
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Navegación</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 pt-3">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar módulo..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <nav className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-7rem)]">
          {filteredSections.map((section) => (
            <div key={section.id} className="space-y-1">
              <button
                onClick={() => setExpandedSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                <span>{section.label}</span>
                <svg className={cn('w-4 h-4 transition-transform', expandedSections[section.id] && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections[section.id] && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.path || pathname?.startsWith(`${item.path}/`)
                    return (
                      <Link
                        key={item.id}
                        href={item.path}
                        onClick={onClose}
                        className={cn(
                          'flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors',
                          isActive
                            ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'
                        )}
                      >
                        <span className={cn('flex-shrink-0', isActive ? 'text-cyan-600 dark:text-cyan-300' : 'text-gray-500')}>{item.icon}</span>
                        <span className="ml-3 truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}

