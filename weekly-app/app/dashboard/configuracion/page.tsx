'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import LayoutContainer from '@/components/layout/LayoutContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs, TabPanel } from '@/components/ui/Tabs'
import { useToast } from '@/contexts/ToastContext'
import InstallAppCard from '@/components/pwa/InstallAppCard'
import {
  CONFIG_STORAGE_KEY,
  CONFIG_UPDATED_EVENT,
  DEFAULT_GENERAL,
  DEFAULT_INVENTARIO,
  DEFAULT_NOTIFICACIONES,
  DEFAULT_SEGURIDAD,
  normalizeGeneralConfig,
  type GeneralConfig,
  type InventarioConfig,
  type NotificacionesConfig,
  type SeguridadConfig,
  type ConfigSnapshot
} from '@/lib/system-config'

type ConfigBackup = {
  id: string
  nombre: string
  creadoEn: string
  config: ConfigSnapshot
}

const BACKUPS_STORAGE_KEY = 'weekly_config_backups_v1'

const buildSnapshot = (
  general: GeneralConfig,
  inventario: InventarioConfig,
  notificaciones: NotificacionesConfig,
  seguridad: SeguridadConfig
): ConfigSnapshot => ({
  general,
  inventario,
  notificaciones,
  seguridad
})

const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function ConfiguracionPage() {
  const { showToast } = useToast()
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [generalConfig, setGeneralConfig] = useState<GeneralConfig>(DEFAULT_GENERAL)
  const [inventarioConfig, setInventarioConfig] = useState<InventarioConfig>(DEFAULT_INVENTARIO)
  const [notificacionesConfig, setNotificacionesConfig] = useState<NotificacionesConfig>(DEFAULT_NOTIFICACIONES)
  const [seguridadConfig, setSeguridadConfig] = useState<SeguridadConfig>(DEFAULT_SEGURIDAD)
  const [backups, setBackups] = useState<ConfigBackup[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentSnapshot = useMemo(
    () => buildSnapshot(generalConfig, inventarioConfig, notificacionesConfig, seguridadConfig),
    [generalConfig, inventarioConfig, notificacionesConfig, seguridadConfig]
  )

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY)
      const savedBackups = localStorage.getItem(BACKUPS_STORAGE_KEY)

      if (savedConfig) {
        const parsed = JSON.parse(savedConfig) as Partial<ConfigSnapshot>
        if (parsed.general) setGeneralConfig(normalizeGeneralConfig(parsed.general))
        if (parsed.inventario) setInventarioConfig({ ...DEFAULT_INVENTARIO, ...parsed.inventario })
        if (parsed.notificaciones) {
          setNotificacionesConfig({ ...DEFAULT_NOTIFICACIONES, ...parsed.notificaciones })
        }
        if (parsed.seguridad) setSeguridadConfig({ ...DEFAULT_SEGURIDAD, ...parsed.seguridad })
      }

      if (savedBackups) {
        const parsedBackups = JSON.parse(savedBackups)
        if (Array.isArray(parsedBackups)) {
          setBackups(parsedBackups)
        }
      }
    } catch {
      showToast('No se pudo cargar la configuración guardada', 'error')
    }
  }, [showToast])

  const persistConfig = (snapshot: ConfigSnapshot) => {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(snapshot))
    window.dispatchEvent(new CustomEvent(CONFIG_UPDATED_EVENT, { detail: snapshot }))
  }

  const persistBackups = (nextBackups: ConfigBackup[]) => {
    setBackups(nextBackups)
    localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(nextBackups))
  }

  const handleSave = async (section: 'general' | 'inventario' | 'notificaciones' | 'seguridad') => {
    try {
      setSavingSection(section)
      persistConfig(currentSnapshot)
      showToast(`Configuración de ${section} guardada`, 'success')
    } finally {
      setSavingSection(null)
    }
  }

  const handleResetAll = () => {
    if (!confirm('¿Restablecer configuración a valores por defecto?')) return
    setGeneralConfig(DEFAULT_GENERAL)
    setInventarioConfig(DEFAULT_INVENTARIO)
    setNotificacionesConfig(DEFAULT_NOTIFICACIONES)
    setSeguridadConfig(DEFAULT_SEGURIDAD)
    persistConfig(buildSnapshot(DEFAULT_GENERAL, DEFAULT_INVENTARIO, DEFAULT_NOTIFICACIONES, DEFAULT_SEGURIDAD))
    showToast('Configuración restablecida', 'info')
  }

  const handleCreateBackup = () => {
    const now = new Date()
    const backup: ConfigBackup = {
      id: String(now.getTime()),
      nombre: `config_${now.toISOString().replace(/[:.]/g, '-')}.json`,
      creadoEn: now.toISOString(),
      config: currentSnapshot
    }
    const next = [backup, ...backups].slice(0, 30)
    persistBackups(next)
    showToast('Respaldo creado', 'success')
  }

  const handleDownloadBackup = (backup: ConfigBackup) => {
    downloadJson(backup.nombre, backup.config)
  }

  const handleDownloadCurrent = () => {
    const now = new Date()
    const filename = `config_actual_${now.toISOString().slice(0, 10)}.json`
    downloadJson(filename, currentSnapshot)
    showToast('Archivo de configuración descargado', 'success')
  }

  const applySnapshot = (snapshot: ConfigSnapshot) => {
    const normalizedGeneral = normalizeGeneralConfig(snapshot.general)
    setGeneralConfig(normalizedGeneral)
    setInventarioConfig({ ...DEFAULT_INVENTARIO, ...snapshot.inventario })
    setNotificacionesConfig({ ...DEFAULT_NOTIFICACIONES, ...snapshot.notificaciones })
    setSeguridadConfig({ ...DEFAULT_SEGURIDAD, ...snapshot.seguridad })
    persistConfig({
      general: normalizedGeneral,
      inventario: { ...DEFAULT_INVENTARIO, ...snapshot.inventario },
      notificaciones: { ...DEFAULT_NOTIFICACIONES, ...snapshot.notificaciones },
      seguridad: { ...DEFAULT_SEGURIDAD, ...snapshot.seguridad }
    })
  }

  const handleRestoreBackup = (backup: ConfigBackup) => {
    applySnapshot(backup.config)
    showToast('Respaldo restaurado correctamente', 'success')
  }

  const handleImportBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as ConfigSnapshot
      if (!parsed?.general || !parsed?.inventario || !parsed?.notificaciones || !parsed?.seguridad) {
        throw new Error('Archivo inválido')
      }

      applySnapshot(parsed)
      const backup: ConfigBackup = {
        id: String(Date.now()),
        nombre: `importado_${file.name}`,
        creadoEn: new Date().toISOString(),
        config: parsed
      }
      persistBackups([backup, ...backups].slice(0, 30))
      showToast('Configuración importada correctamente', 'success')
    } catch {
      showToast('No se pudo importar el archivo', 'error')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <LayoutContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Configuración</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Administra los ajustes del sistema y respaldos.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: 'general', label: 'General' },
            { id: 'inventario', label: 'Inventario' },
            { id: 'notificaciones', label: 'Notificaciones' },
            { id: 'seguridad', label: 'Seguridad' },
            { id: 'app-movil', label: 'App móvil' },
            { id: 'backup', label: 'Backup' }
          ]}
          defaultTab="general"
          variant="pills"
        >
          <TabPanel tabId="general">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información de la Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nombre de la Empresa" value={generalConfig.nombreEmpresa} onChange={(e) => setGeneralConfig({ ...generalConfig, nombreEmpresa: e.target.value })} />
                <Input label="Número RUC" value={generalConfig.numeroRuc} onChange={(e) => setGeneralConfig({ ...generalConfig, numeroRuc: e.target.value })} />
                <Input label="Dirección" value={generalConfig.direccion} onChange={(e) => setGeneralConfig({ ...generalConfig, direccion: e.target.value })} />
                <Input label="Teléfono" value={generalConfig.telefono} onChange={(e) => setGeneralConfig({ ...generalConfig, telefono: e.target.value })} />
                <Input label="Email" type="email" value={generalConfig.email} onChange={(e) => setGeneralConfig({ ...generalConfig, email: e.target.value })} />
                <Input label="Sitio Web" value={generalConfig.sitioWeb} onChange={(e) => setGeneralConfig({ ...generalConfig, sitioWeb: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => handleSave('general')} loading={savingSection === 'general'}>Guardar Cambios</Button>
                <Button variant="secondary" onClick={handleResetAll}>Restablecer</Button>
              </div>
            </Card>
          </TabPanel>

          <TabPanel tabId="inventario">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuración de Inventario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Alerta de Stock Bajo (unidades)"
                  type="number"
                  value={inventarioConfig.alertaStockBajo}
                  onChange={(e) => setInventarioConfig({ ...inventarioConfig, alertaStockBajo: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Control por Lotes</label>
                  <select
                    value={inventarioConfig.controlLotes}
                    onChange={(e) => setInventarioConfig({ ...inventarioConfig, controlLotes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notificar Stock Bajo</label>
                  <select
                    value={inventarioConfig.notificarStockBajo}
                    onChange={(e) => setInventarioConfig({ ...inventarioConfig, notificarStockBajo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => handleSave('inventario')} loading={savingSection === 'inventario'}>Guardar Cambios</Button>
                <Button variant="secondary" onClick={handleResetAll}>Restablecer</Button>
              </div>
            </Card>
          </TabPanel>

          <TabPanel tabId="notificaciones">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuración de Notificaciones</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Notificaciones por Email</span>
                  <select value={notificacionesConfig.emailNotificaciones} onChange={(e) => setNotificacionesConfig({ ...notificacionesConfig, emailNotificaciones: e.target.value })} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm">
                    <option value="true">Activado</option>
                    <option value="false">Desactivado</option>
                  </select>
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Alertas de Créditos Vencidos</span>
                  <select value={notificacionesConfig.notificarCreditosVencidos} onChange={(e) => setNotificacionesConfig({ ...notificacionesConfig, notificarCreditosVencidos: e.target.value })} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm">
                    <option value="true">Activado</option>
                    <option value="false">Desactivado</option>
                  </select>
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Alertas de Stock Bajo</span>
                  <select value={notificacionesConfig.notificarStockBajo} onChange={(e) => setNotificacionesConfig({ ...notificacionesConfig, notificarStockBajo: e.target.value })} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm">
                    <option value="true">Activado</option>
                    <option value="false">Desactivado</option>
                  </select>
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Notificaciones de Pagos</span>
                  <select value={notificacionesConfig.notificarPagos} onChange={(e) => setNotificacionesConfig({ ...notificacionesConfig, notificarPagos: e.target.value })} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm">
                    <option value="true">Activado</option>
                    <option value="false">Desactivado</option>
                  </select>
                </label>
              </div>
              <div className="pt-4">
                <Input label="Email para reportes" type="email" value={notificacionesConfig.emailReportes} onChange={(e) => setNotificacionesConfig({ ...notificacionesConfig, emailReportes: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => handleSave('notificaciones')} loading={savingSection === 'notificaciones'}>Guardar Cambios</Button>
                <Button variant="secondary" onClick={handleResetAll}>Restablecer</Button>
              </div>
            </Card>
          </TabPanel>

          <TabPanel tabId="seguridad">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuración de Seguridad</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Intentos máximos de login" type="number" value={seguridadConfig.intentosLogin} onChange={(e) => setSeguridadConfig({ ...seguridadConfig, intentosLogin: e.target.value })} />
                <Input label="Tiempo de bloqueo (minutos)" type="number" value={seguridadConfig.tiempoBloqueo} onChange={(e) => setSeguridadConfig({ ...seguridadConfig, tiempoBloqueo: e.target.value })} />
                <Input label="Timeout de sesión (minutos)" type="number" value={seguridadConfig.sesionTimeout} onChange={(e) => setSeguridadConfig({ ...seguridadConfig, sesionTimeout: e.target.value })} />
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mt-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Importante:</strong> Estos parámetros quedan guardados y listos para aplicar en futuras políticas del sistema.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => handleSave('seguridad')} loading={savingSection === 'seguridad'}>Guardar Cambios</Button>
                <Button variant="secondary" onClick={handleResetAll}>Restablecer</Button>
              </div>
            </Card>
          </TabPanel>

          <TabPanel tabId="app-movil">
            <div className="space-y-4">
              <InstallAppCard />
              <Card>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Recomendaciones de instalación</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>Usa conexión segura (`https`) o `localhost` para permitir la instalación.</li>
                  <li>En iOS usa Share {'>'} Add to Home Screen.</li>
                  <li>En Android usa Chrome y pulsa el botón Instalar cuando aparezca.</li>
                </ul>
              </Card>
            </div>
          </TabPanel>

          <TabPanel tabId="backup">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Respaldo de Configuración</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="success" onClick={handleCreateBackup} className="h-20">Crear Respaldo</Button>
                <Button variant="primary" onClick={handleDownloadCurrent} className="h-20">Descargar Config Actual</Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="h-20">Importar Config</Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImportBackup}
              />

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Respaldos guardados</h4>
                {backups.length === 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-500 dark:text-gray-400">
                    No hay respaldos guardados todavía.
                  </div>
                )}
                <div className="space-y-2">
                  {backups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{backup.nombre}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(backup.creadoEn).toLocaleString('es-GT')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleRestoreBackup(backup)}>Restaurar</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleDownloadBackup(backup)}>Descargar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabPanel>
        </Tabs>
      </div>
    </LayoutContainer>
  )
}
