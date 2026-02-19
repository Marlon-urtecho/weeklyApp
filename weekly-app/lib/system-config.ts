export const CONFIG_STORAGE_KEY = 'weekly_config_v1'
export const CONFIG_UPDATED_EVENT = 'weekly-config-updated'

export type GeneralConfig = {
  nombreEmpresa: string
  numeroRuc: string
  direccion: string
  telefono: string
  email: string
  sitioWeb: string
}

export type InventarioConfig = {
  alertaStockBajo: string
  controlLotes: string
  notificarStockBajo: string
}

export type NotificacionesConfig = {
  emailNotificaciones: string
  notificarCreditosVencidos: string
  notificarStockBajo: string
  notificarPagos: string
  emailReportes: string
}

export type SeguridadConfig = {
  intentosLogin: string
  tiempoBloqueo: string
  sesionTimeout: string
}

export type ConfigSnapshot = {
  general: GeneralConfig
  inventario: InventarioConfig
  notificaciones: NotificacionesConfig
  seguridad: SeguridadConfig
}

export const DEFAULT_GENERAL: GeneralConfig = {
  nombreEmpresa: 'Weekly',
  numeroRuc: '00000000-0',
  direccion: 'Ciudad de Guatemala',
  telefono: '0000-0000',
  email: 'info@weekly.app',
  sitioWeb: 'https://weekly.app'
}

export const DEFAULT_INVENTARIO: InventarioConfig = {
  alertaStockBajo: '10',
  controlLotes: 'false',
  notificarStockBajo: 'true'
}

export const DEFAULT_NOTIFICACIONES: NotificacionesConfig = {
  emailNotificaciones: 'true',
  notificarCreditosVencidos: 'true',
  notificarStockBajo: 'true',
  notificarPagos: 'true',
  emailReportes: 'admin@weekly.app'
}

export const DEFAULT_SEGURIDAD: SeguridadConfig = {
  intentosLogin: '3',
  tiempoBloqueo: '30',
  sesionTimeout: '60'
}

export const DEFAULT_CONFIG: ConfigSnapshot = {
  general: DEFAULT_GENERAL,
  inventario: DEFAULT_INVENTARIO,
  notificaciones: DEFAULT_NOTIFICACIONES,
  seguridad: DEFAULT_SEGURIDAD
}

export const normalizeGeneralConfig = (raw: any): GeneralConfig => ({
  ...DEFAULT_GENERAL,
  ...(raw || {}),
  numeroRuc: String(raw?.numeroRuc ?? raw?.nit ?? DEFAULT_GENERAL.numeroRuc)
})

export const getStoredConfig = (): ConfigSnapshot => {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    const parsed = JSON.parse(raw) as Partial<ConfigSnapshot>
    return {
      general: normalizeGeneralConfig(parsed.general),
      inventario: { ...DEFAULT_INVENTARIO, ...(parsed.inventario || {}) },
      notificaciones: { ...DEFAULT_NOTIFICACIONES, ...(parsed.notificaciones || {}) },
      seguridad: { ...DEFAULT_SEGURIDAD, ...(parsed.seguridad || {}) }
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

export const toBool = (value: string | boolean | undefined): boolean =>
  String(value).toLowerCase() === 'true'

export const getStockLowThreshold = (config: ConfigSnapshot): number => {
  const parsed = Number(config.inventario.alertaStockBajo)
  if (!Number.isFinite(parsed) || parsed <= 0) return 10
  return Math.floor(parsed)
}
