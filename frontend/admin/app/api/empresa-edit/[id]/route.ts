import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY!

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    // Solo permite editar sector y contacto
    const allowed: Record<string, unknown> = {}
    if ('sector'   in body) allowed.sector   = body.sector
    if ('contacto' in body) allowed.contacto = body.contacto

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/empresas?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          apikey:        SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer:        'return=representation',
        },
        body: JSON.stringify(allowed),
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: await res.text() }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data[0] ?? {})
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
