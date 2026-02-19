'use client'

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface LineChartProps {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    fill?: boolean
  }[]
  title?: string
  height?: number
}

export const LineChart: React.FC<LineChartProps> = ({
  labels,
  datasets,
  title,
  height = 300
}) => {
  const options = {
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
    elements: {
      line: {
        tension: 0.3,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  }

  const chartData = {
    labels,
    datasets: datasets.map(dataset => ({
      ...dataset,
      borderColor: dataset.borderColor || '#3b82f6',
      backgroundColor: dataset.backgroundColor || 'rgba(59, 130, 246, 0.1)',
      fill: dataset.fill || false,
    })),
  }

  return (
    <div style={{ height }}>
      <Line options={options} data={chartData} />
    </div>
  )
}