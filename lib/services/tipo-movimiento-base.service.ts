type TipoBaseConfig = {
  factor: number
  descripcion: string
}

const TIPOS_BASE: Record<string, TipoBaseConfig> = {
  ENTRADA: {
    factor: 1,
    descripcion: 'Entrada general a inventario'
  },
  SALIDA: {
    factor: -1,
    descripcion: 'Salida general de inventario'
  },
  AJUSTE: {
    factor: 0,
    descripcion: 'Ajuste administrativo de inventario'
  },
  TRANSFERENCIA: {
    factor: 0,
    descripcion: 'Transferencia entre ubicaciones'
  },
  DEVOLUCION: {
    factor: 1,
    descripcion: 'Devolucion de producto a inventario'
  }
}

const normalizarNombre = (nombre: string) =>
  (nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()

export async function ensureTipoMovimientoBase(tx: any, nombre: string) {
  const nombreNormalizado = normalizarNombre(nombre)

  const existente = await tx.tipo_movimiento.findFirst({
    where: {
      nombre_tipo: {
        equals: nombreNormalizado,
        mode: 'insensitive'
      }
    }
  })
  if (existente) return existente

  const base = TIPOS_BASE[nombreNormalizado] || {
    factor: 0,
    descripcion: `Tipo base autogenerado: ${nombreNormalizado}`
  }

  try {
    return await tx.tipo_movimiento.create({
      data: {
        nombre_tipo: nombreNormalizado,
        factor: base.factor,
        descripcion: base.descripcion
      }
    })
  } catch {
    return tx.tipo_movimiento.findFirst({
      where: {
        nombre_tipo: {
          equals: nombreNormalizado,
          mode: 'insensitive'
        }
      }
    })
  }
}

export async function ensureTiposMovimientoBase(tx: any) {
  const names = Object.keys(TIPOS_BASE)
  const ensured = await Promise.all(names.map((name) => ensureTipoMovimientoBase(tx, name)))
  return ensured.filter(Boolean)
}
