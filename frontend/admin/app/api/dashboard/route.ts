import { NextResponse } from 'next/server'
import { sbGet } from '@/lib/supabase-server'

const CO2_FACTOR = 2.5  // kg CO₂ por kg reciclado (factor estándar)

export async function GET() {
  try {
    // ── 1. Todos los detalles de recolecciones APROBADAS ────────────────
    // Obtenemos las recolecciones aprobadas primero para filtrar correctamente
    const recAprobadas = await sbGet<{
      id: string
      empresa_id: string | null
      empresa_nombre_raw: string | null
      fecha_recoleccion: string
      estado: string
      empresas: { nombre: string } | null
    }>(
      'recolecciones',
      'estado=eq.APROBADO&select=id,empresa_id,empresa_nombre_raw,fecha_recoleccion,empresas(nombre)'
    )

    const recRechazadas = await sbGet<{ id: string }>(
      'recolecciones',
      'estado=eq.RECHAZADO&select=id'
    )

    // IDs de recolecciones aprobadas
    const idsAprobadas = recAprobadas.map(r => r.id)

    // ── 2. Detalles de materiales (solo de aprobadas) ───────────────────
    let detalles: { cantidad: number; recoleccion_id: string; materiales: { nombre: string; color_hex: string } | null }[] = []
    if (idsAprobadas.length > 0) {
      const chunkSize = 100
      for (let i = 0; i < idsAprobadas.length; i += chunkSize) {
        const chunk = idsAprobadas.slice(i, i + chunkSize)
        const rows = await sbGet<{ cantidad: number; recoleccion_id: string; materiales: { nombre: string; color_hex: string } | null }>(
          'detalle_recoleccion',
          `recoleccion_id=in.(${chunk.join(',')})&select=cantidad,recoleccion_id,materiales(nombre,color_hex)`
        )
        detalles.push(...rows)
      }
    }

    // ── 3. Calcular totales ─────────────────────────────────────────────
    const totalKg   = detalles.reduce((s, d) => s + Number(d.cantidad || 0), 0)
    const totalCo2  = totalKg * CO2_FACTOR
    const totalRec  = recAprobadas.length
    const rechazadas = recRechazadas.length

    // Este mes
    const now  = new Date()
    const anio = now.getFullYear()
    const mes  = now.getMonth() + 1
    const recEstesMes = recAprobadas.filter(r => {
      const [y, m] = (r.fecha_recoleccion || '').split('-').map(Number)
      return y === anio && m === mes
    }).length

    // ── 4. Empresas activas ─────────────────────────────────────────────
    const empresasActivas = new Set(
      recAprobadas.filter(r => r.empresa_id).map(r => r.empresa_id)
    ).size

    // ── 5. Materiales breakdown ─────────────────────────────────────────
    const porMaterial: Record<string, { kg: number; color: string }> = {}
    for (const d of detalles) {
      const nombre = d.materiales?.nombre ?? 'Otro'
      const color  = d.materiales?.color_hex ?? '#9ca3af'
      if (!porMaterial[nombre]) porMaterial[nombre] = { kg: 0, color }
      porMaterial[nombre].kg += Number(d.cantidad || 0)
    }
    const materiales = Object.entries(porMaterial)
      .sort((a, b) => b[1].kg - a[1].kg)
      .slice(0, 8)
      .map(([nombre, { kg, color }]) => ({
        nombre,
        kg:    Math.round(kg * 10) / 10,
        co2:   Math.round(kg * CO2_FACTOR * 10) / 10,
        color,
      }))

    // ── 6. Ranking de empresas (calculado desde detalles) ───────────────
    const porEmpresa: Record<string, { nombre: string; kg: number; empresa_id: string }> = {}
    for (const rec of recAprobadas) {
      const key   = rec.empresa_id || 'ext_' + (rec.empresa_nombre_raw || 'desconocido')
      const nombre = rec.empresas?.nombre || rec.empresa_nombre_raw || 'Sin empresa'
      if (!porEmpresa[key]) porEmpresa[key] = { nombre, kg: 0, empresa_id: rec.empresa_id || '' }
    }
    // Acumular kg por empresa desde detalles
    const detallesPorRec: Record<string, number> = {}
    for (const d of detalles) {
      detallesPorRec[d.recoleccion_id] = (detallesPorRec[d.recoleccion_id] || 0) + Number(d.cantidad || 0)
    }
    for (const rec of recAprobadas) {
      const key = rec.empresa_id || 'ext_' + (rec.empresa_nombre_raw || 'desconocido')
      if (porEmpresa[key]) {
        porEmpresa[key].kg += detallesPorRec[rec.id] || 0
      }
    }
    const ranking = Object.values(porEmpresa)
      .map(e => ({
        empresa_id:  e.empresa_id,
        empresa:     e.nombre,
        total_kg:    Math.round(e.kg * 10) / 10,
        co2_ahorrado: Math.round(e.kg * CO2_FACTOR * 10) / 10,
      }))
      .sort((a, b) => b.total_kg - a.total_kg)
      .slice(0, 10)

    // ── 7. Externos ────────────────────────────────────────────────────
    const externos = await sbGet<{ nombre: string; total_kg: number }>(
      'contribuyentes_externos',
      'order=total_kg.desc&limit=5'
    )

    return NextResponse.json({
      totalKg:        Math.round(totalKg * 10) / 10,
      totalCo2:       Math.round(totalCo2 * 10) / 10,
      totalRec,
      recEstesMes,
      rechazadas,
      empresasActivas,
      materiales,
      ranking,
      externos,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
