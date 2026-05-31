import { NextResponse } from 'next/server'
import { sbGet } from '@/lib/supabase-server'

export async function GET() {
  try {
    // 1. Todas las recolecciones sin empresa_id registrada
    const recsExt = await sbGet<{
      id: string; empresa_nombre_raw: string | null; fecha_recoleccion: string; created_at: string
    }>('recolecciones',
      'empresa_id=is.null&estado=eq.APROBADO&select=id,empresa_nombre_raw,fecha_recoleccion,created_at&order=created_at.asc'
    )

    if (recsExt.length === 0) return NextResponse.json([])

    // 2. Detalles de materiales de esas recolecciones
    const ids = recsExt.map(r => r.id)
    let detalles: { cantidad: number; recoleccion_id: string; materiales: { nombre: string; color_hex: string } | null }[] = []
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100)
      const rows = await sbGet<typeof detalles[number]>(
        'detalle_recoleccion',
        `recoleccion_id=in.(${chunk.join(',')})&select=cantidad,recoleccion_id,materiales(nombre,color_hex)`
      )
      detalles.push(...rows)
    }

    // 3. Agrupar por nombre de empresa externa
    const gruposMap = new Map<string, {
      nombre: string; total_kg: number
      primera_vez: string; ultima_vez: string
      materiales: Map<string, { kg: number; color: string }>
    }>()

    for (const rec of recsExt) {
      const nombre = (rec.empresa_nombre_raw || 'Desconocido').trim()
      const key    = nombre.toLowerCase()

      if (!gruposMap.has(key)) {
        gruposMap.set(key, {
          nombre,
          total_kg:    0,
          primera_vez: rec.fecha_recoleccion || rec.created_at,
          ultima_vez:  rec.fecha_recoleccion || rec.created_at,
          materiales:  new Map(),
        })
      }

      const g = gruposMap.get(key)!

      // Actualizar fechas
      if ((rec.fecha_recoleccion || '') < g.primera_vez) g.primera_vez = rec.fecha_recoleccion
      if ((rec.fecha_recoleccion || '') > g.ultima_vez)  g.ultima_vez  = rec.fecha_recoleccion

      // Acumular materiales de esta recolección
      for (const d of detalles) {
        if (d.recoleccion_id !== rec.id) continue
        const mat = d.materiales
        if (!mat) continue
        const kg = Number(d.cantidad || 0)
        g.total_kg += kg
        const entry = g.materiales.get(mat.nombre)
        if (entry) entry.kg += kg
        else g.materiales.set(mat.nombre, { kg, color: mat.color_hex || '#9ca3af' })
      }
    }

    // 4. Convertir a array ordenado por kg desc
    const result = [...gruposMap.values()]
      .map(g => ({
        nombre:      g.nombre,
        total_kg:    Math.round(g.total_kg * 10) / 10,
        primera_vez: g.primera_vez,
        ultima_vez:  g.ultima_vez,
        materiales:  [...g.materiales.entries()]
          .map(([nombre, { kg, color }]) => ({ nombre, kg: Math.round(kg * 10) / 10, color }))
          .sort((a, b) => b.kg - a.kg),
      }))
      .sort((a, b) => b.total_kg - a.total_kg)

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
