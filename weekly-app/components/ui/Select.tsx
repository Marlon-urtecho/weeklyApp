'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Option {
  value: string | number
  label: string
  disabled?: boolean
}

interface SelectProps {
  label?: string
  options: Option[]
  value?: string | number
  onChange?: (value: string | number) => void
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  error,
  required,
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState<Option | undefined>(
    options.find(opt => opt.value === value)
  )
  const selectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setSelectedOption(options.find(opt => opt.value === value))
  }, [value, options])

  const handleSelect = (option: Option) => {
    if (option.disabled) return
    setSelectedOption(option)
    onChange?.(option.value)
    setIsOpen(false)
  }

  return (
    <div className={cn('w-full', className)} ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'w-full px-4 py-2.5 text-left bg-white dark:bg-gray-800 border rounded-lg transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            error
              ? 'border-red-300 dark:border-red-700'
              : 'border-gray-300 dark:border-gray-600',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
          )}
          disabled={disabled}
        >
          <span className={cn(
            'block truncate',
            !selectedOption && 'text-gray-400 dark:text-gray-500'
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className={cn(
                'h-5 w-5 text-gray-400 transition-transform duration-200',
                isOpen && 'transform rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                disabled={option.disabled}
                className={cn(
                  'w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                  selectedOption?.value === option.value
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-900 dark:text-gray-200',
                  option.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
