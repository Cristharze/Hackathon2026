import { NextRequest, NextResponse } from 'next/server'
import { sbGet } from '@/lib/supabase-server'

const CO2_FACTOR = 2.5

export async function GET(req: NextRequest) {
  const empresa_id = req.nextUrl.searchParams.get('empresa_id')
  if (!empresa_id) {
    return NextResponse.json({ error: 'empresa_id requerido' }, { status: 400 })
  }

  try {
    const now  = new Date()
    const anio = now.getFullYear()
    const mes  = now.getMonth() + 1

    // ── 1. Info de la empresa ───────────────────────────────────────────
    const empresaRows = await sbGet<{
      id: string; nombre: string; sector: string | null; ciudad: string | null
    }>('empresas', `id=eq.${empresa_id}&select=id,nombre,sector,ciudad&limit=1`)

    // ── 2. Todas las recolecciones de esta empresa ──────────────────────
    const recolecciones = await sbGet<{
      id: string; estado: string; fecha_recoleccion: string
      ia_confidence: number | null; notas: string | null
    }>(
      'recolecciones',
      `empresa_id=eq.${empresa_id}&select=id,estado,fecha_recoleccion,ia_confidence,notas&order=created_at.desc`
    )

    // ── 3. Detalles de materiales (solo aprobadas) ──────────────────────
    const idsAprobadas = recolecciones
      .filter(r => r.estado === 'APROBADO')
      .map(r => r.id)

    let detalles: { cantidad: number; recoleccion_id: string }[] = []
    if (idsAprobadas.length > 0) {
      detalles = await sbGet<{ cantidad: number; recoleccion_id: string }>(
        'detalle_recoleccion',
        `recoleccion_id=in.(${idsAprobadas.join(',')})&select=cantidad,recoleccion_id`
      )
    }

    // ── 4. Kg y CO₂ de este mes ─────────────────────────────────────────
    const recEstesMes = recolecciones.filter(r => {
      if (r.estado !== 'APROBADO') return false
      const [y, m] = (r.fecha_recoleccion || '').split('-').map(Number)
      return y === anio && m === mes
    })
    const idsMes = new Set(recEstesMes.map(r => r.id))

    const kgMes  = detalles
      .filter(d => idsMes.has(d.recoleccion_id))
      .reduce((s, d) => s + Number(d.cantidad || 0), 0)
    const co2Mes = kgMes * CO2_FACTOR

    // ── 5. Totales acumulados ───────────────────────────────────────────
    const kgTotal  = detalles.reduce((s, d) => s + Number(d.cantidad || 0), 0)
    const co2Total = kgTotal * CO2_FACTOR

    // ── 6. Conteo por estado ────────────────────────────────────────────
    const byEstado = recolecciones.reduce((acc: Record<string, number>, r) => {
      acc[r.estado] = (acc[r.estado] || 0) + 1
      return acc
    }, {})

    // ── 7. Últimas recolecciones ────────────────────────────────────────
    const recientes = recolecciones.slice(0, 5)

    return NextResponse.json({
      empresa: empresaRows[0] ?? null,
      mes: {
        kg:            Math.round(kgMes * 10) / 10,
        co2:           Math.round(co2Mes * 10) / 10,
        recolecciones: recEstesMes.length,
      },
      totales: {
        kg:  Math.round(kgTotal * 10) / 10,
        co2: Math.round(co2Total * 10) / 10,
      },
      estados:   byEstado,
      recientes,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
