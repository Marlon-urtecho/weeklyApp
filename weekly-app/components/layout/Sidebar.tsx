'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { buildNavigation } from './navigation'

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [query, setQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    principal: true,
    comercial: true,
    inventario: true,
    administracion: false
  })

  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed')
    const savedSections = localStorage.getItem('sidebarSections')
    if (savedCollapsed) setIsCollapsed(JSON.parse(savedCollapsed))
    if (savedSections) setExpandedSections(JSON.parse(savedSections))
  }, [])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState))
    window.dispatchEvent(new CustomEvent('sidebar-state-change', { detail: { collapsed: newState } }))
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] }
      localStorage.setItem('sidebarSections', JSON.stringify(next))
      return next
    })
  }

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

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-72'
      )}
    >
      <div className={cn('h-16 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center', isCollapsed ? 'justify-center' : 'justify-between')}>
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold">
            AR
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Weekly App</p>
              <p className="text-xs text-gray-500 truncate">Distribuidora AR</p>
            </div>
          )}
        </Link>

        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
          title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <div className="px-3 pt-3">
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
      )}

      <div className={cn('h-[calc(100vh-4rem)] overflow-y-auto', isCollapsed ? 'px-2 py-3' : 'px-3 py-3')}>
        <nav className="space-y-4">
          {filteredSections.map((section) => (
            <div key={section.id}>
              {!isCollapsed && (
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <span>{section.label}</span>
                  <svg className={cn('w-4 h-4 transition-transform', expandedSections[section.id] && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}

              {(isCollapsed || expandedSections[section.id]) && (
                <div className="space-y-1 mt-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.path || pathname?.startsWith(`${item.path}/`)
                    return (
                      <Link
                        key={item.id}
                        href={item.path}
                        title={isCollapsed ? item.label : undefined}
                        className={cn(
                          'group flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors',
                          isCollapsed ? 'justify-center' : '',
                          isActive
                            ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'
                        )}
                      >
                        <span className={cn('flex-shrink-0', isActive ? 'text-cyan-600 dark:text-cyan-300' : 'text-gray-500')}>{item.icon}</span>
                        {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  )
}
