import { NextResponse } from 'next/server'
import { sbGet } from '@/lib/supabase-server'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // ── 1. Empresa ─────────────────────────────────────────────────────────
    const empresaRows = await sbGet<{
      id: string; nombre: string; sector: string | null
      ciudad: string | null; email: string | null; activa: boolean
    }>('empresas', `id=eq.${id}&limit=1`)
    if (!empresaRows.length) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    // ── 2. Recolecciones aprobadas ──────────────────────────────────────────
    const recolecciones = await sbGet<{ id: string; fecha_recoleccion: string }>(
      'recolecciones',
      `empresa_id=eq.${id}&estado=eq.APROBADO&select=id,fecha_recoleccion&order=fecha_recoleccion.asc`
    )

    if (recolecciones.length === 0) {
      return NextResponse.json({
        empresa: empresaRows[0],
        metricas: [], impacto: { co2: 0, agua: 0, energia: 0, arboles: 0 },
        materiales_top: [],
      })
    }

    // ── 3. Detalles con factores de impacto ─────────────────────────────────
    const ids = recolecciones.map(r => r.id)
    let detalles: {
      cantidad: number
      recoleccion_id: string
      materiales: {
        nombre: string; color_hex: string
        factor_co2: number; factor_agua: number
        factor_energia: number; factor_arboles: number
      } | null
    }[] = []

    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100)
      const rows = await sbGet<typeof detalles[number]>(
        'detalle_recoleccion',
        `recoleccion_id=in.(${chunk.join(',')})` +
        `&select=cantidad,recoleccion_id,materiales(nombre,color_hex,factor_co2,factor_agua,factor_energia,factor_arboles)`
      )
      detalles.push(...rows)
    }

    // ── 4. Mapa recoleccion → fecha ─────────────────────────────────────────
    const recFecha = new Map(recolecciones.map(r => [r.id, r.fecha_recoleccion]))

    // ── 5. Acumular por mes y por material ──────────────────────────────────
    type MonthData = {
      kg: number; co2: number; agua: number; energia: number
      arboles: number; rec: Set<string>
      materiales: Record<string, number>
    }
    const monthly = new Map<string, MonthData>()
    const porMaterial = new Map<string, { nombre: string; kg: number; color: string }>()
    let totalCo2 = 0, totalAgua = 0, totalEnergia = 0, totalArboles = 0

    for (const d of detalles) {
      const fecha  = recFecha.get(d.recoleccion_id)
      if (!fecha) continue
      const [y, m] = fecha.split('-').map(Number)
      const key    = `${y}-${String(m).padStart(2,'0')}`
      const mat    = d.materiales
      const kg     = Number(d.cantidad || 0)

      // Factores de impacto (con defaults razonables si son null)
      const fCo2    = mat?.factor_co2     ?? 1.0
      const fAgua   = mat?.factor_agua    ?? 10.0
      const fEn     = mat?.factor_energia ?? 4.0
      const fArb    = mat?.factor_arboles ?? 0.01

      const co2  = kg * fCo2
      const agua = kg * fAgua
      const en   = kg * fEn
      const arb  = kg * fArb

      // Acumular totales globales
      totalCo2    += co2
      totalAgua   += agua
      totalEnergia += en
      totalArboles += arb

      // Por mes
      if (!monthly.has(key)) {
        monthly.set(key, { kg: 0, co2: 0, agua: 0, energia: 0, arboles: 0, rec: new Set(), materiales: {} })
      }
      const entry = monthly.get(key)!
      entry.kg      += kg
      entry.co2     += co2
      entry.agua    += agua
      entry.energia += en
      entry.arboles += arb
      entry.rec.add(d.recoleccion_id)
      const matNombre = mat?.nombre ?? 'Otro'
      entry.materiales[matNombre] = (entry.materiales[matNombre] || 0) + kg

      // Por material (global)
      if (!porMaterial.has(matNombre)) {
        porMaterial.set(matNombre, { nombre: matNombre, kg: 0, color: mat?.color_hex ?? '#9ca3af' })
      }
      porMaterial.get(matNombre)!.kg += kg
    }

    // ── 6. Construir array de metricas mensuales ───────────────────────────
    const metricas = [...monthly.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => {
        const [anio, mesIdx] = key.split('-').map(Number)
        return {
          id:                `${id}_${key}`,
          empresa_id:        id,
          anio,
          mes:               mesIdx,
          mes_label:         `${MESES[mesIdx-1]} ${anio}`,
          total_kg:          Math.round(v.kg * 10) / 10,
          co2_ahorrado:      Math.round(v.co2 * 100) / 100,
          agua_ahorrada:     Math.round(v.agua * 10) / 10,
          energia_ahorrada:  Math.round(v.energia * 10) / 10,
          arboles_eq:        Math.round(v.arboles * 100) / 100,
          num_recolecciones: v.rec.size,
          desglose_materiales: Object.fromEntries(
            Object.entries(v.materiales).map(([k, val]) => [k, Math.round(val * 10) / 10])
          ),
        }
      })

    // ── 7. Top materiales ──────────────────────────────────────────────────
    const materialesTop = [...porMaterial.values()]
      .map(m => ({ ...m, kg: Math.round(m.kg * 10) / 10 }))
      .sort((a, b) => b.kg - a.kg)
      .slice(0, 6)

    return NextResponse.json({
      empresa: empresaRows[0],
      metricas,
      impacto: {
        co2:     Math.round(totalCo2 * 100) / 100,
        agua:    Math.round(totalAgua * 10) / 10,
        energia: Math.round(totalEnergia * 10) / 10,
        arboles: Math.round(totalArboles * 100) / 100,
      },
      materiales_top: materialesTop,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
