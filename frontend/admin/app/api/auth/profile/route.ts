import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY!

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify the token and get the user
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SERVICE_KEY },
  })
  if (!userRes.ok) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  const user = await userRes.json()

  // Try to get the profile from `perfiles` table
  try {
    const profRes = await fetch(
      `${SUPABASE_URL}/rest/v1/perfiles?user_id=eq.${user.id}&select=*&limit=1`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )
    if (profRes.ok) {
      const rows: Array<{
        user_id: string
        role: 'admin' | 'empresa'
        empresa_id?: string | null
        nombre?: string | null
      }> = await profRes.json()

      if (rows.length > 0) {
        return NextResponse.json({
          user_id:    rows[0].user_id,
          role:       rows[0].role,
          empresa_id: rows[0].empresa_id ?? null,
          nombre:     rows[0].nombre ?? null,
          email:      user.email ?? null,
        })
      }
    }
  } catch {}

  // Fallback: use Supabase user_metadata
  const role       = (user.user_metadata?.role as 'admin' | 'empresa') ?? 'empresa'
  const empresa_id = user.user_metadata?.empresa_id ?? null
  const nombre     = user.user_metadata?.nombre ?? null

  return NextResponse.json({
    user_id: user.id,
    role,
    empresa_id,
    nombre,
    email: user.email ?? null,
  })
}
