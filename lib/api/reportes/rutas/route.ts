import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '../../../middleware/auth.middleware'
import prisma from '../../../db'

type AuthUser = {
  id: number
  roles?: string[]
}

type ProductoResumen = {
  id_producto: number
  nombre: string
  unidades: number
  monto: number
  porcentaje_unidades: number
}

type RutaIndicador = {
  id_ruta: number
  codigo_ruta: string
  nombre_ruta: string
  zona: string | null
  vendedores: string[]
  total_clientes: number
  clientes_con_credito: number
  total_creditos: number
  unidades_distribuidas: number
  monto_distribuido: number
  recaudacion_periodo: number
  ticket_promedio_credito: number
  cobertura_clientes_pct: number
  indice_mora_pct: number
  tasa_recuperacion_pct: number
  top_productos: ProductoResumen[]
  versus: {
    clientes_pct: number
    creditos_pct: number
    monto_distribuido_pct: number
    recaudacion_pct: number
    mora_pct: number
  }
  score: number
  ranking: number
}

const normalizeRoles = (roles?: string[]) => (roles || []).map((r) => (r || '').toUpperCase())
const isPrivilegedRole = (roles: string[]) =>
  roles.some((r) => r.includes('ADMIN') || r.includes('SUPERVISOR'))
const isSellerRole = (roles: string[]) => roles.some((r) => r.includes('VENDEDOR'))

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (value && typeof value === 'object' && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
    try {
      return (value as any).toNumber()
    } catch {
      return 0
    }
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const pct = (numerador: number, denominador: number): number => {
  if (!denominador) return 0
  return (numerador / denominador) * 100
}

const pctDiff = (value: number, average: number): number => {
  if (!average) return value ? 100 : 0
  return ((value - average) / average) * 100
}

async function getSellerRouteIds(idUsuario: number): Promise<number[]> {
  const vendedor = await prisma.vendedores.findUnique({
    where: { id_usuario: idUsuario },
    include: {
      ruta_vendedor: {
        where: { activo: true },
        select: { id_ruta: true }
      }
    }
  })

  if (!vendedor) return []
  return vendedor.ruta_vendedor.map((rv) => rv.id_ruta)
}

const inRange = (date: Date, inicio?: Date, fin?: Date) => {
  const time = date.getTime()
  const validFrom = inicio ? time >= inicio.getTime() : true
  const validTo = fin ? time <= fin.getTime() : true
  return validFrom && validTo
}

const overlapsRange = (
  start: Date,
  end: Date,
  inicio?: Date,
  fin?: Date
) => {
  const rangeStart = inicio?.getTime() ?? Number.NEGATIVE_INFINITY
  const rangeEnd = fin?.getTime() ?? Number.POSITIVE_INFINITY
  const startTime = start.getTime()
  const endTime = end.getTime()
  return startTime <= rangeEnd && endTime >= rangeStart
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth
    const authUser = auth as AuthUser

    const roles = normalizeRoles(authUser.roles)
    const privileged = isPrivilegedRole(roles)
    const seller = isSellerRole(roles)

    if (!privileged && !seller) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const inicioParam = searchParams.get('inicio')
    const finParam = searchParams.get('fin')

    const inicio = inicioParam ? new Date(`${inicioParam}T00:00:00`) : undefined
    const fin = finParam ? new Date(`${finParam}T23:59:59.999`) : undefined

    if ((inicioParam && Number.isNaN(inicio?.getTime())) || (finParam && Number.isNaN(fin?.getTime()))) {
      return NextResponse.json({ error: 'Rango de fechas inválido' }, { status: 400 })
    }

    let rutas = await prisma.rutas.findMany({
      where: { activo: true },
      include: {
        ruta_vendedor: {
          where: { activo: true },
          include: {
            vendedores: true
          }
        },
        clientes: {
          where: { activo: true },
          include: {
            creditos: {
              where: {
                estado: {
                  not: 'CANCELADO'
                }
              },
              include: {
                credito_detalle: {
                  include: {
                    productos: true
                  }
                },
                pagos: {
                  include: {
                    pago_detalle_producto: {
                      include: {
                        productos: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        id_ruta: 'asc'
      }
    })

    if (!privileged && seller) {
      const allowedRouteIds = await getSellerRouteIds(Number(authUser.id))
      rutas = rutas.filter((ruta) => allowedRouteIds.includes(ruta.id_ruta))
    }

    const indicadores: RutaIndicador[] = rutas.map((ruta) => {
      const clientes = ruta.clientes || []
      const totalClientes = clientes.length

      const allCreditos = clientes.flatMap((c) => c.creditos || [])
      const creditosVigentesPeriodo = allCreditos.filter((credito) =>
        overlapsRange(credito.fecha_inicio, credito.fecha_vencimiento, inicio, fin)
      )

      const clientesConCredito = new Set<number>()
      let montoDistribuido = 0
      let unidadesDistribuidas = 0
      let saldoPendiente = 0

      const productoMap = new Map<number, { nombre: string; unidades: number; monto: number }>()

      for (const credito of creditosVigentesPeriodo) {
        clientesConCredito.add(credito.id_cliente)
        saldoPendiente += toNumber(credito.saldo_pendiente)

        for (const detalle of credito.credito_detalle || []) {
          const unidades = Number(detalle.cantidad || 0)
          const subtotal = toNumber(detalle.subtotal)
          unidadesDistribuidas += unidades
          montoDistribuido += subtotal

          const current = productoMap.get(detalle.id_producto) || {
            nombre: detalle.productos?.nombre || `Producto ${detalle.id_producto}`,
            unidades: 0,
            monto: 0
          }

          current.unidades += unidades
          current.monto += subtotal
          productoMap.set(detalle.id_producto, current)
        }
      }

      const pagosPeriodo = allCreditos.flatMap((credito) =>
        (credito.pagos || []).filter((pago) => inRange(pago.fecha_pago, inicio, fin))
      )

      const recaudacionPeriodo = pagosPeriodo.reduce(
        (sum, pago) => sum + toNumber(pago.monto_pagado),
        0
      )

      const totalCreditos = creditosVigentesPeriodo.length
      const ticketPromedioCredito = totalCreditos > 0 ? montoDistribuido / totalCreditos : 0
      const coberturaClientesPct = pct(clientesConCredito.size, totalClientes)
      const indiceMoraPct = pct(saldoPendiente, montoDistribuido)
      const tasaRecuperacionPct = pct(recaudacionPeriodo, montoDistribuido)

      const topProductos = Array.from(productoMap.entries())
        .map(([id_producto, data]) => ({
          id_producto,
          nombre: data.nombre,
          unidades: data.unidades,
          monto: data.monto,
          porcentaje_unidades: pct(data.unidades, unidadesDistribuidas)
        }))
        .sort((a, b) => b.unidades - a.unidades)
        .slice(0, 5)

      return {
        id_ruta: ruta.id_ruta,
        codigo_ruta: ruta.codigo_ruta,
        nombre_ruta: ruta.nombre_ruta,
        zona: ruta.zona,
        vendedores: (ruta.ruta_vendedor || []).map((rv) => rv.vendedores?.nombre).filter(Boolean) as string[],
        total_clientes: totalClientes,
        clientes_con_credito: clientesConCredito.size,
        total_creditos: totalCreditos,
        unidades_distribuidas: unidadesDistribuidas,
        monto_distribuido: montoDistribuido,
        recaudacion_periodo: recaudacionPeriodo,
        ticket_promedio_credito: ticketPromedioCredito,
        cobertura_clientes_pct: coberturaClientesPct,
        indice_mora_pct: indiceMoraPct,
        tasa_recuperacion_pct: tasaRecuperacionPct,
        top_productos: topProductos,
        versus: {
          clientes_pct: 0,
          creditos_pct: 0,
          monto_distribuido_pct: 0,
          recaudacion_pct: 0,
          mora_pct: 0
        },
        score: 0,
        ranking: 0
      }
    })

    const totalRutas = indicadores.length
    const avgClientes = totalRutas ? indicadores.reduce((s, r) => s + r.total_clientes, 0) / totalRutas : 0
    const avgCreditos = totalRutas ? indicadores.reduce((s, r) => s + r.total_creditos, 0) / totalRutas : 0
    const avgMonto = totalRutas ? indicadores.reduce((s, r) => s + r.monto_distribuido, 0) / totalRutas : 0
    const avgRecaudacion = totalRutas ? indicadores.reduce((s, r) => s + r.recaudacion_periodo, 0) / totalRutas : 0
    const avgMora = totalRutas ? indicadores.reduce((s, r) => s + r.indice_mora_pct, 0) / totalRutas : 0
    const avgCobertura = totalRutas ? indicadores.reduce((s, r) => s + r.cobertura_clientes_pct, 0) / totalRutas : 0
    const avgUnidades = totalRutas ? indicadores.reduce((s, r) => s + r.unidades_distribuidas, 0) / totalRutas : 0

    const ranked = indicadores
      .map((ruta) => {
        ruta.versus = {
          clientes_pct: pctDiff(ruta.total_clientes, avgClientes),
          creditos_pct: pctDiff(ruta.total_creditos, avgCreditos),
          monto_distribuido_pct: pctDiff(ruta.monto_distribuido, avgMonto),
          recaudacion_pct: pctDiff(ruta.recaudacion_periodo, avgRecaudacion),
          mora_pct: pctDiff(ruta.indice_mora_pct, avgMora)
        }

        const factorRecaudacion = avgRecaudacion ? ruta.recaudacion_periodo / avgRecaudacion : 0
        const factorCobertura = avgCobertura ? ruta.cobertura_clientes_pct / avgCobertura : 0
        const factorUnidades = avgUnidades ? ruta.unidades_distribuidas / avgUnidades : 0
        const factorMora = avgMora ? ruta.indice_mora_pct / avgMora : 0

        ruta.score = factorRecaudacion + factorCobertura + factorUnidades - factorMora
        return ruta
      })
      .sort((a, b) => b.score - a.score)
      .map((ruta, index) => ({
        ...ruta,
        ranking: index + 1
      }))

    const resumen = {
      total_rutas: ranked.length,
      total_clientes: ranked.reduce((s, r) => s + r.total_clientes, 0),
      total_creditos: ranked.reduce((s, r) => s + r.total_creditos, 0),
      total_unidades: ranked.reduce((s, r) => s + r.unidades_distribuidas, 0),
      total_monto_distribuido: ranked.reduce((s, r) => s + r.monto_distribuido, 0),
      total_recaudacion: ranked.reduce((s, r) => s + r.recaudacion_periodo, 0),
      promedio_mora_pct: ranked.length ? ranked.reduce((s, r) => s + r.indice_mora_pct, 0) / ranked.length : 0,
      promedio_cobertura_pct: ranked.length ? ranked.reduce((s, r) => s + r.cobertura_clientes_pct, 0) / ranked.length : 0,
      mejor_ruta: ranked[0]
        ? {
            id_ruta: ranked[0].id_ruta,
            codigo_ruta: ranked[0].codigo_ruta,
            nombre_ruta: ranked[0].nombre_ruta,
            score: ranked[0].score
          }
        : null
    }

    return NextResponse.json({
      rango: {
        inicio: inicioParam,
        fin: finParam
      },
      resumen,
      rutas: ranked
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
