import { NextResponse } from 'next/server'
import { sbGet } from '@/lib/supabase-server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY!

const headers = () => ({
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/recolecciones?id=eq.${id}`,
    { method: 'PATCH', headers: headers(), body: JSON.stringify(body) }
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/recolecciones?id=eq.${id}`,
    { method: 'DELETE', headers: headers() }
  )
  return NextResponse.json({ ok: true }, { status: res.ok ? 200 : res.status })
}
