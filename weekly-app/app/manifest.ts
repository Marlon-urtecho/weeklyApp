import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Weekly App',
    short_name: 'Weekly',
    description: 'Gestión de créditos, pagos, inventario y rutas.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0b1220',
    theme_color: '#06b6d4',
    orientation: 'portrait',
    lang: 'es-GT',
    icons: [
      {
        src: '/pwa/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/pwa/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    screenshots: [
      {
        src: '/pwa/screenshot-mobile.png',
        sizes: '720x1280',
        type: 'image/png'
      },
      {
        src: '/pwa/screenshot-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide'
      }
    ]
  }
}
