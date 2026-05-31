import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY!

function hdrs(extra: Record<string, string> = {}) {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', ...extra }
}

async function getUser(token: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SERVICE_KEY },
  })
  if (!res.ok) return null
  return res.json()
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await getUser(token)
  if (!user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const [perfRes, empresaRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/perfiles?user_id=eq.${user.id}&select=*&limit=1`, { headers: hdrs(), cache: 'no-store' }),
    Promise.resolve(null), // empresa loaded below if needed
  ])

  const perfiles: { role: string; empresa_id?: string; nombre?: string }[] = perfRes.ok ? await perfRes.json() : []
  const perfil = perfiles[0]

  let empresa = null
  if (perfil?.empresa_id) {
    const eRes = await fetch(`${SUPABASE_URL}/rest/v1/empresas?id=eq.${perfil.empresa_id}&select=*&limit=1`, { headers: hdrs(), cache: 'no-store' })
    const rows = eRes.ok ? await eRes.json() : []
    empresa = rows[0] ?? null
  }

  return NextResponse.json({ user: { id: user.id, email: user.email }, perfil, empresa })
}

export async function PATCH(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await getUser(token)
  if (!user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const body = await req.json()
  const { nombre, empresa } = body

  // Update perfil nombre
  if (nombre !== undefined) {
    await fetch(`${SUPABASE_URL}/rest/v1/perfiles?user_id=eq.${user.id}`, {
      method: 'PATCH',
      headers: hdrs({ Prefer: 'return=representation' }),
      body: JSON.stringify({ nombre }),
    })
  }

  // Update empresa if provided
  if (empresa && empresa.id) {
    const { id, ...empresaFields } = empresa
    await fetch(`${SUPABASE_URL}/rest/v1/empresas?id=eq.${id}`, {
      method: 'PATCH',
      headers: hdrs({ Prefer: 'return=representation' }),
      body: JSON.stringify(empresaFields),
    })
  }

  return NextResponse.json({ ok: true })
}
