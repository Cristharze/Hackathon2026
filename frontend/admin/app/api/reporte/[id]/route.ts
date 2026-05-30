import { NextResponse } from 'next/server'
import { sbGet } from '@/lib/supabase-server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const anio = new Date().getFullYear()

    const [empresa, metricas, recAprobadas] = await Promise.all([
      sbGet('empresas', `id=eq.${id}&limit=1`),
      sbGet('metricas_mensuales', `empresa_id=eq.${id}&anio=eq.${anio}&order=mes.asc`),
      sbGet<{ id: string }>('recolecciones', `empresa_id=eq.${id}&estado=eq.APROBADO&select=id`),
    ])

    const ids = recAprobadas.map(r => r.id)
    let impacto: unknown[] = []
    if (ids.length > 0) {
      impacto = await sbGet('impacto_recoleccion', `recoleccion_id=in.(${ids.join(',')})`)
    }

    return NextResponse.json({ empresa: empresa[0] ?? null, metricas, impacto })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
