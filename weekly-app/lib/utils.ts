import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ'
  }).format(amount)
}

export const formatCompactCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(amount)
}

export const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium'
  }).format(new Date(date))
}

export const formatDateTime = (date: string | Date) => {
  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date))
}
