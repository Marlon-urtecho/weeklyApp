'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Activity {
  id: string
  type: 'pago' | 'credito' | 'cliente' | 'producto' | 'usuario'
  description: string
  amount?: number
  user: string
  timestamp: string
  status?: string
}

interface RecentActivityProps {
  activities: Activity[]
  onViewAll?: () => void
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  onViewAll
}) => {
  const getActivityIcon = (type: string) => {
    const icons = {
      pago: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      credito: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      cliente: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      producto: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      usuario: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    return icons[type as keyof typeof icons] || icons.producto
  }

  const getActivityColor = (type: string) => {
    const colors = {
      pago: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      credito: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      cliente: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      producto: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
      usuario: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
    }
    return colors[type as keyof typeof colors] || colors.producto
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Actividad Reciente
        </h3>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            Ver todo
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.description}
                </p>
                {activity.amount && (
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Q{activity.amount.toFixed(2)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{activity.user}</span>
                <span className="mx-2">•</span>
                <span>{activity.timestamp}</span>
              </div>

              {activity.status && (
                <div className="mt-2">
                  <Badge size="sm" variant={activity.status === 'completado' ? 'success' : 'warning'}>
                    {activity.status}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No hay actividad reciente
          </div>
        )}
      </div>
    </Card>
  )
}