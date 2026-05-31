import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY!

function hdrs(extra: Record<string, string> = {}) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, sector, ciudad, contacto, email, password } = await req.json()

    if (!nombre || !email || !password || !contacto) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
    }

    // 1. Crear usuario en Supabase Auth
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: hdrs(),
      body: JSON.stringify({ email, password, email_confirm: true }),
    })
    const authData = await authRes.json()
    if (!authRes.ok) {
      const msg = authData?.msg || authData?.message || 'Error al crear el usuario.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const userId = authData.id

    // 2. Crear empresa
    const empRes = await fetch(`${SUPABASE_URL}/rest/v1/empresas`, {
      method: 'POST',
      headers: hdrs({ Prefer: 'return=representation' }),
      body: JSON.stringify({ nombre, sector: sector || 'OTRO', ciudad: ciudad || 'Santa Cruz', contacto, email }),
    })
    const empData = await empRes.json()
    if (!empRes.ok) {
      // Rollback: eliminar usuario creado
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers: hdrs() })
      return NextResponse.json({ error: 'Error al crear la empresa.' }, { status: 500 })
    }
    const empresaId = Array.isArray(empData) ? empData[0]?.id : empData?.id

    // 3. Crear perfil
    const perfRes = await fetch(`${SUPABASE_URL}/rest/v1/perfiles`, {
      method: 'POST',
      headers: hdrs(),
      body: JSON.stringify({ user_id: userId, role: 'empresa', empresa_id: empresaId, nombre: contacto }),
    })
    if (!perfRes.ok) {
      return NextResponse.json({ error: 'Error al crear el perfil.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, empresa_id: empresaId })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
