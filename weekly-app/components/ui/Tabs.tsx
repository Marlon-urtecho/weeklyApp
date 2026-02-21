'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  variant?: 'underline' | 'pills' | 'buttons'
  className?: string
  children?: React.ReactNode
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  variant = 'underline',
  className,
  children
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const variants = {
    underline: {
      container: 'border-b border-gray-200 dark:border-gray-700 overflow-x-auto',
      tab: (isActive: boolean) => cn(
        'px-4 py-2 text-sm font-medium transition-colors relative',
        isActive
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 -mb-px'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      )
    },
    pills: {
      container: 'overflow-x-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-lg',
      tab: (isActive: boolean) => cn(
        'px-4 py-2 text-sm font-medium rounded-lg transition-all',
        isActive
          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      )
    },
    buttons: {
      container: 'overflow-x-auto',
      tab: (isActive: boolean) => cn(
        'px-4 py-2 text-sm font-medium rounded-lg transition-all border',
        isActive
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
      )
    }
  }

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  return (
    <div className={className}>
      <div className={variants[variant].container}>
        <div className="flex w-max min-w-full gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                variants[variant].tab(activeTab === tab.id),
                'flex items-center space-x-2 whitespace-nowrap'
              )}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {children && (
        <div className="mt-4">
          {React.Children.map(children, (child) => {
            if (
              React.isValidElement<{ tabId?: string }>(child) &&
              child.props.tabId === activeTab
            ) {
              return child
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}

interface TabPanelProps {
  tabId: string
  children: React.ReactNode
}

export const TabPanel: React.FC<TabPanelProps> = ({ children }) => {
  return <div>{children}</div>
}
