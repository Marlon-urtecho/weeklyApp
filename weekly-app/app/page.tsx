'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
      <p className="ml-3 text-gray-600">Redirigiendo al login...</p>
    </div>
  )
}