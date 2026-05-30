import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY!

function hdrs() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }
}

export async function GET(req: NextRequest) {
  const empresa_id = req.nextUrl.searchParams.get('empresa_id')
  if (!empresa_id) {
    return NextResponse.json({ error: 'empresa_id requerido' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/recolecciones?empresa_id=eq.${empresa_id}&select=id,estado,fecha_recoleccion,mensaje_raw,imagen_url,notas,ia_confidence,extraido_por_ia,created_at&order=created_at.desc&limit=100`,
      { headers: hdrs(), cache: 'no-store' }
    )
    if (!res.ok) throw new Error(await res.text())
    return NextResponse.json(await res.json())
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
