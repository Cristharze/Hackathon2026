import { NextResponse } from 'next/server'
import { sbGet } from '@/lib/supabase-server'

export async function GET() {
  try {
    // 1. Externos registrados
    const externos = await sbGet<{
      id: string; nombre: string; total_kg: number
      primera_vez: string; ultima_vez: string
    }>('contribuyentes_externos', 'order=total_kg.desc')

    if (externos.length === 0) return NextResponse.json([])

    // 2. Recolecciones sin empresa_id (externas)
    const recsExt = await sbGet<{
      id: string; empresa_nombre_raw: string | null; fecha_recoleccion: string
    }>('recolecciones',
      'empresa_id=is.null&estado=eq.APROBADO&select=id,empresa_nombre_raw,fecha_recoleccion'
    )

    if (recsExt.length === 0) return NextResponse.json(externos.map(e => ({ ...e, materiales: [] })))

    // 3. Detalles de materiales de esas recolecciones
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

    // 4. Mapa recoleccion → nombre externo
    const recNombre = new Map(recsExt.map(r => [r.id, (r.empresa_nombre_raw || '').toLowerCase()]))

    // 5. Para cada externo, acumular materiales
    const result = externos.map(ext => {
      const nombreLow = ext.nombre.toLowerCase()

      // IDs de recolecciones que corresponden a este externo
      const recIds = new Set(
        recsExt
          .filter(r => (r.empresa_nombre_raw || '').toLowerCase().includes(nombreLow) ||
                       nombreLow.includes((r.empresa_nombre_raw || '').toLowerCase()))
          .map(r => r.id)
      )

      // Materiales de esas recolecciones
      const matMap = new Map<string, { kg: number; color: string }>()
      for (const d of detalles) {
        if (!recIds.has(d.recoleccion_id)) continue
        const mat = d.materiales
        if (!mat) continue
        const entry = matMap.get(mat.nombre)
        if (entry) entry.kg += Number(d.cantidad || 0)
        else matMap.set(mat.nombre, { kg: Number(d.cantidad || 0), color: mat.color_hex || '#9ca3af' })
      }

      const materiales = [...matMap.entries()]
        .map(([nombre, { kg, color }]) => ({ nombre, kg: Math.round(kg * 10) / 10, color }))
        .sort((a, b) => b.kg - a.kg)

      return { ...ext, materiales }
    })

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
