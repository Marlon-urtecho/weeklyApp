'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className
}) => {
  return (
    <div className={cn(
      'text-center py-12 px-4',
      'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
      className
    )}>
      {icon ? (
        <div className="mx-auto w-16 h-16 text-gray-400 mb-4">
          {icon}
        </div>
      ) : (
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      )}
      
      <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
        {title}
      </h3>
      
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      
      {action && (
        <div className="mt-6">
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}