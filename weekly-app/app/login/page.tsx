'use client'

import { useState, type ChangeEvent, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('demo1234')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [progress, setProgress] = useState(0)
  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [authLoading, isAuthenticated, router])

  // Splash screen de 10 segundos con barra de progreso animada
  useEffect(() => {
    let interval: NodeJS.Timeout
    let timeout: NodeJS.Timeout

    if (showSplash) {
      // Actualizar progreso cada 100ms
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 1
          return newProgress > 100 ? 100 : newProgress
        })
      }, 100)

      // Finalizar splash screen
      timeout = setTimeout(() => {
        clearInterval(interval)
        setFadeOut(true)
        setTimeout(() => setShowSplash(false), 500)
      }, 10000)
    }

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [showSplash])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <LoadingSpinner />
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await login(username, password)
    
    if (!result.success) {
      showToast(result.error || 'Error en el login', 'error')
    }
    
    setLoading(false)
  }

  // Splash Screen Dark Mode
  if (showSplash) {
    return (
      <div className={`fixed inset-0 transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
        {/* Fondo dark con gradiente y partículas */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
          {/* Efecto de grid sutil */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }} />
          
          {/* Partículas animadas */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400/20 rounded-full animate-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 5}s`
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Contenido */}
        <div className="relative h-full flex flex-col items-center justify-center text-white px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo con animación de brillo */}
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-cyan-400 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl animate-spin-slow opacity-20"></div>
                <div className="relative w-full h-full bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-cyan-500/30 flex items-center justify-center shadow-2xl">
                  <span className="text-6xl animate-float">💵</span>
                </div>
              </div>
            </div>
            
            {/* Título con efecto neon */}
            <h1 className="text-7xl md:text-8xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                WEEKLY
              </span>
            </h1>
            
            {/* Subtítulo */}
            <p className="text-2xl md:text-3xl text-gray-400 mb-12 animate-fade-in-up">
              Potencia tu negocio de préstamos
            </p>
            
            {/* Grid de características dark */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
              {[
                { icon: '⚡', text: 'Escala rápido', desc: 'Automatiza procesos' },
                { icon: '🔒', text: 'Seguridad total', desc: 'Protección bancaria' },
                { icon: '📊', text: 'Analytics', desc: 'Decisiones en tiempo real' }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="group relative animate-fade-in-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                  <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 group-hover:border-cyan-500/50 transition-all">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <p className="text-lg font-semibold text-white mb-1">{item.text}</p>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Barra de carga mejorada */}
            <div className="w-80 mx-auto space-y-4">
              {/* Porcentaje */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Inicializando sistema</span>
                <span className="text-cyan-400 font-mono font-bold">{progress}%</span>
              </div>
              
              {/* Barra de progreso con efecto de brillo */}
              <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 rounded-full animate-pulse-slow"
                  style={{ 
                    width: `${progress}%`,
                    transition: 'width 0.1s linear',
                    boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
                  }} 
                />
              </div>
              
              {/* Mensajes dinámicos */}
              <p className="text-xs text-gray-500 animate-pulse">
                {progress < 30 && 'Preparando módulos de crédito...'}
                {progress >= 30 && progress < 60 && 'Cargando cartera de clientes...'}
                {progress >= 60 && progress < 90 && 'Sincronizando datos en tiempo real...'}
                {progress >= 90 && '¡Listo para comenzar!'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Login Screen Dark Mode
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4 relative overflow-hidden">
      {/* Fondo dark con efectos */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        {/* Patrón de grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }} />
      </div>

      {/* Círculos decorativos con efecto neon */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

      {/* Contenido del login */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-gray-900/90 backdrop-blur-xl border border-gray-800 shadow-2xl">
          <div className="p-8">
            {/* Header con efecto neon */}
            <div className="text-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl animate-spin-slow opacity-20"></div>
                  <div className="relative w-full h-full bg-gray-800 rounded-2xl border border-cyan-500/30 flex items-center justify-center">
                    <span className="text-4xl">💵</span>
                  </div>
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                WEEKLY
              </h1>
              <p className="text-gray-400 mt-1">Gestiona tu Negocio</p>
            </div>

            {/* Formulario dark */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition text-gray-100 placeholder-gray-500"
                  placeholder="Ingresa tu usuario"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Contraseña
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition text-gray-100 placeholder-gray-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3.5 text-lg font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/25"
              >
                Iniciar Sesión
              </Button>
            </form>

            {/* Enlaces dark */}
            <div className="mt-6 flex items-center justify-between text-sm">
              <button className="text-cyan-400 hover:text-cyan-300 font-medium transition">
                ¿Olvidaste tu contraseña?
              </button>
              <button className="text-gray-400 hover:text-gray-300 transition">
                comunicate con soporte administrativo
              </button>
            </div>

            {/* Copyright */}
            <p className="text-center text-xs text-gray-600 mt-6">
              © 2026 Weekly App. Todos los derechos reservados.
            </p>
          </div>
        </Card>
      </div>

      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes particle {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          100% {
            transform: translate(100px, -100px) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-fade-in-up {
          opacity: 0;
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .animate-particle {
          animation: particle 8s linear infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
