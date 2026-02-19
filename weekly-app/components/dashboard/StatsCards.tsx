'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'

interface Stat {
  title: string
  value: React.ReactNode
  valueTitle?: string
  change?: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange'
}

interface StatsCardsProps {
  stats: Stat[]
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        icon: 'bg-blue-500'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-600 dark:text-green-400',
        icon: 'bg-green-500'
      },
      yellow: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        text: 'text-yellow-600 dark:text-yellow-400',
        icon: 'bg-yellow-500'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-600 dark:text-red-400',
        icon: 'bg-red-500'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-600 dark:text-purple-400',
        icon: 'bg-purple-500'
      },
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        text: 'text-orange-600 dark:text-orange-400',
        icon: 'bg-orange-500'
      }
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const colors = getColorClasses(stat.color)
        
        return (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p
                  className="text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mt-2 leading-tight break-words"
                  title={stat.valueTitle}
                >
                  {stat.value}
                </p>
                {stat.change !== undefined && (
                  <p className={`text-sm mt-2 flex items-center ${
                    stat.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change > 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
                    <span className="text-gray-400 ml-1">vs ayer</span>
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${colors.bg}`}>
                <div className={`w-10 h-10 ${colors.icon} rounded-lg flex items-center justify-center text-white`}>
                  {stat.icon}
                </div>
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${colors.icon} opacity-50 group-hover:opacity-100 transition-opacity`} />
          </Card>
        )
      })}
    </div>
  )
}
