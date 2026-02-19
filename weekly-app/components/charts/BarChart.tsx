'use client'

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface BarChartProps {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
  }[]
  title?: string
  height?: number
  horizontal?: boolean
}

export const BarChart: React.FC<BarChartProps> = ({
  labels,
  datasets,
  title,
  height = 300,
  horizontal = false
}) => {
  const options = {
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  }

  const chartData = {
    labels,
    datasets: datasets.map(dataset => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || '#3b82f6',
      borderColor: dataset.borderColor || '#2563eb',
      borderWidth: dataset.borderWidth || 1,
    })),
  }

  return (
    <div style={{ height }}>
      <Bar options={options} data={chartData} />
    </div>
  )
}