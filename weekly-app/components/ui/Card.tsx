'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  border?: boolean
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  hover = false,
  border = false,
  shadow = 'md'
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const shadows = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl transition-all duration-200',
        paddings[padding],
        shadows[shadow],
        border && 'border border-gray-200 dark:border-gray-700',
        hover && 'hover:shadow-xl hover:-translate-y-1 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export default Card
