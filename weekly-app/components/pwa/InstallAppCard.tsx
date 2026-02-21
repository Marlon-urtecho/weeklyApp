'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const isIos = () =>
  typeof window !== 'undefined' &&
  /iPad|iPhone|iPod/.test(window.navigator.userAgent) &&
  !(window as any).MSStream

const isInStandaloneMode = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true)

export default function InstallAppCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    setIsInstalled(isInStandaloneMode())

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const canInstall = useMemo(() => Boolean(deferredPrompt) && !isInstalled, [deferredPrompt, isInstalled])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    } finally {
      setInstalling(false)
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        App móvil (PWA)
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Instala Weekly en tu teléfono para abrirla como app, con acceso rápido desde el escritorio.
      </p>

      {isInstalled && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
          La aplicación ya está instalada en este dispositivo.
        </div>
      )}

      {!isInstalled && canInstall && (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleInstall} loading={installing}>
            Instalar en este dispositivo
          </Button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Disponible en Android/Chrome y navegadores compatibles.
          </span>
        </div>
      )}

      {!isInstalled && !canInstall && isIos() && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          En iPhone/iPad: abre Share y luego pulsa "Add to Home Screen".
        </div>
      )}

      {!isInstalled && !canInstall && !isIos() && (
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            Si no aparece el botón de instalación, abre esta app desde `https` o `localhost` y usa Chrome o Edge.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setShowHelp((prev) => !prev)}>
              {showHelp ? 'Ocultar ayuda' : 'Cómo instalar'}
            </Button>
          </div>
          {showHelp && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 space-y-1">
              <p>1. Abre la app en Chrome o Edge.</p>
              <p>2. Pulsa el icono de instalar en la barra de direcciones.</p>
              <p>3. Si no aparece, abre el menú del navegador y elige "Instalar aplicación".</p>
              <p>4. En iOS: Share {'>'} Add to Home Screen.</p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
