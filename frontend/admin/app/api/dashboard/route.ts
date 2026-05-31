import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY!

function hdrs() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }
}

async function sbGet<T>(table: string, query = ''): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: hdrs(), cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export async function GET() {
  try {
    const [detalles, recolecciones, empresas, externos] = await Promise.all([
      // Total kg por material — join a recolecciones APROBADO
      sbGet<{ cantidad: number; materiales: { nombre: string; color_hex: string } | null }>(
        'detalle_recoleccion',
        'select=cantidad,materiales(nombre,color_hex)&recolecciones.estado=eq.APROBADO'
      ),
      // Recolecciones aprobadas con empresa_id
      sbGet<{ empresa_id: string | null; fecha_recoleccion: string }>(
        'recolecciones',
        'estado=eq.APROBADO&select=empresa_id,fecha_recoleccion'
      ),
      // Ranking empresas por CO2
      sbGet<{ empresa_id: string; empresa: string; co2_ahorrado: number; total_kg: number }>(
        'vista_impacto_empresas',
        'order=co2_ahorrado.desc&limit=10'
      ),
      // Externos
      sbGet<{ nombre: string; total_kg: number }>(
        'contribuyentes_externos',
        'order=total_kg.desc&limit=5'
      ),
    ])

    // Totales acumulados
    const totalKg  = detalles.reduce((s, d) => s + Number(d.cantidad || 0), 0)
    const totalRec = recolecciones.length
    const empresasActivas = new Set(
      recolecciones.filter(r => r.empresa_id).map(r => r.empresa_id)
    ).size

    // CO2: 1 kg material reciclado ≈ 2.5 kg CO2 equivalente (factor estándar)
    const totalCo2 = totalKg * 2.5

    // Recolecciones este mes
    const now  = new Date()
    const anio = now.getFullYear()
    const mes  = now.getMonth() + 1
    const recEstesMes = recolecciones.filter(r => {
      const [y, m] = r.fecha_recoleccion.split('-').map(Number)
      return y === anio && m === mes
    }).length

    // Materiales breakdown
    const porMaterial: Record<string, { kg: number; color: string }> = {}
    for (const d of detalles) {
      const nombre = d.materiales?.nombre ?? 'Otro'
      const color  = d.materiales?.color_hex ?? '#9ca3af'
      if (!porMaterial[nombre]) porMaterial[nombre] = { kg: 0, color }
      porMaterial[nombre].kg += Number(d.cantidad || 0)
    }
    const materiales = Object.entries(porMaterial)
      .sort((a, b) => b[1].kg - a[1].kg)
      .slice(0, 6)
      .map(([nombre, { kg, color }]) => ({ nombre, kg: Math.round(kg * 10) / 10, color }))

    return NextResponse.json({
      totalKg:        Math.round(totalKg * 10) / 10,
      totalCo2:       Math.round(totalCo2 * 10) / 10,
      totalRec,
      recEstesMes,
      empresasActivas,
      materiales,
      ranking:   empresas,
      externos,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
