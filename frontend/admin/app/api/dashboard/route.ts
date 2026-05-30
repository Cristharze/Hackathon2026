import { NextResponse } from 'next/server'
import { sbGet } from '@/lib/supabase-server'

export async function GET() {
  try {
    const now = new Date()
    const anio = now.getFullYear()
    const mes  = now.getMonth() + 1

    const [pendientes, metricas, impacto] = await Promise.all([
      sbGet<{ id: string }>('recolecciones', 'estado=eq.PENDIENTE&select=id'),
      sbGet('metricas_mensuales', `anio=eq.${anio}&mes=eq.${mes}`),
      sbGet('vista_impacto_empresas', 'order=co2_ahorrado.desc&limit=10'),
    ])

    return NextResponse.json({
      pendientes: pendientes.length,
      metricas,
      impacto,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
