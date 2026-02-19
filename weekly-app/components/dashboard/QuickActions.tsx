'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

interface Action {
  label: string
  icon: React.ReactNode
  path: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

interface QuickActionsProps {
  actions?: Action[]
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  const router = useRouter()

  const defaultActions: Action[] = [
    {
      label: 'Nuevo Cliente',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      path: '/dashboard/clientes/nuevo',
      color: 'blue'
    },
    {
      label: 'Nuevo Crédito',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      path: '/dashboard/creditos/nuevo',
      color: 'green'
    },
    {
      label: 'Registrar Pago',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      path: '/dashboard/pagos/nuevo',
      color: 'purple'
    },
    {
      label: 'Nuevo Producto',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      path: '/dashboard/productos/nuevo',
      color: 'orange'
    }
  ]

  const items = actions || defaultActions

  const getColorClasses = (color: string = 'blue') => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30',
      green: 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30',
      purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30',
      orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30',
      red: 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Acciones Rápidas
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {items.map((action, index) => (
          <button
            key={index}
            onClick={() => router.push(action.path)}
            className={`p-4 rounded-lg transition-all hover:scale-105 ${getColorClasses(action.color)}`}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                {action.icon}
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" fullWidth>
          Ver todas las acciones
        </Button>
      </div>
    </Card>
  )
}