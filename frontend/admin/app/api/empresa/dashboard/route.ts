import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY!

function headers() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }
}

async function sbGet<T>(table: string, query = ''): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: headers(),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
  return res.json()
}

export async function GET(req: NextRequest) {
  const empresa_id = req.nextUrl.searchParams.get('empresa_id')
  if (!empresa_id) {
    return NextResponse.json({ error: 'empresa_id requerido' }, { status: 400 })
  }

  try {
    const now  = new Date()
    const anio = now.getFullYear()
    const mes  = now.getMonth() + 1

    const [empresa, recolecciones, metricas, impacto] = await Promise.all([
      sbGet<{ id: string; nombre: string; sector: string | null; ciudad: string | null }>(
        'empresas',
        `id=eq.${empresa_id}&select=id,nombre,sector,ciudad&limit=1`
      ),
      sbGet<{ id: string; estado: string; fecha_recoleccion: string; ia_confidence: number | null; notas: string | null }>(
        'recolecciones',
        `empresa_id=eq.${empresa_id}&select=id,estado,fecha_recoleccion,ia_confidence,notas&order=created_at.desc&limit=5`
      ),
      sbGet<{ total_kg: number; co2_ahorrado: number; num_recolecciones: number }>(
        'metricas_mensuales',
        `empresa_id=eq.${empresa_id}&anio=eq.${anio}&mes=eq.${mes}&select=total_kg,co2_ahorrado,num_recolecciones`
      ),
      sbGet<{ co2_ahorrado: number; agua_ahorrada: number; energia_ahorrada: number; arboles_eq: number }>(
        'impacto_recoleccion',
        `recoleccion_id=in.(${await getRecoleccionIds(empresa_id)})`
      ).catch(() => []),
    ])

    // Estado counts
    const estadoCounts = await sbGet<{ estado: string }>(
      'recolecciones',
      `empresa_id=eq.${empresa_id}&select=estado`
    )
    const byEstado = estadoCounts.reduce((acc: Record<string, number>, r) => {
      acc[r.estado] = (acc[r.estado] || 0) + 1
      return acc
    }, {})

    const mes_kg  = metricas.reduce((s, m) => s + (m.total_kg || 0), 0)
    const mes_co2 = metricas.reduce((s, m) => s + (m.co2_ahorrado || 0), 0)
    const mes_rec = metricas.reduce((s, m) => s + (m.num_recolecciones || 0), 0)

    return NextResponse.json({
      empresa: empresa[0] ?? null,
      mes:     { kg: mes_kg, co2: mes_co2, recolecciones: mes_rec },
      estados: byEstado,
      recientes: recolecciones,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

async function getRecoleccionIds(empresa_id: string): Promise<string> {
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/recolecciones?empresa_id=eq.${empresa_id}&select=id`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }, cache: 'no-store' }
  )
  if (!res.ok) return ''
  const rows: { id: string }[] = await res.json()
  return rows.map(r => r.id).join(',') || 'null'
}
