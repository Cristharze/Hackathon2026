import { NextResponse } from 'next/server'
import { sbGet } from '@/lib/supabase-server'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const COLORS = ['#1e9070','#43b349','#0284c7','#d97706','#7c3aed','#dc2626','#0891b2','#ea580c']

function mesKey(fecha: string): string {
  const [y, m] = fecha.split('-')
  return `${MESES[parseInt(m) - 1]} ${y}`
}

function rangoMeses(desde: Date, hasta: Date): string[] {
  const result: string[] = []
  const cur = new Date(desde.getFullYear(), desde.getMonth(), 1)
  const end = new Date(hasta.getFullYear(), hasta.getMonth(), 1)
  while (cur <= end) {
    result.push(`${MESES[cur.getMonth()]} ${cur.getFullYear()}`)
    cur.setMonth(cur.getMonth() + 1)
  }
  return result
}

export async function GET() {
  try {
    // 1. Recolecciones aprobadas con empresa
    const recolecciones = await sbGet<{
      id: string
      empresa_id: string | null
      empresa_nombre_raw: string | null
      fecha_recoleccion: string
      empresas: { nombre: string } | null
    }>('recolecciones', 'estado=eq.APROBADO&select=id,empresa_id,empresa_nombre_raw,fecha_recoleccion,empresas(nombre)')

    if (recolecciones.length === 0) {
      return NextResponse.json({
        monthly: [], monthly_por_empresa: [], materiales: [],
        empresas: [], empresas_keys: [], empresas_colores: {}, total_kg: 0,
      })
    }

    // 2. Detalles de materiales
    const ids = recolecciones.map(r => r.id)
    let detalles: { cantidad: number; recoleccion_id: string; materiales: { nombre: string; color_hex: string } | null }[] = []
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100)
      const rows = await sbGet<{ cantidad: number; recoleccion_id: string; materiales: { nombre: string; color_hex: string } | null }>(
        'detalle_recoleccion',
        `recoleccion_id=in.(${chunk.join(',')})&select=cantidad,recoleccion_id,materiales(nombre,color_hex)`
      )
      detalles.push(...rows)
    }

    // 3. Mapa: recoleccion_id → {kg, empresa, fecha}
    const recMap = new Map(recolecciones.map(r => [r.id, r]))
    const detallesPorRec = new Map<string, number>()
    for (const d of detalles) {
      detallesPorRec.set(d.recoleccion_id, (detallesPorRec.get(d.recoleccion_id) || 0) + Number(d.cantidad || 0))
    }

    // 4. Acumulados por mes y por empresa
    const monthly = new Map<string, number>()
    const monthlyEmpresa = new Map<string, Map<string, number>>()
    const porEmpresa = new Map<string, { nombre: string; kg: number; colorIdx: number }>()
    const porMaterial = new Map<string, { kg: number; color: string }>()
    let colorIdx = 0

    for (const rec of recolecciones) {
      const kg    = detallesPorRec.get(rec.id) || 0
      const mes   = mesKey(rec.fecha_recoleccion)
      // Si no tiene empresa_id registrada → agrupar como "Externos"
      const empNombre = rec.empresa_id
        ? (rec.empresas?.nombre || 'Empresa desconocida')
        : 'Externos'
      const empKey = rec.empresa_id || 'externos'

      monthly.set(mes, (monthly.get(mes) || 0) + kg)

      if (!monthlyEmpresa.has(mes)) monthlyEmpresa.set(mes, new Map())
      monthlyEmpresa.get(mes)!.set(empNombre, (monthlyEmpresa.get(mes)!.get(empNombre) || 0) + kg)

      if (!porEmpresa.has(empKey)) {
        porEmpresa.set(empKey, { nombre: empNombre, kg: 0, colorIdx: colorIdx++ })
      }
      porEmpresa.get(empKey)!.kg += kg
    }

    for (const d of detalles) {
      const mat = d.materiales
      if (!mat) continue
      const entry = porMaterial.get(mat.nombre)
      if (entry) entry.kg += Number(d.cantidad || 0)
      else porMaterial.set(mat.nombre, { kg: Number(d.cantidad || 0), color: mat.color_hex || '#9ca3af' })
    }

    // 5. Rango de meses desde el primero con datos hasta hoy
    const fechas = recolecciones.map(r => new Date(r.fecha_recoleccion)).filter(d => !isNaN(d.getTime()))
    const minFecha = fechas.length > 0 ? new Date(Math.min(...fechas.map(d => d.getTime()))) : new Date()
    const meses = rangoMeses(minFecha, new Date())

    const monthlySeries = meses.map(m => ({ mes: m, kg: Math.round((monthly.get(m) || 0) * 10) / 10 }))

    const empresasKeys = [...new Set(recolecciones.map(r => r.empresas?.nombre || r.empresa_nombre_raw || 'Sin empresa'))]
    const empresasColores: Record<string, string> = {}
    empresasKeys.forEach((e, i) => { empresasColores[e] = COLORS[i % COLORS.length] })

    const monthlyPorEmpresa = meses.map(m => {
      const entry: Record<string, number | string> = { mes: m, total: Math.round((monthly.get(m) || 0) * 10) / 10 }
      empresasKeys.forEach(e => { entry[e] = Math.round((monthlyEmpresa.get(m)?.get(e) || 0) * 10) / 10 })
      return entry
    })

    const materialesList = [...porMaterial.entries()]
      .map(([nombre, { kg, color }]) => ({ nombre, kg: Math.round(kg * 10) / 10, color }))
      .sort((a, b) => b.kg - a.kg)

    const empresasList = [...porEmpresa.values()]
      .map(e => ({ nombre: e.nombre, kg: Math.round(e.kg * 10) / 10, color: COLORS[e.colorIdx % COLORS.length] }))
      .sort((a, b) => b.kg - a.kg)

    const totalKg = materialesList.reduce((s, m) => s + m.kg, 0)

    // ── Impacto ambiental real usando factores de la BD ─────────────────────
    // Traer factores de materiales
    const matFactores = await sbGet<{
      nombre: string; factor_co2: number; factor_agua: number
      factor_energia: number; factor_arboles: number
    }>('materiales', 'select=nombre,factor_co2,factor_agua,factor_energia,factor_arboles')
    const factMap = new Map(matFactores.map(m => [m.nombre, m]))

    let totalCo2 = 0, totalAgua = 0, totalEnergia = 0, totalArboles = 0
    for (const mat of materialesList) {
      const f = factMap.get(mat.nombre)
      if (f) {
        totalCo2     += mat.kg * (f.factor_co2     ?? 1.0)
        totalAgua    += mat.kg * (f.factor_agua    ?? 10.0)
        totalEnergia += mat.kg * (f.factor_energia ?? 4.0)
        totalArboles += mat.kg * (f.factor_arboles ?? 0.01)
      }
    }

    return NextResponse.json({
      monthly:             monthlySeries,
      monthly_por_empresa: monthlyPorEmpresa,
      materiales:          materialesList,
      empresas:            empresasList,
      empresas_keys:       empresasKeys,
      empresas_colores:    empresasColores,
      total_kg:            Math.round(totalKg    * 10) / 10,
      total_co2:           Math.round(totalCo2   * 10) / 10,
      total_agua:          Math.round(totalAgua  * 10) / 10,
      total_energia:       Math.round(totalEnergia * 10) / 10,
      total_arboles:       Math.round(totalArboles * 100) / 100,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
