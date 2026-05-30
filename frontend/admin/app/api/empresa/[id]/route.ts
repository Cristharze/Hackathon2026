import { NextResponse } from 'next/server'
import { sbGet } from '@/lib/supabase-server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const [empresa, recolecciones, metricas] = await Promise.all([
      sbGet('empresas', `id=eq.${id}&limit=1`),
      sbGet('recolecciones', `empresa_id=eq.${id}&order=fecha_recoleccion.desc&limit=20`),
      sbGet('metricas_mensuales', `empresa_id=eq.${id}&order=anio.asc&order=mes.asc`),
    ])
    return NextResponse.json({
      empresa: empresa[0] ?? null,
      recolecciones,
      metricas,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
