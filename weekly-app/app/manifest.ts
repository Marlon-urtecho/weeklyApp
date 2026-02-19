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
        src: '/logoAr.jpeg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'any'
      },
      {
        src: '/logoAr.jpeg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any maskable'
      }
    ]
  }
}
