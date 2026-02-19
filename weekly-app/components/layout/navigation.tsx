'use client'

import React from 'react'

export interface NavItem {
  id: string
  label: string
  path: string
  icon: React.ReactNode
  roles?: string[]
}

export interface NavSection {
  id: string
  label: string
  items: NavItem[]
}

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {children}
  </svg>
)

const icons = {
  dashboard: <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></Icon>,
  clientes: <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2m-10 2v-2m0 0a5 5 0 0110 0M9 7a3 3 0 116 0 3 3 0 01-6 0z" /></Icon>,
  vendedores: <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></Icon>,
  rutas: <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></Icon>,
  creditos: <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></Icon>,
  pagos: <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></Icon>,
  productos: <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></Icon>,
  categorias: <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a2 2 0 011.414.586l5 5a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-5-5A2 2 0 013 12V7a4 4 0 014-4z" /></Icon>,
  inventario: <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" /></Icon>,
  tipoMovimiento: <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></Icon>,
  reportes: <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></Icon>,
  users: <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4a4 4 0 100 8 4 4 0 000-8zm0 10c-3.314 0-6 2.239-6 5v1h12v-1c0-2.761-2.686-5-6-5z" /></Icon>,
  configuracion: <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317a1 1 0 011.35-.936l.65.26a1 1 0 00.75 0l.65-.26a1 1 0 011.35.936l.068.695a1 1 0 00.5.79l.603.348a1 1 0 01.366 1.366l-.348.603a1 1 0 000 1l.348.603a1 1 0 01-.366 1.366l-.603.348a1 1 0 00-.5.79l-.068.695a1 1 0 01-1.35.936l-.65-.26a1 1 0 00-.75 0l-.65.26a1 1 0 01-1.35-.936l-.068-.695a1 1 0 00-.5-.79l-.603-.348a1 1 0 01-.366-1.366l.348-.603a1 1 0 000-1l-.348-.603a1 1 0 01.366-1.366l.603-.348a1 1 0 00.5-.79l.068-.695z" /></Icon>,
  perfil: <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></Icon>
}

const hasAccess = (userRoles: string[], itemRoles?: string[]) => {
  if (!itemRoles || itemRoles.length === 0) return true
  return itemRoles.some((required) => userRoles.some((ur) => ur.includes(required.toUpperCase())))
}

export const buildNavigation = (roles: string[]): NavSection[] => {
  const sections: NavSection[] = [
    {
      id: 'principal',
      label: 'Principal',
      items: [
        { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: icons.dashboard },
        { id: 'reportes', label: 'Reportes', path: '/dashboard/reportes', icon: icons.reportes, roles: ['ADMIN', 'SUPERVISOR'] }
      ]
    },
    {
      id: 'comercial',
      label: 'Comercial',
      items: [
        { id: 'clientes', label: 'Clientes', path: '/dashboard/clientes', icon: icons.clientes },
        { id: 'creditos', label: 'Créditos', path: '/dashboard/creditos', icon: icons.creditos },
        { id: 'pagos', label: 'Pagos', path: '/dashboard/pagos', icon: icons.pagos },
        { id: 'vendedores', label: 'Vendedores', path: '/dashboard/vendedores', icon: icons.vendedores },
        { id: 'rutas', label: 'Rutas', path: '/dashboard/rutas', icon: icons.rutas }
      ]
    },
    {
      id: 'inventario',
      label: 'Inventario',
      items: [
        { id: 'productos', label: 'Productos', path: '/dashboard/productos', icon: icons.productos },
        { id: 'categorias', label: 'Categorías', path: '/dashboard/categorias', icon: icons.categorias },
        { id: 'inventario-main', label: 'Control de Inventario', path: '/dashboard/inventario', icon: icons.inventario },
        { id: 'tipo-movimiento', label: 'Tipos de Movimiento', path: '/dashboard/tipos-movimiento', icon: icons.tipoMovimiento }
      ]
    },
    {
      id: 'administracion',
      label: 'Administración',
      items: [
        { id: 'usuarios', label: 'Usuarios', path: '/dashboard/usuarios', icon: icons.users, roles: ['ADMIN'] },
        { id: 'configuracion', label: 'Configuración', path: '/dashboard/configuracion', icon: icons.configuracion, roles: ['ADMIN'] },
        { id: 'perfil', label: 'Mi Perfil', path: '/dashboard/perfil', icon: icons.perfil }
      ]
    }
  ]

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasAccess(roles, item.roles))
    }))
    .filter((section) => section.items.length > 0)
}

