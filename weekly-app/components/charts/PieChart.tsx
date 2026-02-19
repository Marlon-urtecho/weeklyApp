'use client'

import React from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface PieChartProps {
  labels: string[]
  data: number[]
  backgroundColor?: string[]
  title?: string
  height?: number
}

export const PieChart: React.FC<PieChartProps> = ({
  labels,
  data,
  backgroundColor,
  title,
  height = 300
}) => {
  const defaultColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#6b7280'
  ]

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || ''
            const value = context.raw || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
    },
  }

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColor || defaultColors.slice(0, data.length),
        borderColor: 'white',
        borderWidth: 2,
      },
    ],
  }

  return (
    <div style={{ height }}>
      <Pie options={options} data={chartData} />
    </div>
  )
}