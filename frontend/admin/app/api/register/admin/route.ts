import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY!
const ADMIN_CODE   = process.env.FUNDARES_ADMIN_CODE || 'FUNDARES2026'

function hdrs() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, password, codigo } = await req.json()

    if (!nombre || !email || !password || !codigo) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
    }

    if (codigo.trim().toUpperCase() !== ADMIN_CODE.trim().toUpperCase()) {
      return NextResponse.json({ error: 'Código de verificación incorrecto.' }, { status: 403 })
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

    // 2. Crear perfil admin
    const perfRes = await fetch(`${SUPABASE_URL}/rest/v1/perfiles`, {
      method: 'POST',
      headers: hdrs(),
      body: JSON.stringify({ user_id: userId, role: 'admin', nombre }),
    })
    if (!perfRes.ok) {
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers: hdrs() })
      return NextResponse.json({ error: 'Error al crear el perfil.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
