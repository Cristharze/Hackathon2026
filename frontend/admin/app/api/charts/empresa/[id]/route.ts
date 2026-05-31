import { NextResponse } from 'next/server'
import { sbGet } from '@/lib/supabase-server'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // 1. Recolecciones aprobadas de esta empresa
    const recolecciones = await sbGet<{
      id: string; fecha_recoleccion: string
    }>('recolecciones', `empresa_id=eq.${id}&estado=eq.APROBADO&select=id,fecha_recoleccion`)

    if (recolecciones.length === 0) {
      return NextResponse.json({ monthly: [], materiales: [], total_kg: 0 })
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

    // 3. Kg por mes
    const detallesPorRec = new Map<string, number>()
    for (const d of detalles) {
      detallesPorRec.set(d.recoleccion_id, (detallesPorRec.get(d.recoleccion_id) || 0) + Number(d.cantidad || 0))
    }

    const monthly = new Map<string, number>()
    for (const rec of recolecciones) {
      const kg  = detallesPorRec.get(rec.id) || 0
      const mes = mesKey(rec.fecha_recoleccion)
      monthly.set(mes, (monthly.get(mes) || 0) + kg)
    }

    // 4. Por material
    const porMaterial = new Map<string, { kg: number; color: string }>()
    for (const d of detalles) {
      const mat = d.materiales
      if (!mat) continue
      const entry = porMaterial.get(mat.nombre)
      if (entry) entry.kg += Number(d.cantidad || 0)
      else porMaterial.set(mat.nombre, { kg: Number(d.cantidad || 0), color: mat.color_hex || '#9ca3af' })
    }

    // 5. Rango desde primera fecha hasta hoy
    const fechas = recolecciones.map(r => new Date(r.fecha_recoleccion)).filter(d => !isNaN(d.getTime()))
    const minFecha = fechas.length > 0 ? new Date(Math.min(...fechas.map(d => d.getTime()))) : new Date()
    const meses = rangoMeses(minFecha, new Date())

    const monthlySeries = meses.map(m => ({ mes: m, kg: Math.round((monthly.get(m) || 0) * 10) / 10 }))

    const materialesList = [...porMaterial.entries()]
      .map(([nombre, { kg, color }]) => ({ nombre, kg: Math.round(kg * 10) / 10, color }))
      .sort((a, b) => b.kg - a.kg)

    const totalKg = materialesList.reduce((s, m) => s + m.kg, 0)

    return NextResponse.json({
      monthly:    monthlySeries,
      materiales: materialesList,
      total_kg:   Math.round(totalKg * 10) / 10,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
